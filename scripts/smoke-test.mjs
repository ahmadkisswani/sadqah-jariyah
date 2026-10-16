// اختبار دخاني حقيقي (واجهة + صوت) لصفحة القرآن.
//
// يُشغّل متصفحًا (Chrome/Edge) بدون واجهة على نسخة الإنتاج المبنية في dist/،
// ويحاكي شاشة جوال، ثم يتحقّق من:
//   1) عرض صفحات المصحف (ترويسة الصفحة، إطار السورة، أرقام الآيات).
//   2) تبديل طرق العرض (صفحات / متصل / بطاقات).
//   3) تشغيل التلاوة بلمسة حقيقية على رقم الآية، وتقدّم الوقت فعليًا.
//   4) الانتقال التلقائي للآية التالية عند انتهاء المقطع.
//   5) تغيير القارئ أثناء التشغيل.
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
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const resolver = this.pending.get(message.id);
      if (!resolver) return;
      this.pending.delete(message.id);
      if (message.error) resolver.reject(new Error(JSON.stringify(message.error)));
      else resolver.resolve(message.result);
    });
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
      throw new Error(`فشل التقييم: ${result.exceptionDetails.text}`);
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
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
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
  .trim())(document.body.innerText)`;

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
