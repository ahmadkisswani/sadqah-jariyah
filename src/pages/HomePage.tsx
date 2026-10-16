import { Box, Grid, Stack, Typography } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AdjustIcon from "@mui/icons-material/Adjust";
import HealingIcon from "@mui/icons-material/Healing";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import SchoolIcon from "@mui/icons-material/School";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { HeroSection } from "../components/HeroSection";
import { ServiceCard, IslamicCard } from "../components/ServiceCard";
import { SectionHeader } from "../components/SectionHeader";
import { DailyWirdCard } from "../components/DailyWirdCard";
import { InstallPrompt } from "../components/InstallPrompt";
import { ShareButton } from "../components/ShareButton";
import { IslamicPattern } from "../components/IslamicPattern";
import { useDailyContent } from "../hooks/useDailyContent";
import { usePageTitle } from "../hooks/usePageTitle";
import { fonts } from "../theme";
import { withDedication } from "../constants/dedication";

const SERVICES = [
  {
    icon: MenuBookIcon,
    title: "القرآن الكريم",
    description: "اقرأ كتاب الله بتدبّر وطمأنينة، مع فهرس السور وحفظ الآيات.",
    to: "/quran",
    accent: "primary" as const,
  },
  {
    icon: AutoStoriesIcon,
    title: "الأذكار",
    description: "أذكار الصباح والمساء والنوم وبعد الصلاة مع عدّاد مريح.",
    to: "/azkar",
    accent: "primary" as const,
  },
  {
    icon: FavoriteIcon,
    title: "الأدعية",
    description: "مجموعة من الأدعية من القرآن والسنة للمتوفّين وغيرها.",
    to: "/duas",
    accent: "secondary" as const,
  },
  {
    icon: AdjustIcon,
    title: "التسبيح",
    description: "عدّاد تسبيح بسيط وكبير، مع أهداف ومحفوظ تلقائيًا.",
    to: "/tasbeeh",
    accent: "primary" as const,
  },
  {
    icon: HealingIcon,
    title: "الرقية الشرعية",
    description: "آيات وأدعية الرقية، وتسجيلات للاستماع عند الاتصال.",
    to: "/ruqyah",
    accent: "secondary" as const,
  },
];

const DUA_FOR_THEM = [
  "اللهم اغفر لهما وارحمهما",
  "اللهم عافهما واعفُ عنهما",
  "اللهم اجعل قبرهما روضة من رياض الجنة",
  "اللهم اجعل هذا العمل في ميزان حسناتهما",
  "اللهم اجمعنا وإياهما في جنات النعيم",
];

const GOOD_DEEDS = [
  { icon: MenuBookOutlinedIcon, title: "القرآن الكريم", text: "قراءة كتاب الله وتدبّره، وهداية ثواب القراءة لهما." },
  { icon: TipsAndUpdatesIcon, title: "الذكر", text: "الإكثار من ذكر الله، ففيه حياةٌ للقلوب وسكينةٌ للنفوس." },
  { icon: VolunteerActivismIcon, title: "الدعاء", text: "الدعاء لهما بالرحمة والمغفرة، فهو أثرٌ يبقى بعد فراق الأحباب." },
  { icon: SchoolIcon, title: "العلم النافع", text: "نشر الخير والعلم النافع، وكلّ ما ينفع الناس ويبقى أجره." },
];

export default function HomePage() {
  usePageTitle("الرئيسية");
  const daily = useDailyContent();

  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <HeroSection />

      <Box sx={{ maxWidth: 860, mx: "auto", width: "100%" }}>
        <InstallPrompt />
        <SectionHeader
          title="ورد اليوم"
          subtitle="آيةٌ وذكرٌ ودعاءٌ وتذكيرٌ يتجدّد كل يوم، ويعمل دون اتصال."
        />
        <DailyWirdCard content={daily} />
      </Box>

      <Box component="section" aria-labelledby="services-heading">
        <SectionHeader
          title="أبواب الخير"
          subtitle="اختر ما تريد من قراءةٍ وذكرٍ ودعاء."
        />
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {SERVICES.map((s) => (
            <Grid key={s.to} item xs={12} sm={6} md={4}>
              <ServiceCard {...s} />
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ height: "100%" }}>
              <DailyDeedCard />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ادعُ لهما */}
      <Box component="section" aria-labelledby="dua-for-them">
        <SectionHeader
          title="لا تنساهما من صالح دعائك"
          subtitle="ادعُ لهما بهذه الأدعية، أو شاركها مع من تحب."
        />
        <Grid container spacing={2}>
          {DUA_FOR_THEM.map((dua) => (
            <Grid key={dua} item xs={12} sm={6}>
              <IslamicCard
                sx={{
                  height: "100%",
                  transition: "transform .2s ease, box-shadow .2s ease",
                  "&:hover": { transform: "translateY(-3px)" },
                }}
              >
                <Stack spacing={2}>
                  <Typography sx={{ fontFamily: fonts.naskh, fontSize: "1.2rem", lineHeight: 2 }}>
                    {dua}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <ShareButton text={withDedication(`﴿ ${dua} ﴾`)} label="مشاركة" size="small" />
                  </Box>
                </Stack>
              </IslamicCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* أعمال يُرجى بها الأجر */}
      <Box
        component="section"
        aria-labelledby="sadaqah-heading"
        sx={{ position: "relative", overflow: "hidden", borderRadius: 4, p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
      >
        <IslamicPattern opacity={0.045} />
        <Box sx={{ position: "relative" }}>
          <SectionHeader
            title="أعمال يُرجى بها الأجر"
            subtitle="نسأل الله أن يجعل هذا موقعًا نافعًا، وأن يكتب أجره لمن سهّل نشره."
          />
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {GOOD_DEEDS.map(({ icon: Icon, title, text }) => (
              <Grid key={title} item xs={12} sm={6} md={3}>
                <Stack spacing={1.5} sx={{ height: "100%" }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: "14px",
                      bgcolor: "rgba(201,162,75,0.16)",
                      color: "secondary.dark",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
                    {title}
                  </Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.9 }}>
                    {text}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Stack>
  );
}

/** بطاقة إضافية في شبكة الأبواب توجّه إلى ورد اليوم. */
function DailyDeedCard() {
  return (
    <IslamicCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack spacing={1.5} sx={{ height: "100%" }}>
        <Box
          aria-hidden
          sx={{
            width: 52,
            height: 52,
            borderRadius: "16px",
            bgcolor: "rgba(201,162,75,0.16)",
            color: "secondary.dark",
            display: "grid",
            placeItems: "center",
          }}
        >
          <StorefrontIcon />
        </Box>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
          ورد اليوم
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ flexGrow: 1 }}>
          وردٌ يومي متكامل من آيةٍ وذكرٍ ودعاء، يتجدّد مع كل يوم.
        </Typography>
        <ShareButton text={withDedication("صدقة جارية: قرآن وأذكار وأدعية وتسبيح ")} label="مشاركة الموقع" size="small" />
      </Stack>
    </IslamicCard>
  );
}
