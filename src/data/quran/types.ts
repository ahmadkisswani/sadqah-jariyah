export type Ayah = {
  number: number; // الرقم العام في المصحف
  numberInSurah: number;
  text: string;
  page: number;
  juz?: number;
};

export type BookmarkedAyah = {
  surah: number;
  surahName: string;
  ayah: number;
  text: string;
  savedAt: number;
};
