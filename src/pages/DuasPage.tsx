import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { duaCategories, getDuaCategory } from "../data/duas";
import { DuaCard } from "../components/DuaCard";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { usePageTitle } from "../hooks/usePageTitle";
import { toArabicNumber } from "../utils/arabic";

const DEFAULT = duaCategories[0].id;

export default function DuasPage() {
  usePageTitle("الأدعية");
  const [activeId, setActiveId] = useState(DEFAULT);
  const [query, setQuery] = useState("");
  const category = getDuaCategory(activeId) ?? duaCategories[0];

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return category.duas;
    const normalized = q.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
    return category.duas.filter((d) => {
      const text = d.text.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
      return text.includes(normalized);
    });
  }, [category, query]);

  return (
    <Stack spacing={4}>
      <SectionHeader
        title="الأدعية"
        subtitle="مجموعة من الأدعية من القرآن الكريم والسنة النبوية، مع نسخ ومشاركة."
      />

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap role="tablist" aria-label="فئات الأدعية">
        {duaCategories.map((c) => (
          <Chip
            key={c.id}
            label={c.title}
            role="tab"
            aria-selected={c.id === activeId}
            onClick={() => {
              setActiveId(c.id);
              setQuery("");
            }}
            color={c.id === activeId ? "primary" : "default"}
            variant={c.id === activeId ? "filled" : "outlined"}
            sx={{ fontWeight: 600, minHeight: 38 }}
          />
        ))}
      </Stack>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {category.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {category.description} • {toArabicNumber(category.duas.length)} دعاء
        </Typography>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في هذه الفئة…"
          aria-label="بحث في الأدعية"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon aria-hidden />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filtered.length === 0 ? (
        <EmptyState kind="search" description="جرّب كلمة أخرى أو اختر فئة مختلفة." />
      ) : (
        <Box>
          {filtered.map((d, i) => (
            <DuaCard key={`${category.id}-${i}`} dua={d} index={i} />
          ))}
        </Box>
      )}
    </Stack>
  );
}
