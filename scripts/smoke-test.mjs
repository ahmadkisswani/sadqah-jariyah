// اختبار دخاني حقيقي (واجهة + صوت) لصفحة القرآن، والرقية، ومواقيت الصلاة.
//
// يُشغّل متصفحًا (Chrome/Edge) بدون واجهة على نسخة الإنتاج المبنية في dist/،
// ويحاكي شاشة جوال، ثم يتحقّق من:
//   1) عرض صفحات المصحف (ترويسة الصفحة، إطار السورة، أرقام الآيات).
//   2) تبديل طرق العرض (صفحات / متصل / بطاقات).
//   3) تشغيل التلاوة بلمسة حقيقية على رقم الآية، وتقدّم الوقت فعليًا.
//   4) الانتقال التلقائي للآية التالية عند انتهاء المقطع.
//   5) تغيير القارئ أثناء التشغيل.
//   6) الرقية: مشغّل واحد فقط يعمل في كل مرة.
//   7) مواقيت الصلاة: الصلوات الخمس، العدّ التنازلي، الموقع (GPS مُحاكى)،
//      التقويم الشهري وتفاصيل اليوم، تبديل المذهب، والتعامل مع انقطاع الشبكة.
//   8) الموجة الأولى: القبلة، التقويم الهجري المستقل، بطاقات المواقيت،
//      وتذكير الصلاة بلا طلب إذن تلقائي.
//   9) المساجد القريبة: لا بحث تلقائي، ثم رد Overpass مُحاكى وخريطة كسولة.
//
// الاستخدام:  node scripts/smoke-test.mjs  [--url http://localhost:4173] [--fast]
// (بلا --url يشغّل خادم المعاينة تلقائيًا ثم يوقفه)

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const FAST = args.includes("--fast");
const PORT = 4173;
const BASE_URL = argValue("--url", `http://localhost:${PORT}`);

const results = [];
/** أخطاء وحدة التحكّم في الصفحة — تُطبع عند الفشل */
const pageErrors = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------ المتصفح ------------------------------ */

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  return candidates.find((path) => existsSync(path)) ?? null;
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const type = response.headers.get("content-type") ?? "";
        return type.includes("json") ? await response.json() : null;
      }
    } catch {
      /* لم يجهز بعد */
    }
    await sleep(250);
  }
  throw new Error(`انتهت المهلة بانتظار ${url}`);
}

/* ------------------------------ CDP ------------------------------ */

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) {
        const handlers = this.listeners.get(message.method);
        if (handlers) {
          for (const handler of [...handlers]) {
            try {
              handler(message.params ?? {});
            } catch {
              /* حدث غير قابل للمعالجة */
            }
          }
        }
        return;
      }
      const resolver = this.pending.get(message.id);
      if (!resolver) return;
      this.pending.delete(message.id);
      if (message.error) resolver.reject(new Error(JSON.stringify(message.error)));
      else resolver.resolve(message.result);
    });
  }

  /** الاستماع إلى أحداث CDP (مثل Fetch.requestPaused) وإرجاع دالة لإلغاء الاشتراك. */
  on(method, handler) {
    const handlers = this.listeners.get(method) ?? new Set();
    handlers.add(handler);
    this.listeners.set(method, handlers);
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) this.listeners.delete(method);
    };
  }

  static async connect(wsUrl) {
    const socket = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    return new Cdp(socket);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`انتهت مهلة ${method}`));
      }, 30_000);
    });
  }

  /** تقييم جافاسكربت في الصفحة وإرجاع قيمة بسيطة. */
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      const exception = result.exceptionDetails.exception;
      const description = exception?.description ?? exception?.value ?? result.exceptionDetails.text;
      throw new Error(
        `فشل التقييم: ${String(description).split("\n")[0]} — التعبير: ${String(expression).slice(0, 160)}`,
      );
    }
    return result.result.value;
  }

  /** نقر حقيقي (حدث موثوق) في وسط العنصر — كما يفعل المستخدم. */
  async click(selector) {
    return this.clickAt(selector);
  }

  /** نقر أول عنصر يطابق المحدد ويحتوي النص المطلوب. */
  async clickText(selector, text) {
    return this.clickAt(selector, text);
  }

  async clickAt(selector, text = null) {
    const box = await this.evaluate(`(() => {
      const nodes = [...document.querySelectorAll(${JSON.stringify(selector)})];
      const el = ${text === null ? "nodes[0]" : `nodes.find((n) => n.textContent.includes(${JSON.stringify(text)}))`};
      if (!el) return null;
      el.scrollIntoView({ block: "center", behavior: "instant" });
      const r = el.getBoundingClientRect();
      // إحداثيات النقر في CDP نسبةً إلى نافذة العرض المرئية لا إلى الصفحة
      const vv = window.visualViewport;
      return { x: r.left + r.width / 2 - (vv ? vv.offsetLeft : 0), y: r.top + r.height / 2 - (vv ? vv.offsetTop : 0) };
    })()`);
    if (!box) throw new Error(`لم يُعثر على العنصر: ${selector}${text ? ` («${text}»)` : ""}`);
    const params = { x: Math.round(box.x), y: Math.round(box.y), button: "left", clickCount: 1 };
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", ...params });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...params });
  }

  async waitFor(expression, { timeoutMs = 15_000, intervalMs = 250, label = expression } = {}) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.evaluate(expression)) return true;
      await sleep(intervalMs);
    }
    throw new Error(`انتهت المهلة بانتظار: ${label}`);
  }
}

/* ------------------------------ أدوات ------------------------------ */

/** توحيد النص العربي: حذف التشكيل وتوحيد صور الألف — للمقارنة فقط. */
const normalizeArabic = (value) =>
  value
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[\u0671\u0622\u0623\u0625]/g, "ا")
    .replace(/\s+/g, " ")
    .trim();

/** نفس التوحيد لكن داخل الصفحة (للتقييم في المتصفح). */
const NORMALIZED_BODY = `((value) => value
  .replace(/[\\u064B-\\u0652\\u0670\\u0640]/g, "")
  .replace(/[\\u0671\\u0622\\u0623\\u0625]/g, "ا")
  .replace(/\\s+/g, " ")
  .trim())(document.body?.innerText ?? "")`;

const barText = `document.querySelector('section[aria-label="مشغّل التلاوة"]')?.innerText ?? ""`;

const parsePositionSeconds = `(() => {
  const text = ${barText};
  const time = text.split("/")[0] ?? "";
  const digits = "٠١٢٣٤٥٦٧٨٩";
  const ascii = time.replace(/[٠-٩]/g, (d) => String(digits.indexOf(d)));
  const match = /(\\d+):(\\d+)/.exec(ascii);
  return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
})()`;

/** يحوّل الأرقام العربية الهندية إلى ASCII — لقراءة أرقام الواجهة في الاختبار. */
const arabicToAscii = (value) =>
  value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

/* ------------------------------ التشغيل ------------------------------ */

let previewProcess = null;
let browserProcess = null;
let profileDir = null;
let browser;

try {
  // 1) خادم المعاينة
  if (args.includes("--url")) {
    await waitForHttp(BASE_URL, 5_000);
  } else {
    if (!existsSync("dist/index.html")) {
      throw new Error("لا توجد نسخة مبنية — شغّل npm run build أولًا.");
    }
    previewProcess = spawn(
      process.execPath,
      ["node_modules/vite/bin/vite.js", "preview", "--port", String(PORT), "--strictPort"],
      { stdio: "ignore" },
    );
    await waitForHttp(BASE_URL, 30_000);
    console.log(`خادم المعاينة يعمل على ${BASE_URL}\n`);
  }

  // 2) المتصفح
  const browserPath = findBrowser();
  if (!browserPath) {
    console.log("SKIP  لم يُعثر على Chrome أو Edge — تخطّي الاختبار الدخاني للصفحة.");
    process.exit(0);
  }

  profileDir = mkdtempSync(join(tmpdir(), "sj-smoke-"));
  const debugPort = 9333;
  browserProcess = spawn(
    browserPath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--mute-audio",
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${debugPort}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`, 30_000);

  let target;
  try {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, {
      method: "PUT",
    });
    target = await response.json();
  } catch {
    target = await (
      await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`)
    ).json();
  }

  browser = await Cdp.connect(target.webSocketDebuggerUrl);
  await browser.send("Page.enable");
  await browser.send("Runtime.enable");

  // تسجيل أخطاء الصفحة لتظهر في حال فشل الاختبار
  browser.socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") {
      pageErrors.push(message.params.exceptionDetails?.exception?.description ?? "خطأ غير معروف");
    }
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      pageErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    }
  });
  // شاشة جوال بحجم iPhone تقريبًا
  await browser.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });

  // 3) صفحة سورة الإخلاص (صفحة المصحف ٦٠٤)
  await browser.send("Page.navigate", { url: `${BASE_URL}/quran/112` });
  const ikhlas = normalizeArabic("قُلْ هُوَ اللَّهُ أَحَدٌ");
  await browser.waitFor(`${NORMALIZED_BODY}.includes(${JSON.stringify(ikhlas)})`, {
    timeoutMs: 25_000,
    label: "ظهور نص سورة الإخلاص",
  });

  const bodyText = normalizeArabic(await browser.evaluate("document.body.innerText"));
  check("تُعرض السورة في صفحة مصحف", bodyText.includes(ikhlas));
  check("ترويسة الصفحة تعرض اسم السورة", bodyText.includes(normalizeArabic("سورة الإخلاص")));
  check("ترويسة الصفحة تعرض رقم صفحة المصحف", bodyText.includes(normalizeArabic("الصفحة ٦٠٤")));
  check("ترويسة الصفحة تعرض الجزء", bodyText.includes(normalizeArabic("الجزء ٣٠")));

  const medallions = await browser.evaluate(
    `document.querySelectorAll('button[aria-label^="استماع للآية"]').length`,
  );
  check("لكل آية علامة دائرية لرقمها (٤ آيات)", medallions === 4, `العدد: ${medallions}`);

  const justified = await browser.evaluate(`(() => {
    const page = document.querySelector('article[aria-label^="صفحة"]');
    if (!page) return null;
    const node = [...page.querySelectorAll("div")].find(
      (el) => getComputedStyle(el).textAlign === "justify",
    );
    if (!node) return null;
    const style = getComputedStyle(node);
    return { align: style.textAlign, family: style.fontFamily, direction: style.direction };
  })()`);
  check(
    "نص الصفحة مضبوط (justify) بخط قرآني",
    justified?.align === "justify" && /Amiri/.test(justified?.family ?? ""),
    JSON.stringify(justified),
  );

  // اختيار الآية من لوحة المفاتيح (Enter/Space) لا بالفأرة فقط
  await browser.evaluate(
    `document.querySelector('[role="button"][aria-label^="تحديد الآية"]')?.focus()`,
  );
  await browser.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
    nativeVirtualKeyCode: 32,
  });
  await browser.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
    nativeVirtualKeyCode: 32,
  });
  await sleep(300);
  const keyboardSelected = await browser.evaluate(
    `document.querySelector('[role="button"][aria-label^="تحديد الآية"]')?.getAttribute("aria-pressed")`,
  );
  check("اختيار آية المصحف بلوحة المفاتيح يعمل", keyboardSelected === "true");

  // 4) طرق العرض الثلاثة
  await browser.click('button[aria-label="عرض السورة متصلة في صفحة واحدة"]');
  await sleep(400);
  const flowText = normalizeArabic(await browser.evaluate("document.body.innerText"));
  check(
    "العرض المتصل: السورة كاملة في صفحة واحدة (بلا ترويسة صفحات)",
    flowText.includes(ikhlas) && !flowText.includes(normalizeArabic("الصفحة ٦٠٤")),
  );

  await browser.click('button[aria-label="عرض الآيات في بطاقات"]');
  await sleep(400);
  const cardsText = normalizeArabic(await browser.evaluate("document.body.innerText"));
  check(
    "عرض البطاقات يعمل",
    cardsText.includes(ikhlas) && cardsText.includes(normalizeArabic("٤ آية")),
  );

  await browser.click('button[aria-label="عرض صفحات المصحف"]');
  await sleep(400);

  // 5) التلاوة — على سورة الفاتحة (٧ آيات) لإتاحة وقت كافٍ للتحقّق
  await browser.send("Page.navigate", { url: `${BASE_URL}/quran/1` });
  const fatiha = normalizeArabic("الْحَمْدُ لِلَّهِ رَبِّ");
  await browser.waitFor(`${NORMALIZED_BODY}.includes(${JSON.stringify(fatiha)})`, {
    timeoutMs: 25_000,
    label: "ظهور نص سورة الفاتحة",
  });

  /** رقم الآية المعروضة في شريط التلاوة. */
  const readAyah = async () => {
    const text = await browser.evaluate(barText);
    const match = /— الآية ([٠-٩]+)/.exec(text);
    return match ? Number(arabicToAscii(match[1])) : 0;
  };

  /** يتحقّق أن الصوت يتقدّم فعلًا: نمو موضع التشغيل أو انتقال لآية تالية. */
  const waitForProgress = async (startAyah) => {
    let previous = await browser.evaluate(parsePositionSeconds);
    for (let attempt = 0; attempt < 15; attempt += 1) {
      await sleep(1_000);
      const position = await browser.evaluate(parsePositionSeconds);
      const ayah = await readAyah();
      if (ayah > startAyah || position > previous + 0.4) return true;
      previous = position;
    }
    return false;
  };

  const pressKey = async (key, code, keyCode) => {
    const params = { windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, key, code };
    await browser.send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...params });
    await browser.send("Input.dispatchKeyEvent", { type: "keyUp", ...params });
  };

  // لمس رقم الآية الأولى يشغّل تلاوتها
  await browser.click('button[aria-label="استماع للآية 1"]');
  await browser.waitFor(`document.querySelector('section[aria-label="مشغّل التلاوة"]') !== null`, {
    timeoutMs: 8_000,
    label: "ظهور شريط التلاوة",
  });

  let started = false;
  try {
    await browser.waitFor(`/يُتلى الآن/.test(${barText})`, {
      timeoutMs: 12_000,
      label: "حالة التشغيل في الشريط",
    });
    started = true;
  } catch {
    started = false;
  }
  const barAfterStart = await browser.evaluate(barText);
  check(
    "التلاوة تبدأ فعليًا عند لمس رقم الآية",
    started,
    started ? "" : barAfterStart.replace(/\n/g, " | "),
  );

  check("التلاوة تتقدّم (الملف الصوتي يعمل فعلًا)", await waitForProgress(1));
  check(
    "شريط التلاوة يعرض السورة ورقم الآية",
    /سورة الفاتحة — الآية [١-٧]/.test(await browser.evaluate(barText)),
  );

  // 6) مشغّل النظام البديل يستخدم رابط الآية المعروضة (بعد الإيقاف المؤقت ليستقرّ العرض)
  await browser.click('button[aria-label="إيقاف مؤقت للتلاوة"]');
  await sleep(600);
  const pausedAyah = await readAyah();
  await browser.click('button[aria-label="إظهار مشغّل النظام"]');
  await browser.waitFor(`!!document.querySelector('audio[controls]')`, {
    timeoutMs: 5_000,
    label: "مشغّل النظام البديل",
  });
  const src = await browser.evaluate(
    `document.querySelector('audio[controls]')?.getAttribute("src") ?? null`,
  );
  check(
    "رابط التلاوة يطابق الآية المعروضة",
    typeof src === "string" &&
      src ===
        `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${pausedAyah}.mp3`,
    `${String(src)} (الآية ${pausedAyah})`,
  );
  await browser.click('button[aria-label="إظهار مشغّل النظام"]');
  await browser.click('button[aria-label="تشغيل التلاوة"]');
  await browser.waitFor(`/يُتلى الآن/.test(${barText})`, {
    timeoutMs: 10_000,
    label: "استئناف التلاوة",
  });

  // 7) تغيير القارئ أثناء التشغيل
  const openReciterMenu = async () => {
    for (const [key, code, keyCode] of [
      ["Enter", "Enter", 13],
      ["ArrowDown", "ArrowDown", 40],
      [" ", "Space", 32],
    ]) {
      await browser.evaluate(`(() => {
        const el = document.querySelector('section[aria-label="مشغّل التلاوة"] div[role="combobox"]');
        if (el) el.focus();
        return !!el;
      })()`);
      await pressKey(key, code, keyCode);
      await sleep(450);
      if (await browser.evaluate(`!!document.querySelector('[role="option"]')`)) return true;
    }
    return false;
  };

  let switched = false;
  let reciterNote = "";
  for (let attempt = 0; attempt < 3 && !switched; attempt += 1) {
    if (!(await openReciterMenu())) {
      reciterNote = "لم تُفتح قائمة القرّاء";
      continue;
    }
    await sleep(400);
    // القائمة تُفتح على القارئ المحدَّد، فيكفي النزول مرة ثم الإدخال
    await pressKey("ArrowDown", "ArrowDown", 40);
    await sleep(250);
    await pressKey("Enter", "Enter", 13);
    await sleep(1_200);
    switched = /الحصري/.test(await browser.evaluate(barText));
    if (!switched) {
      await pressKey("Escape", "Escape", 27);
      reciterNote = "لم يتغيّر القارئ بعد الاختيار";
      await sleep(400);
    }
  }

  const reciterAyah = await readAyah();
  const continues = switched ? await waitForProgress(reciterAyah) : false;
  check(
    "تغيير القارئ أثناء التشغيل يستمر بلا توقف",
    switched && continues,
    (await browser.evaluate(barText)).replace(/\n/g, " | ") + (reciterNote ? ` (${reciterNote})` : ""),
  );

  // 8) الانتقال التلقائي للآية التالية عند انتهاء المقطع
  if (!FAST) {
    const before = await readAyah();
    let advanced = false;
    for (let attempt = 0; attempt < 30 && !advanced; attempt += 1) {
      await sleep(1_000);
      advanced = (await readAyah()) > before;
    }
    check("الانتقال التلقائي إلى الآية التالية بعد انتهاء المقطع", advanced);
  }

  // 9) فهرس السور
  await browser.send("Page.navigate", { url: `${BASE_URL}/quran` });
  await browser.waitFor(`!!document.querySelector('main input')`, {
    timeoutMs: 20_000,
    label: "فهرس السور",
  });
  const indexText = normalizeArabic(await browser.evaluate("document.body.innerText"));
  check(
    "فهرس السور يظهر",
    indexText.includes(normalizeArabic("سورة الفاتحة")) &&
      indexText.includes(normalizeArabic("سورة الناس")),
  );

  // 10) الرقية: تسجيل واحد فقط يعمل في كل مرة (لا تتشغّل تسجيلات معًا)
  const audioSection = 'section[aria-labelledby="ruqyah-audio"]';
  const playerState = `({
    frames: document.querySelectorAll('iframe').length,
    playing: [...document.querySelectorAll(${JSON.stringify(audioSection)} + ' button')]
      .filter((button) => button.textContent.includes("إيقاف")).length,
  })`;

  await browser.send("Page.navigate", { url: `${BASE_URL}/ruqyah` });
  await browser.waitFor(`!!document.querySelector(${JSON.stringify(audioSection)})`, {
    timeoutMs: 20_000,
    label: "قسم الاستماع في الرقية",
  });

  await browser.clickText(`${audioSection} button`, "تشغيل");
  await browser.waitFor(`document.querySelectorAll('iframe').length === 1`, {
    timeoutMs: 10_000,
    intervalMs: 200,
    label: "تشغيل التسجيل الأول",
  });

  // تشغيل تسجيل آخر: يجب أن يُزال المشغّل الأول بالكامل ويبقى واحد فقط
  await browser.clickText(`${audioSection} button`, "تشغيل");
  let singlePlayer = false;
  for (let attempt = 0; attempt < 25 && !singlePlayer; attempt += 1) {
    await sleep(300);
    const state = await browser.evaluate(playerState);
    singlePlayer = state.frames === 1 && state.playing === 1;
  }
  const finalState = await browser.evaluate(playerState);
  check(
    "الرقية: تسجيل واحد فقط يعمل في كل مرة",
    singlePlayer,
    `المشغّلات: ${finalState.frames} — أزرار إيقاف: ${finalState.playing}`,
  );

  /* ------------------------- مواقيت الصلاة ------------------------- */

  // الرئيسية: يعمل المدخل إلى المواقيت (بلا طلب إذن موقع ولا طلب شبكة) ولا تتغيّر هوية الصفحة
  await browser.send("Page.navigate", { url: `${BASE_URL}/` });
  let homeReady = false;
  try {
    await browser.waitFor(
      `document.querySelectorAll('a[href="/prayer-times"]').length >= 2 && document.body.innerText.includes("صدقة جارية")`,
      { timeoutMs: 25_000, label: "مدخل المواقيت وبطاقته في الرئيسية" },
    );
    homeReady = true;
  } catch {
    homeReady = false;
  }
  const homeOverflow = await browser.evaluate(`({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  })`);
  check(
    "الرئيسية سليمة وفيها مدخل المواقيت وبطاقته",
    homeReady && homeOverflow.scrollWidth <= homeOverflow.clientWidth + 1,
    JSON.stringify(homeOverflow),
  );

  // موقع مُحاكى (عمّان) + إذن ممنوح + منطقة زمنية محدّدة
  await browser.send("Browser.grantPermissions", {
    origin: BASE_URL,
    permissions: ["geolocation"],
  });
  await browser.send("Emulation.setGeolocationOverride", {
    latitude: 31.95,
    longitude: 35.91,
    accuracy: 25,
  });
  await browser.send("Emulation.setTimezoneOverride", { timezoneId: "Asia/Amman" });

  await browser.send("Page.navigate", { url: `${BASE_URL}/prayer-times` });
  let prayersReady = true;
  try {
    await browser.waitFor(`document.querySelectorAll("[data-prayer]").length === 5`, {
      timeoutMs: 35_000,
      label: "جدول الصلوات الخمس",
    });
  } catch {
    prayersReady = false;
  }
  check(
    "صفحة المواقيت تعرض الصلوات الخمس",
    prayersReady,
    prayersReady ? "" : (await browser.evaluate("document.body.innerText")).slice(0, 260).replace(/\n/g, " | "),
  );

  /** نص كل صف صلاة: { fajr: "الفجر ٥:٢٠ ص ..." }. */
  const readRows = `(() => {
    const out = {};
    for (const el of document.querySelectorAll("[data-prayer]")) {
      out[el.dataset.prayer] = el.innerText.replace(/\\n/g, " ");
    }
    return out;
  })()`;
  const timePattern = /[٠-٩]{1,2}:[٠-٩]{2}/;

  const rows = await browser.evaluate(readRows);
  check(
    "كل صلاة من الخمس تعرض وقتها",
    ["fajr", "dhuhr", "asr", "maghrib", "isha"].every((key) => timePattern.test(rows[key] ?? "")),
    Object.entries(rows)
      .map(([key, value]) => `${key}:${(value.match(timePattern) ?? ["—"])[0]}`)
      .join(" "),
  );

  const states = await browser.evaluate(
    `[...document.querySelectorAll("[data-prayer]")].map((el) => el.dataset.state)`,
  );
  check(
    "لكل صلاة حالة واضحة (مضت/الآن/قادمة)",
    states.length === 5 && states.every((state) => ["completed", "current", "upcoming"].includes(state)) &&
      states.some((state) => state === "current" || state === "upcoming"),
    states.join(","),
  );

  // العدّ التنازلي يتحدّث فعلًا (ثانية واحدة على الأقل)
  const timerText = `document.querySelector('[role="timer"]')?.textContent ?? ""`;
  const tickOne = await browser.evaluate(timerText);
  await sleep(2_600);
  const tickTwo = await browser.evaluate(timerText);
  check(
    "العدّ التنازلي للصلاة القادمة يتحدّث كل ثانية",
    tickOne.length > 0 && tickTwo.length > 0 && tickOne !== tickTwo,
    `${tickOne} ← ${tickTwo}`,
  );

  const rawText = await browser.evaluate("document.body.innerText");
  const pageText = normalizeArabic(rawText);
  check(
    "الموقع المُحاكى (عمّان) معروض في الصفحة",
    /عمان|31\.95/.test(pageText),
    pageText.slice(0, 120),
  );
  check("المنطقة الزمنية للموقع معروضة", pageText.includes("Asia/Amman"));
  check("التاريخ الهجري معروض بجانب الميلادي", rawText.includes("هـ"), rawText.slice(0, 160).replace(/\n/g, " | "));
  check(
    "ملاحظة اختلاف التواريخ الهجرية معروضة",
    pageText.includes(normalizeArabic("قد تختلف التواريخ الهجرية")),
  );
  check(
    "ملاحظة اختلاف المواقيت عن المسجد معروضة",
    pageText.includes(normalizeArabic("قد تختلف قليلًا عن مسجدك")),
  );
  check(
    "طريقة الحساب المستخدمة معروضة",
    pageText.includes(normalizeArabic("الطريقة المستخدمة فعليًا")),
  );

  const overflowInfo = await browser.evaluate(`({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    screenWidth: window.screen.width,
  })`);
  check(
    "لا تمرير أفقي في صفحة المواقيت على الجوال",
    overflowInfo.scrollWidth <= overflowInfo.clientWidth + 1,
    JSON.stringify(overflowInfo),
  );

  // التقويم الشهري يُحمَّل عند الاقتراب من الشاشة (تحميل مؤجّل) — نمرّره للعرض أولًا
  await browser.evaluate(`document.querySelector("#sj-calendar")?.scrollIntoView({ block: "start" })`);
  try {
    await browser.waitFor(`document.querySelectorAll("[data-calendar-day]").length >= 28`, {
      timeoutMs: 25_000,
      label: "تحميل التقويم الشهري عند الظهور",
    });
  } catch (error) {
    const calendarState = await browser.evaluate(`(() => {
      const calendar = document.querySelector("#sj-calendar");
      const rect = calendar?.getBoundingClientRect();
      return {
        exists: Boolean(calendar),
        text: calendar?.innerText?.slice(0, 180) ?? "",
        rect: rect ? { top: rect.top, height: rect.height } : null,
        scrollY: window.scrollY,
        bodyHeight: document.body.scrollHeight,
        skeletons: document.querySelectorAll("#sj-calendar .MuiSkeleton-root").length,
        resources: performance
          .getEntriesByType("resource")
          .filter((entry) => entry.name.includes("aladhan"))
          .map((entry) => ({ name: entry.name, duration: Math.round(entry.duration) })),
      };
    })()`);
    throw new Error(`${error.message} — ${JSON.stringify(calendarState)}`);
  }
  const calendarCells = await browser.evaluate(
    `document.querySelectorAll("[data-calendar-day]").length`,
  );
  const todayCells = await browser.evaluate(
    `document.querySelectorAll('[data-today="true"]').length`,
  );
  check(
    "التقويم الشهري يعرض أيام الشهر كاملة",
    calendarCells >= 28 && calendarCells <= 31,
    `الخلايا: ${calendarCells}`,
  );
  check("تمييز اليوم الحالي في التقويم", todayCells === 1, `المميّزة: ${todayCells}`);

  // نقر يوم يفتح تفاصيله (تاريخ هجري + مواقيت اليوم)
  let dialogWorks = false;
  try {
    await browser.click('[data-today="true"]');
    await browser.waitFor(`!!document.querySelector('[role="dialog"]')`, {
      timeoutMs: 8_000,
      label: "نافذة تفاصيل اليوم",
    });
    await browser.waitFor(
      `(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return false;
        return (dialog.innerText.match(/[٠-٩]{1,2}:[٠-٩]{2}/g) ?? []).length >= 5;
      })()`,
      { timeoutMs: 20_000, label: "مواقيت اليوم داخل النافذة" },
    );
    dialogWorks = true;
  } catch {
    dialogWorks = false;
  }
  check("نقر يوم في التقويم يعرض تفاصيله ومواقيته", dialogWorks);
  if (dialogWorks) {
    await browser.click('[role="dialog"] button[aria-label="إغلاق"]');
    await sleep(400);
  }

  // تغيير المذهب: العصر الحنفي متأخر عن المعتمد
  let expanded = false;
  for (let attempt = 0; attempt < 4 && !expanded; attempt += 1) {
    await browser.click("#sj-prayer-settings");
    await sleep(700);
    expanded = await browser.evaluate(
      `document.querySelector("#sj-prayer-settings")?.getAttribute("aria-expanded") === "true"`,
    );
  }
  const readAsrClock = `document.querySelector('[data-prayer="asr"]')?.innerText.match(/[٠-٩]{1,2}:[٠-٩]{2}/)?.[0] ?? ""`;
  const asrBefore = await browser.evaluate(readAsrClock);
  await browser.clickText("button", "الحنفي");
  let asrAfter = asrBefore;
  for (let attempt = 0; attempt < 40 && asrAfter === asrBefore; attempt += 1) {
    await sleep(500);
    asrAfter = await browser.evaluate(readAsrClock);
  }
  check(
    "تغيير مذهب العصر (إلى الحنفي) يحدّث الوقت",
    expanded && Boolean(asrBefore) && Boolean(asrAfter) && asrAfter !== asrBefore,
    `${asrBefore || "—"} ← ${asrAfter || "—"}${expanded ? "" : " (لم تُفتح الإعدادات)"}`,
  );

  // انقطاع الخدمة: رسالة واضحة بدل أوقات وهمية، ثم التعافي بإعادة المحاولة
  await browser.send("Network.enable");
  await browser.evaluate(`window.localStorage.removeItem("sj-prayer-cache-v1")`);
  await browser.send("Network.setBlockedURLs", { urls: ["*api.aladhan.com*"] });
  await browser.send("Page.navigate", { url: `${BASE_URL}/prayer-times` });

  let gracefulFailure = false;
  try {
    await browser.waitFor(`/مواقيت الصلاة غير متاحة مؤقتا/.test(${NORMALIZED_BODY})`, {
      timeoutMs: 40_000,
      label: "رسالة تعذّر المواقيت",
    });
    gracefulFailure = true;
  } catch {
    gracefulFailure = false;
  }
  const fakeRows = await browser.evaluate(`document.querySelectorAll("[data-prayer]").length`);
  check(
    "عند تعذّر الخدمة: رسالة واضحة وبلا أوقات وهمية",
    gracefulFailure && fakeRows === 0,
    gracefulFailure ? `صفوف معروضة: ${fakeRows}` : "لم تظهر الرسالة",
  );

  await browser.send("Network.setBlockedURLs", { urls: [] });
  let recovered = false;
  try {
    await browser.clickText("#sj-times button", "إعادة المحاولة");
    await browser.waitFor(`document.querySelectorAll("[data-prayer]").length === 5`, {
      timeoutMs: 30_000,
      label: "عودة المواقيت بعد إعادة المحاولة",
    });
    recovered = true;
  } catch {
    recovered = false;
  }
  check("زر إعادة المحاولة يعيد عرض المواقيت", recovered);

  // إذن الموقع مرفوض (كما لو رفضه المستخدم على iPhone):
  // يجب أن تظهر رسالة إرشادية، وتستمر المواقيت التقريبية أو يظهر الاختيار اليدوي — بلا انهيار
  await browser.send("Browser.setPermission", {
    permission: { name: "geolocation" },
    setting: "denied",
    origin: BASE_URL,
  });
  await browser.evaluate(`(() => { localStorage.removeItem("sj-prayer-settings"); return true; })()`);
  await browser.send("Page.navigate", { url: `${BASE_URL}/prayer-times` });

  let deniedNotice = false;
  try {
    await browser.waitFor(
      `/الوصول إلى الموقع متوق|موقع تقريبي|اختيار يدوي|اختر موقعك/.test(document.body.innerText || "")`,
      { timeoutMs: 35_000, label: "رسالة رفض إذن الموقع أو بديل واضح" },
    );
    deniedNotice = true;
  } catch {
    deniedNotice = false;
  }
  const deniedState = await browser.evaluate(`({
    rows: document.querySelectorAll("[data-prayer]").length,
    hasManual: /اختيار يدوي|اختر موقعك/.test(document.body.innerText || ""),
    hasDenied: /الوصول إلى الموقع متوق/.test(document.body.innerText || ""),
    hasApproximate: /موقع تقريبي/.test(document.body.innerText || ""),
  })`);
  const deniedDebug = deniedState.rows === 5 || deniedState.hasManual || deniedState.hasDenied || deniedState.hasApproximate
    ? ""
    : await browser.evaluate(`(document.body.innerText || "").slice(0, 400)`);
  check(
    "رفض إذن الموقع: إرشاد واضح مع مواقيت تقريبية أو اختيار يدوي",
    deniedState.rows === 5 || deniedState.hasManual || deniedState.hasDenied || deniedState.hasApproximate,
    JSON.stringify(deniedState) + (deniedDebug ? ` | ${deniedDebug}` : ""),
  );

  /* ------------------- الموجة الأولى: أدوات الصلاة الجديدة ------------------- */

  // موقع يدوي ثابت لعمّان — لا نعتمد على GPS في اختبارات الأدوات الجديدة.
  const amman = {
    latitude: 31.9539,
    longitude: 35.9106,
    city: "عمّان",
    cityEn: "Amman",
    country: "الأردن",
    countryEn: "Jordan",
    countryCode: "JO",
    source: "manual",
    savedAt: Date.now(),
  };
  const seedSettings = JSON.stringify({
    location: amman,
    methodId: null,
    school: 0,
    highLatitude: "auto",
    timeFormat: "12",
    lang: "ar",
    tune: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  });
  await browser.evaluate(`(() => {
    localStorage.setItem("sj-prayer-settings", ${JSON.stringify(seedSettings)});
    localStorage.removeItem("sj-mosques-cache-v2");
    localStorage.removeItem("sj-hijri-offset-v1");
    return true;
  })()`);

  // 11) بطاقة أدوات المواقيت + تذكير الصلاة (بلا طلب إذن تلقائي)
  await browser.send("Page.navigate", { url: `${BASE_URL}/prayer-times` });
  await browser.waitFor(`document.querySelectorAll("[data-prayer]").length === 5`, {
    timeoutMs: 35_000,
    label: "مواقيت الصلاة بعد ضبط الموقع اليدوي",
  });
  let prayerTools = false;
  try {
    await browser.waitFor(
      `/عن هذه المواقيت/.test(document.body.innerText) && /تذكير الصلاة/.test(document.body.innerText)`,
      { timeoutMs: 12_000, label: "بطاقة أدوات المواقيت والتذكير" },
    );
    prayerTools = true;
  } catch {
    prayerTools = false;
  }
  const prayerToolsState = await browser.evaluate(`({
    qibla: /اتجاه القبلة/.test(document.body.innerText),
    mosques: /المساجد القريبة/.test(document.body.innerText),
    hijri: /التقويم الهجري/.test(document.body.innerText),
    notificationPermission: typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  })`);
  check(
    "صفحة المواقيت تعرض بطاقة السياق وأدوات القبلة والمساجد والتقويم",
    prayerTools && prayerToolsState.qibla && prayerToolsState.mosques && prayerToolsState.hijri,
    JSON.stringify(prayerToolsState),
  );

  // 12) التقويم الهجري: شبكة محلية، تمييز اليوم، الإزاحة، نافذة اليوم
  await browser.send("Page.navigate", { url: `${BASE_URL}/hijri-calendar` });
  await browser.waitFor(`document.querySelectorAll("[data-hijri-day]").length >= 28`, {
    timeoutMs: 20_000,
    label: "شبكة التقويم الهجري",
  });
  const hijriBefore = await browser.evaluate(`({
    days: document.querySelectorAll("[data-hijri-day]").length,
    today: document.querySelectorAll('[data-today="true"]').length,
    first: document.querySelector("[data-hijri-day]")?.getAttribute("data-gregorian") ?? "",
    heading: document.querySelector("main h2")?.innerText ?? "",
    body: document.body.innerText,
  })`);
  check(
    "التقويم الهجري يعرض شهرًا كاملًا ويميّز اليوم",
    hijriBefore.days >= 29 &&
      hijriBefore.days <= 30 &&
      hijriBefore.today === 1 &&
      hijriBefore.heading.includes("هـ"),
    JSON.stringify({ days: hijriBefore.days, today: hijriBefore.today, heading: hijriBefore.heading }),
  );
  check(
    "محوّل التاريخ الهجري يعرض نتيجة محلية",
    hijriBefore.body.includes("محوّل التاريخ") && /[٠-٩]{4}\s*هـ/.test(hijriBefore.body),
  );

  let offsetWorks = false;
  try {
    await browser.clickText('section[aria-label="إزاحة التاريخ"] button', "+");
    await browser.waitFor(
      `document.querySelector("[data-hijri-day]")?.getAttribute("data-gregorian") !== ${JSON.stringify(
        hijriBefore.first,
      )}`,
      { timeoutMs: 10_000, label: "تغيّر بداية الشهر عند الإزاحة" },
    );
    const shifted = await browser.evaluate(
      `document.querySelector("[data-hijri-day]")?.getAttribute("data-gregorian") ?? ""`,
    );
    const diffDays = (Date.parse(hijriBefore.first) - Date.parse(shifted)) / 86_400_000;
    offsetWorks = Math.abs(diffDays) === 1;
  } catch {
    offsetWorks = false;
  }
  check("إزاحة التقويم الهجري ±يوم تُغيّر بداية الشهر", offsetWorks);

  let hijriDialog = false;
  try {
    await browser.click('[data-today="true"]');
    await browser.waitFor(`!!document.querySelector('[role="dialog"]')`, {
      timeoutMs: 8_000,
      label: "نافذة اليوم الهجري",
    });
    const dialogText = await browser.evaluate(
      `document.querySelector('[role="dialog"]')?.innerText ?? ""`,
    );
    hijriDialog = dialogText.includes("هـ") && dialogText.includes("مواقيت الصلاة");
    if (hijriDialog) {
      await browser.click('[role="dialog"] button[aria-label="إغلاق"]');
      await sleep(350);
    }
  } catch {
    hijriDialog = false;
  }
  check("نقر يوم هجري يفتح تفاصيله", hijriDialog);

  const hijriOverflow = await browser.evaluate(`({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  })`);
  check(
    "لا تمرير أفقي في صفحة التقويم الهجري على الجوال",
    hijriOverflow.scrollWidth <= hijriOverflow.clientWidth + 1,
    JSON.stringify(hijriOverflow),
  );

  // 13) القبلة: حساب محلي بالدرجة، بلا طلب إذن بوصلة تلقائي
  await browser.send("Page.navigate", { url: `${BASE_URL}/qibla` });
  await browser.waitFor(`!!document.querySelector("[data-qibla-bearing]")`, {
    timeoutMs: 15_000,
    label: "درجة القبلة المحسوبة",
  });
  const qiblaState = await browser.evaluate(`({
    bearing: Number(document.querySelector("[data-qibla-bearing]")?.getAttribute("data-qibla-bearing")),
    text: document.body.innerText,
    overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  })`);
  check(
    "اتجاه القبلة من عمّان قريب من ١٥٩° ويعرض المسافة",
    qiblaState.bearing >= 150 &&
      qiblaState.bearing <= 170 &&
      qiblaState.text.includes("المسافة إلى الكعبة") &&
      qiblaState.text.includes("عمّان"),
    `الدرجة: ${qiblaState.bearing}`,
  );
  check("لا تمرير أفقي في صفحة القبلة على الجوال", qiblaState.overflow);

  // 14) المساجد: لا بحث تلقائي، ثم بحث مع رد Overpass مُحاكى، ثم خريطة Leaflet
  await browser.send("Page.navigate", { url: `${BASE_URL}/mosques` });
  await browser.waitFor(
    `[...document.querySelectorAll("button")].some((button) => button.textContent.includes("ابحث عن المساجد القريبة"))`,
    { timeoutMs: 12_000, label: "زر البحث عن المساجد" },
  );
  const overpassBefore = await browser.evaluate(
    `performance.getEntriesByType("resource").filter((entry) => entry.name.includes("overpass")).length`,
  );
  check("لا يبدأ بحث المساجد تلقائيًا", overpassBefore === 0, `الطلبات: ${overpassBefore}`);

  const mapBeforeSearch = await browser.evaluate(
    `[...document.querySelectorAll("button")].some((button) => button.textContent.includes("عرض الخريطة"))`,
  );
  check("زر الخريطة متاح حتى قبل نجاح البحث", mapBeforeSearch);

  const mosquePayload = {
    elements: [
      {
        type: "node",
        id: 101,
        lat: 31.96,
        lon: 35.92,
        tags: {
          amenity: "place_of_worship",
          religion: "muslim",
          "name:ar": "مسجد النور",
          "addr:street": "شارع الملك",
          "addr:city": "عمّان",
        },
      },
      {
        type: "way",
        id: 102,
        center: { lat: 31.97, lon: 35.93 },
        tags: { building: "mosque", name: "Mosque B" },
      },
    ],
  };
  const fulfillOverpass = (params) => {
    void browser
      .send("Fetch.fulfillRequest", {
        requestId: params.requestId,
        responseCode: 200,
        responseHeaders: [
          { name: "Content-Type", value: "application/json; charset=utf-8" },
          { name: "Access-Control-Allow-Origin", value: "*" },
        ],
        body: Buffer.from(JSON.stringify(mosquePayload), "utf8").toString("base64"),
      })
      .catch(() => {});
  };
  const stopOverpass = browser.on("Fetch.requestPaused", fulfillOverpass);
  await browser.send("Fetch.enable", {
    patterns: [{ urlPattern: "*overpass*", requestStage: "Request" }],
  });
  let mosqueResults = false;
  try {
    await browser.clickText("button", "ابحث عن المساجد القريبة");
    await browser.waitFor(`document.querySelectorAll("[data-mosque-id]").length === 2`, {
      timeoutMs: 20_000,
      label: "نتائج المساجد من رد Overpass",
    });
    mosqueResults = true;
  } catch {
    mosqueResults = false;
  } finally {
    stopOverpass();
    await browser.send("Fetch.disable").catch(() => {});
  }
  const mosqueState = await browser.evaluate(`({
    count: document.querySelector("[data-mosque-count]")?.getAttribute("data-mosque-count") ?? "",
    text: document.body.innerText,
    cards: document.querySelectorAll("[data-mosque-id]").length,
  })`);
  check(
    "بحث المساجد يعرض النتائج والمسافة من رد Overpass",
    mosqueResults &&
      mosqueState.count === "2" &&
      mosqueState.cards === 2 &&
      mosqueState.text.includes("مسجد النور") &&
      mosqueState.text.includes("Mosque B"),
    JSON.stringify({ count: mosqueState.count, cards: mosqueState.cards }),
  );

  let mapWorks = false;
  try {
    await browser.clickText("button", "عرض الخريطة");
    await browser.waitFor(
      `!!document.querySelector(".sj-mosque-map") && !!document.querySelector(".leaflet-container")`,
      { timeoutMs: 20_000, label: "خريطة Leaflet" },
    );
    mapWorks = true;
  } catch {
    mapWorks = false;
  }
  check("خريطة المساجد تُحمَّل كسولًا وتظهر", mapWorks);

  // 15) سطح المكتب: شريط التنقل لا يلتف، والروابط الإضافية داخل قائمة «المزيد»
  await browser.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await browser.send("Page.navigate", { url: `${BASE_URL}/` });
  let desktopHeader = null;
  try {
    await browser.waitFor(`!!document.querySelector('nav[aria-label="التنقل الرئيسي"]')`, {
      timeoutMs: 15_000,
      label: "تنقل سطح المكتب",
    });
    desktopHeader = await browser.evaluate(`(() => {
      const header = document.querySelector("header");
      const nav = document.querySelector('nav[aria-label="التنقل الرئيسي"]');
      const buttons = nav ? [...nav.querySelectorAll("a, button")] : [];
      return {
        headerHeight: header ? Math.round(header.getBoundingClientRect().height) : 0,
        rows: new Set(buttons.map((button) => Math.round(button.getBoundingClientRect().top))).size,
        labels: buttons.map((button) => (button.textContent || "").trim()),
      };
    })()`);
  } catch {
    desktopHeader = null;
  }
  check(
    "شريط سطح المكتب في صف واحد وبلا ازدحام",
    !!desktopHeader &&
      desktopHeader.headerHeight <= 80 &&
      desktopHeader.rows === 1 &&
      desktopHeader.labels.includes("المزيد") &&
      desktopHeader.labels.length === 7,
    JSON.stringify(desktopHeader),
  );

  let moreMenu = false;
  try {
    const findMoreButton = `(() => {
      const button = [...document.querySelectorAll('nav[aria-label="التنقل الرئيسي"] button')]
        .find((item) => (item.textContent || "").includes("المزيد"));
      if (!button) return false;
      button.click();
      return true;
    })()`;
    await browser.waitFor(`(() => {
      const button = [...document.querySelectorAll('nav[aria-label="التنقل الرئيسي"] button')]
        .find((item) => (item.textContent || "").includes("المزيد"));
      return !!button;
    })()`, { timeoutMs: 10_000, label: "زر المزيد" });
    // نكرّر المحاولة: قد يصل النقر قبل أن يتفاعل React بعد التحميل.
    for (let attempt = 0; attempt < 3 && !moreMenu; attempt += 1) {
      await browser.evaluate(findMoreButton);
      try {
        await browser.waitFor(
          `(document.querySelector('[role="menu"]')?.innerText ?? "").includes("التقويم الهجري") === true`,
          { timeoutMs: 3_000, label: "قائمة المزيد" },
        );
        moreMenu = true;
      } catch {
        moreMenu = false;
      }
    }
  } catch {
    moreMenu = false;
  }
  check("قائمة «المزيد» تعرض الروابط الإضافية", moreMenu);
} catch (error) {
  check("اكتمل الاختبار بلا أخطاء تنفيذية", false, String(error.message ?? error));
  if (pageErrors.length > 0) {
    console.log("\nأخطاء الصفحة:");
    for (const message of pageErrors.slice(-5)) console.log(`  - ${message.split("\n")[0]}`);
  }
} finally {
  try {
    browser?.socket.close();
  } catch {
    /* تجاهُل */
  }
  if (browserProcess) browserProcess.kill();
  if (previewProcess) previewProcess.kill();
  if (profileDir) {
    try {
      rmSync(profileDir, { recursive: true, force: true });
    } catch {
      /* تجاهُل */
    }
  }
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} اختبارات ناجحة`);
if (failed.length > 0) {
  console.log("الاختبارات الفاشلة:");
  for (const item of failed) console.log(`  - ${item.name}`);
  process.exit(1);
}
console.log("كل الاختبارات ناجحة ✔");
process.exit(0);
