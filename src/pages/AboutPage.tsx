import { Box, Divider, Link, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import { SectionHeader } from "../components/SectionHeader";
import { IslamicPattern } from "../components/IslamicPattern";
import { ShareButton } from "../components/ShareButton";
import { fonts } from "../theme";
import { DEDICATED_PEOPLE, PROJECT_NAME, withDedication } from "../constants/dedication";

const SECTIONS = [
  {
    title: "ما هو هذا الموقع؟",
    body: "موقع إسلامي بسيط يجمع القرآن الكريم والأذكار والأدعية والتسبيح والرقية الشرعية، صُمّم ليكون نافعًا وسهلًا، ويعمل بلا حساب ولا خادم.",
  },
  {
    title: "لمن هذا العمل؟",
    body: "هذا العمل صدقة جارية مكرَّسة لروح توبة عبد العزيز الجربوعه ومحمد احمد مسلم، نسأل الله أن يجعله في ميزان حسناتهما.",
  },
  {
    title: "كيف تستفيد منه؟",
    body: "اقرأ ما تيسّر من القرآن، واذكر الله، وادعُ لهما، وسبّح، ثم شارك الأجر مع غيرك؛ فالدال على الخير كفاعله.",
  },
];

export default function AboutPage() {
  return (
    <Stack spacing={4} sx={{ maxWidth: 820, mx: "auto" }}>
      <SectionHeader level="h1" title="عن هذا العمل" />

      <Paper sx={{ position: "relative", overflow: "hidden", p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider" }}>
        <IslamicPattern opacity={0.05} />
        <Box sx={{ position: "relative", textAlign: "center" }}>
          <VolunteerActivismIcon sx={{ fontSize: 44, color: "secondary.main", mb: 1 }} aria-hidden />
          <Typography variant="h5" component="p" sx={{ fontWeight: 800, mb: 2 }}>
            {PROJECT_NAME}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            عملٌ يسير، يُرجى به وجه الله، ونفعٌ مستمرٌّ لكل من قرأ أو ذكر أو دعا.
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            مكرَّس لروح
          </Typography>
          <Stack spacing={0.5} sx={{ mb: 3 }}>
            {DEDICATED_PEOPLE.map((name) => (
              <Typography key={name} variant="h6" component="p" sx={{ fontFamily: fonts.naskh, fontWeight: 800 }}>
                {name}
              </Typography>
            ))}
          </Stack>
          <Typography
            sx={{ fontFamily: fonts.naskh, lineHeight: 2.2, maxWidth: 560, mx: "auto" }}
          >
            نسأل الله أن يتقبّل هذا العمل، وأن يجعله نفعًا مستمرًّا لكل من استخدمه، وأن يجعله في ميزان
            حسناتهما.
          </Typography>
        </Box>
      </Paper>

      <Stack spacing={2.5}>
        {SECTIONS.map((s) => (
          <Paper key={s.title} sx={{ p: { xs: 2.5, sm: 3 }, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
              {s.title}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 2 }}>
              {s.body}
            </Typography>
          </Paper>
        ))}
      </Stack>

      <Paper sx={{ p: { xs: 2.5, sm: 3 }, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1.5 }}>
          المصادر والخدمات
        </Typography>
        <Stack component="ul" spacing={1.25} sx={{ m: 0, pr: 3, color: "text.secondary" }}>
          <li>
            <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              النص القرآني:
            </Typography>{" "}
            <Typography component="span" variant="body2">
              نص عثماني مُضمَّن محليًا مأخوذ عبر alquran.cloud (نسخة quran-uthmani المبنية على مصحف
              Tanzil)، مع فصل البسملة وعرضها وفق صفحات المصحف.
            </Typography>
          </li>
          <li>
            <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              التلاوات:
            </Typography>{" "}
            <Typography component="span" variant="body2">
              ملفات صوتية من cdn.islamic.network لأحد عشر قارئًا معروفين، وتُحمّل عند التشغيل فقط.
            </Typography>
          </li>
          <li>
            <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              المواقيت والتقويم:
            </Typography>{" "}
            <Typography component="span" variant="body2">
              تُحسب عبر AlAdhan API وفق الطريقة والمذهب اللذين تختارهما، وقد تختلف قليلًا عن مسجدك.
              التقويم الهجري يُحسب محليًا في المتصفح حسب تقويم أم القرى، مع إزاحة اختيارية ±يومين
              لمراعاة اختلاف بداية الشهر بين البلدان.
            </Typography>
          </li>
          <li>
            <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              القبلة والمساجد:
            </Typography>{" "}
            <Typography component="span" variant="body2">
              اتجاه القبلة يُحسب محليًا بمعادلة المسافة الكبرى من موقعك إلى الكعبة. المساجد تأتي من
              بيانات OpenStreetMap عبر Overpass API وبلاطات الخريطة من OpenStreetMap (رخصة ODbL)؛
              التغطية تطوعية وقد لا تشمل كل مسجد، ولا نتحقق من أوقات العمل أو الطائفة.
            </Typography>
          </li>
          <li>
            <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              الموقع:
            </Typography>{" "}
            <Typography component="span" variant="body2">
              تحديد دقيق بإذن المتصفح، أو تقدير تقريبي من عنوان IP عبر BigDataCloud عند عدم وجود
              موقع محفوظ. راجع صفحة الخصوصية للتفاصيل.
            </Typography>
          </li>
          <li>
            <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              الأذكار والأدعية والرقية:
            </Typography>{" "}
            <Typography component="span" variant="body2">
              نصوص محلية من مصادر معروفة، وتظهر مراجع بعض الأدعية في بطاقاتها. نعمل على استكمال
              توثيق ما لم يُذكر مرجعه، ولا نضيف نصوصًا منسوبة بلا مصدر. تسجيلات الرقية تُضمَّن من
              tvquran.com بعد طلب التشغيل.
            </Typography>
          </li>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 2 }}>
          للاطلاع على ما يُحفظ على جهازك والخدمات التي قد تتصل بها الصفحة، راجع{" "}
          <Link component={RouterLink} to="/privacy" underline="hover">
            صفحة الخصوصية
          </Link>
          .
        </Typography>
      </Paper>

      <Box>
        <ShareButton
          text={withDedication("صدقة جارية: قرآن وأذكار وأدعية وتسبيح ورقية شرعية ")}
          label="شارك الموقع مع من تحب"
        />
      </Box>
    </Stack>
  );
}
