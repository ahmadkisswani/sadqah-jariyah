import { Box, Divider, Link, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { SectionHeader } from "../components/SectionHeader";

const STORAGE_ITEMS = [
  ["تقدّم الأذكار والتسبيح", "عدّاداتك وتقدّمك في فئات الأذكار."],
  ["المحفوظات وآخر موضع قراءة", "الآيات التي حفظتها وآخر سورة/آية وصلت إليها."],
  ["إعدادات الصلاة", "الموقع المختار، طريقة الحساب، المذهب، التعديلات، اللغة وصيغة الوقت."],
  [
    "تذكير الصلاة",
    "تفضيل التذكير (مفعّل/متوقّف) ووقته قبل الأذان فقط. لا تُحفظ قراءات أو سجل إشعارات.",
  ],
  [
    "المساجد القريبة",
    "آخر نتيجة بحث واحدة (موقع مقرّب ونصف القطر والمساجد) لتفادي تكرار الطلبات. لا يُحفظ سجل بحث زمني.",
  ],
  ["التقويم الهجري", "إزاحة التاريخ المحلية (±يومان) التي اخترتها لمطابقة تقويم جهتك."],
  ["تفضيلات الواجهة", "الوضع الفاتح/الداكن، حجم خط المصحف، طريقة العرض، وآخر قارئ."],
  ["ورد اليوم", "علامة إتمام ورد اليوم."],
  ["تنبيه التثبيت", "تذكّر أنك أخفيت دعوة تثبيت التطبيق."],
] as const;

/** صفحة خصوصية صريحة ومحدودة بما يفعله التطبيق فعلًا. */
export default function PrivacyPage() {
  return (
    <Stack spacing={4} sx={{ maxWidth: 840, mx: "auto" }}>
      <SectionHeader
        level="h1"
        title="الخصوصية"
        subtitle="هذا الموقع بلا حسابات ولا إعلانات ولا أدوات تحليل. نوضّح هنا ما يُحفظ على جهازك وأي خدمات خارجية قد تتصل بها الصفحة."
      />

      <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 800, mb: 1.5 }}>
          ما لا نجمعه
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 2 }}>
          لا نطلب اسمك أو بريدك أو رقمك، ولا ننشئ حسابات، ولا نضع إعلانات أو صور تتبّع أو أدوات
          تحليل سلوكي. لا نبيع أي بيانات ولا نشاركها لأغراض تسويقية.
        </Typography>
      </Paper>

      <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 800, mb: 1 }}>
          ما يُحفظ محليًا على جهازك
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 2, mb: 2 }}>
          يُستخدم التخزين المحلي في المتصفح (localStorage) لحفظ ما يلزم لعمل الموقع، ولا يصل إلى
          خادمنا:
        </Typography>
        <Stack component="ul" spacing={1.25} sx={{ m: 0, pr: 3, color: "text.secondary" }}>
          {STORAGE_ITEMS.map(([title, body]) => (
            <li key={title}>
              <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                {title}:
              </Typography>{" "}
              <Typography component="span" variant="body2">
                {body}
              </Typography>
            </li>
          ))}
        </Stack>
        <Typography color="text.secondary" sx={{ lineHeight: 2, mt: 2 }}>
          يمكنك حذف كل ذلك من إعدادات المتصفح (مسح بيانات الموقع)، أو من زر إعادة التعيين داخل
          صفحات التسبيح والأذكار وإعدادات الصلاة.
        </Typography>
      </Paper>

      <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 800, mb: 1.5 }}>
          الموقع والخدمات الخارجية
        </Typography>
        <Stack spacing={1.5} color="text.secondary" sx={{ lineHeight: 2 }}>
          <Typography>
            <strong>الموقع التقريبي:</strong> عند عدم وجود موقع محفوظ، قد تستخدم صفحة المواقيت خدمة
            BigDataCloud لتقدير المدينة من عنوان IP. يرسل هذا الطلب عنوان IP الخاص بك إلى الخدمة.
            يمكنك تجنّب ذلك باختيار مدينتك يدويًا، أو حفظ موقع دقيق عبر زر «استخدم موقعي» بعد منح
            إذن المتصفح.
          </Typography>
          <Typography>
            <strong>الموقع الدقيق:</strong> لا يُطلب إذن GPS تلقائيًا؛ لا يحدث إلا عند ضغطك على زر
            تحديد الموقع. تُحفظ الإحداثيات المختارة محليًا لتسريع حساب المواقيت.
          </Typography>
          <Typography>
            <strong>مواقيت الصلاة والتقويم:</strong> تُطلب المواقيت من واجهة AlAdhan API، ويُرسل
            إليها الموقع (خطوط الطول والعرض) والتاريخ. أما التقويم الهجري فيُحسب محليًا في المتصفح
            حسب تقويم أم القرى، بلا طلب شبكة. تخضع خدمة المواقيت لسياسة خصوصية مزوّدها.
          </Typography>
          <Typography>
            <strong>اتجاه القبلة:</strong> يُحسب محليًا على جهازك من موقعك إلى الكعبة. لا تُرسل
            إحداثياتك إلى خدمة قبلة، ولا تُحفظ قراءات البوصلة أو سجل حركة. لا تعمل البوصلة إلا بعد
            ضغطك على زر التفعيل.
          </Typography>
          <Typography>
            <strong>المساجد القريبة:</strong> يبدأ البحث فقط بضغطتك، ويرسل إلى Overpass API
            (OpenStreetMap) إحداثيات مقرّبة ونصف قطر صغيرًا. عند عرض الخريطة تُطلب بلاطات من
            tile.openstreetmap.org، وقد يظهر عنوان IP ومكان البلاط المطلوب لمزوّد الخريطة. البيانات
            مفتوحة برخصة ODbL ولا نضمن اكتمالها أو دقة أوقاتها.
          </Typography>
          <Typography>
            <strong>تذكير الصلاة:</strong> اختياري بالكامل، ولا يُطلب إذن الإشعارات تلقائيًا. يعمل
            التنبيه محليًا أثناء فتح الموقع أو تثبيته فقط، ولا نستخدم إشعارات خلفية أو خادم دفع.
          </Typography>
          <Typography>
            <strong>الصوت:</strong> تلاوات القرآن تُحمّل من cdn.islamic.network عند التشغيل فقط.
            أما تسجيلات الرقية فتظهر داخل مشغّل خارجي من tvquran.com بعد ضغطك على «تشغيل»، وقد
            تضع تلك الخدمة ملفات تعريف ارتباط خاصة بها.
          </Typography>
          <Typography>
            <strong>الاستضافة:</strong> يُقدَّم الموقع عبر Cloudflare، التي قد تحتفظ بسجلات اتصال
            قياسية (مثل IP والوقت) لأغراض الأمان والتشغيل وفق سياسة Cloudflare.
          </Typography>
          <Typography>
            <strong>المشاركة:</strong> عند استخدام زر المشاركة، يتولى نظام جهازك أو المتصفح فتح
            التطبيق المناسب. لا نستلم نحن محتوى ما شاركته.
          </Typography>
        </Stack>
        <Divider sx={{ my: 2.5 }} />
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 2 }}>
          لا توجد ملفات تعريف ارتباط (cookies) يضعها التطبيق نفسه. الخدمات الخارجية المضمّنة قد
          تضعها عند تفعيلها. لمزيد من التفاصيل حول المحتوى والمصادر، راجع{" "}
          <Link component={RouterLink} to="/about" underline="hover">
            صفحة عن الموقع
          </Link>
          .
        </Typography>
      </Paper>

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 2 }}>
          آخر تحديث لهذه الصفحة: نوفمبر ٢٠٢٦. إذا كان لديك سؤال عن الخصوصية يمكنك فتح مسألة في{" "}
          <Link
            href="https://github.com/ahmadkisswani/sadqah-jariyah"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            مستودع المشروع على GitHub
          </Link>
          .
        </Typography>
      </Box>
    </Stack>
  );
}
