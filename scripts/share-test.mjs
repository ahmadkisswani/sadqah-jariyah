// @ts-nocheck
/** اختبار عدم تكرار كتلة الوقف في المشاركة وبناء نص النسخ. */
import { build } from "esbuild";

const bundled = await build({
  entryPoints: ["src/utils/share.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "neutral",
  target: "es2020",
  logLevel: "silent",
});

const mod = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text, "utf8").toString("base64")}`
);

const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: String(error?.message ?? error) });
    console.log(`FAIL  ${name} — ${error?.message ?? error}`);
  }
};
const eq = (actual, expected, label = "") => {
  if (actual !== expected) {
    throw new Error(`${label} المتوقّع: ${JSON.stringify(expected)} — الفعلي: ${JSON.stringify(actual)}`);
  }
};

await check("نص النسخ يضيف الرابط مرة واحدة فقط", () => {
  eq(mod.buildCopyPayload("نص", "https://example.com/a"), "نص\n\nhttps://example.com/a");
  eq(mod.buildCopyPayload("نص", ""), "نص");
});

await check("المشاركة لا تكرّر كتلة الوقف (المستدعي يضيفها)", async () => {
  let captured = null;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      share: async (data) => {
        captured = data;
      },
    },
  });
  const text = "﴿ نص الآية ﴾\n\nسورة الفاتحة — آية ١\n\nصدقة جارية عن توبة عبد العزيز الجربوعه ومحمد احمد مسلم.";
  const result = await mod.shareText(text);
  eq(result, "shared");
  eq(captured.text, text, "نص المشاركة:");
  eq(captured.text.split("صدقة جارية عن").length - 1, 1, "عدد كتل الوقف:");
});

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} اختبارات مشاركة ناجحة`);
if (failed.length) process.exit(1);
console.log("المشاركة والنسخ سليمان ✔");
