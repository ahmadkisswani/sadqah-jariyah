import { Box, Paper, Typography, useTheme } from "@mui/material";
import type { Ayah } from "../data/quran/types";
import { fonts } from "../theme";
import { toArabicNumber } from "../utils/arabic";

type Props = {
  surahNumber: number;
  surahName: string;
  revelation: string;
  ayahCount: number;
  juz?: number;
  /** رقم صفحة المصحف — يُترك فارغًا في العرض المتصل (السورة كاملة في صفحة واحدة). */
  pageNumber?: number;
  ayahs: Ayah[];
  /** إظهار إطار اسم السورة والبسملة (يبدأ بهما المصحف عند بداية السورة). */
  showSurahHeader: boolean;
  fontSize: number;
  playingAyah: number | null;
  selectedAyah: number | null;
  onSelectAyah: (ayahNumber: number) => void;
  onTogglePlay: (ayah: Ayah) => void;
  registerAyah: (ayahNumber: number, node: HTMLElement | null) => void;
};

/**
 * صفحة مصحف: إطار مذهّب، ترويسة بالجزء واسم السورة ورقم الصفحة،
 * ثم نص متصل مضبوط (justify) مع علامة دائرة لرقم كل آية.
 *
 * لمس النص يحدّد الآية (للمشاركة والحفظ)، ولمس الدائرة يُشغّل تلاوتها.
 */
export function MushafPage({
  surahNumber,
  surahName,
  revelation,
  ayahCount,
  juz,
  pageNumber,
  ayahs,
  showSurahHeader,
  fontSize,
  playingAyah,
  selectedAyah,
  onSelectAyah,
  onTogglePlay,
  registerAyah,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold = isDark ? "rgba(201,162,75,0.55)" : "rgba(201,162,75,0.8)";
  const hairline = isDark ? "rgba(201,162,75,0.28)" : "rgba(31,93,76,0.16)";
  const highlight = isDark ? "rgba(201,162,75,0.22)" : "rgba(31,93,76,0.12)";

  const showBasmala = showSurahHeader && surahNumber !== 1 && surahNumber !== 9;

  return (
    <Paper
      component="article"
      elevation={0}
      aria-label={
        pageNumber
          ? `صفحة ${pageNumber} من المصحف — سورة ${surahName}`
          : `سورة ${surahName} كاملة في صفحة واحدة`
      }
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 1, sm: 1.5 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        backgroundImage: isDark
          ? "radial-gradient(120% 60% at 50% 0%, rgba(201,162,75,0.07), transparent 62%)"
          : "radial-gradient(120% 60% at 50% 0%, rgba(201,162,75,0.11), transparent 62%)",
      }}
    >
      <Box
        sx={{
          border: `1px solid ${gold}`,
          borderRadius: 2,
          p: { xs: 1.5, sm: 2.5 },
          display: "flex",
          flexDirection: "column",
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {/* ترويسة الصفحة: الجزء — اسم السورة — رقم الصفحة */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 1,
            pb: 1,
            borderBottom: `1px solid ${hairline}`,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
            الجزء {toArabicNumber(juz ?? 1)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontFamily: fonts.naskh, fontWeight: 700, color: "primary.main", px: 1 }}
          >
            سورة {surahName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: "text.secondary", textAlign: "left" }}
          >
            {pageNumber ? `الصفحة ${toArabicNumber(pageNumber)}` : ""}
          </Typography>
        </Box>

        {/* إطار بداية السورة + البسملة */}
        {showSurahHeader && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box
              sx={{
                position: "relative",
                px: { xs: 3, sm: 5 },
                py: 1,
                textAlign: "center",
                border: `1px solid ${gold}`,
                borderRadius: 2,
                backgroundImage: `linear-gradient(90deg, transparent, ${
                  isDark ? "rgba(201,162,75,0.12)" : "rgba(201,162,75,0.16)"
                }, transparent)`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: fonts.naskh,
                  fontWeight: 700,
                  fontSize: { xs: "1.05rem", sm: "1.2rem" },
                  color: "secondary.dark",
                }}
              >
                سورة {surahName}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {revelation} • {toArabicNumber(ayahCount)} آية
              </Typography>
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  insetInlineStart: { xs: 8, sm: 14 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: gold,
                  fontSize: 14,
                }}
              >
                ۞
              </Box>
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  insetInlineEnd: { xs: 8, sm: 14 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: gold,
                  fontSize: 14,
                }}
              >
                ۞
              </Box>
            </Box>

            {showBasmala && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: { xs: 1, sm: 2 },
                }}
              >
                <Box aria-hidden sx={{ color: gold, fontSize: "1.05rem" }}>
                  ۞
                </Box>
                <Typography
                  sx={{
                    fontFamily: fonts.quran,
                    fontSize: { xs: `${Math.max(fontSize - 4, 16)}px`, sm: `${fontSize}px` },
                  }}
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </Typography>
                <Box aria-hidden sx={{ color: gold, fontSize: "1.05rem" }}>
                  ۞
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* نص الصفحة متصلًا كما في المصحف */}
        <Typography
          component="div"
          sx={{
            fontFamily: fonts.quran,
            fontSize: { xs: `${fontSize}px`, sm: `${fontSize + 2}px` },
            lineHeight: { xs: 2.3, sm: 2.45 },
            textAlign: "justify",
            textJustify: "inter-word",
            wordSpacing: "0.04em",
          }}
        >
          {ayahs.map((ayah) => {
            const isPlaying = playingAyah === ayah.numberInSurah;
            const isSelected = !isPlaying && selectedAyah === ayah.numberInSurah;

            return (
              <Box
                component="span"
                key={ayah.numberInSurah}
                ref={(node: HTMLElement | null) => registerAyah(ayah.numberInSurah, node)}
                sx={{ scrollMarginTop: 120, scrollMarginBottom: 140 }}
              >
                <Box
                  component="span"
                  onClick={() => onSelectAyah(ayah.numberInSurah)}
                  sx={{
                    cursor: "pointer",
                    px: "2px",
                    borderRadius: 1,
                    transition: "background-color .25s ease, color .25s ease",
                    backgroundColor: isPlaying ? highlight : isSelected ? "action.selected" : "transparent",
                    color: isPlaying ? "primary.main" : "inherit",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  {ayah.text}
                </Box>
                <Box
                  component="button"
                  type="button"
                  onClick={() => onTogglePlay(ayah)}
                  aria-label={
                    isPlaying
                      ? `إيقاف تلاوة الآية ${ayah.numberInSurah}`
                      : `استماع للآية ${ayah.numberInSurah}`
                  }
                  sx={{
                    display: "inline-grid",
                    placeItems: "center",
                    width: 30,
                    height: 30,
                    mx: "5px",
                    p: 0,
                    font: "inherit",
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1,
                    verticalAlign: "middle",
                    cursor: "pointer",
                    borderRadius: "50%",
                    border: `1px solid ${gold}`,
                    boxShadow: `inset 0 0 0 2px ${theme.palette.background.paper}, inset 0 0 0 3px ${hairline}`,
                    backgroundColor: isPlaying ? highlight : "transparent",
                    color: isPlaying ? "primary.main" : "secondary.dark",
                    transition: "transform .2s ease, background-color .2s ease",
                    "&:hover": { transform: "scale(1.08)" },
                  }}
                >
                  {toArabicNumber(ayah.numberInSurah)}
                </Box>
              </Box>
            );
          })}
        </Typography>

        {/* رقم الصفحة في أسفل الصفحة كما في المصحف */}
        {pageNumber ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              color: "secondary.dark",
            }}
          >
            <Box aria-hidden sx={{ width: { xs: 32, sm: 64 }, height: "1px", bgcolor: hairline }} />
            <Typography sx={{ fontFamily: fonts.naskh, fontWeight: 700, fontSize: "0.85rem" }}>
              {toArabicNumber(pageNumber)}
            </Typography>
            <Box aria-hidden sx={{ width: { xs: 32, sm: 64 }, height: "1px", bgcolor: hairline }} />
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
