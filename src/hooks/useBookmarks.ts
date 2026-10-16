import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { BookmarkedAyah } from "../data/quran/types";

const MAX_BOOKMARKS = 300;

/** إدارة الآيات المحفوظة في localStorage — بلا حساب ولا خادم. */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkedAyah[]>("sj-bookmarks", []);

  const isBookmarked = useCallback(
    (surah: number, ayah: number) =>
      bookmarks.some((b) => b.surah === surah && b.ayah === ayah),
    [bookmarks],
  );

  const toggle = useCallback(
    (entry: Omit<BookmarkedAyah, "savedAt">) => {
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.surah === entry.surah && b.ayah === entry.ayah);
        if (exists) {
          return prev.filter((b) => !(b.surah === entry.surah && b.ayah === entry.ayah));
        }
        return [{ ...entry, savedAt: Date.now() }, ...prev].slice(0, MAX_BOOKMARKS);
      });
    },
    [setBookmarks],
  );

  const remove = useCallback(
    (surah: number, ayah: number) =>
      setBookmarks((prev) => prev.filter((b) => !(b.surah === surah && b.ayah === ayah))),
    [setBookmarks],
  );

  const clear = useCallback(() => setBookmarks([]), [setBookmarks]);

  return { bookmarks, isBookmarked, toggle, remove, clear };
}
