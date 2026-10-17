import { Box, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import CelebrationIcon from "@mui/icons-material/Celebration";
import EventIcon from "@mui/icons-material/Event";
import type { IslamicEvent } from "../../data/prayer/api";
import { STRINGS, type Lang } from "../../data/prayer/labels";
import { formatGregorianShort, relativeDays } from "../../utils/prayer";

type Props = {
  lang: Lang;
  events: IslamicEvent[] | null;
  loading: boolean;
  /** عدد المناسبات المعروضة (الافتراضي ٤). */
  limit?: number;
};

/** أقرب المناسبات الإسلامية (رمضان، العيدان، عرفة، عاشوراء…) من تقويم الخدمة. */
export function EventsCard({ lang, events, loading, limit = 4 }: Props) {
  const list = events?.slice(0, limit) ?? [];

  if (!loading && list.length === 0) return null;

  return (
    <Stack component="section" aria-label={STRINGS.events.ar} spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <EventIcon fontSize="small" color="secondary" />
        <Typography variant="h6" component="h3" sx={{ fontWeight: 800 }}>
          {STRINGS.events[lang]}
        </Typography>
      </Stack>

      {loading && list.length === 0 ? (
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={64} />
          <Skeleton variant="rounded" height={64} />
        </Stack>
      ) : (
        <Stack spacing={1}>
          {list.map((event) => {
            const isEid = event.key === "eid-fitr" || event.key === "eid-adha";
            return (
              <Paper
                key={`${event.key}-${event.dateKey}`}
                variant="outlined"
                data-event={event.key}
                sx={{
                  borderRadius: 3,
                  p: { xs: 1.5, md: 2 },
                  borderColor: isEid ? "secondary.main" : "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                  {isEid ? (
                    <CelebrationIcon fontSize="small" color="secondary" />
                  ) : (
                    <Box
                      aria-hidden
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "secondary.main",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {lang === "ar" ? event.ar : event.en}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ms: 1 }}>
                        {lang === "ar" ? event.en : event.ar}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatGregorianShort(event.dateKey, lang)}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  size="small"
                  color={isEid ? "secondary" : "default"}
                  variant={isEid ? "filled" : "outlined"}
                  label={relativeDays(event.daysUntil, lang)}
                />
              </Paper>
            );
          })}
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary">
        {STRINGS.hijriNote[lang]}
      </Typography>
    </Stack>
  );
}
