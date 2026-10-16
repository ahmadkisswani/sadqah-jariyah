import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ayahAudioUrl, DEFAULT_RECITER_ID, getReciter } from "../data/quran/reciters";
import { useLocalStorage } from "./useLocalStorage";

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "error";

export type AudioTarget = {
  surah: number;
  ayah: number;
  /** الرقم العام للآية في المصحف — يُبنى منه رابط الملف الصوتي. */
  global: number;
};

/**
 * WAV صامت بمقطع فارغ — يُستخدم مرّة واحدة عند أول لمسة لفكّ قيد التشغيل
 * في iOS Safari، فيسمح بعدها بالتشغيل البرمجي (الانتقال التلقائي بين الآيات).
 */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

const GENERIC_ERROR = "تعذّر تشغيل التلاوة — تحقّق من الاتصال أو جرّب مشغّل النظام.";

/** عنصر صوت واحد مشترك — نُبقي عليه ونبدّل المصدر فقط (أفضل سلوك على iOS). */
let sharedAudio: HTMLAudioElement | null = null;

function getAudioElement(): HTMLAudioElement {
  if (sharedAudio) return sharedAudio;
  const element = new Audio();
  element.preload = "auto";
  // سمات يعتمد عليها iOS Safari لتشغيل الصوت داخل صفحة الويب
  element.setAttribute("playsinline", "true");
  element.setAttribute("webkit-playsinline", "true");
  sharedAudio = element;
  return element;
}

function isAbort(error: unknown): boolean {
  return (error as DOMException | undefined)?.name === "AbortError";
}

type Options = {
  /** يُستدعى عند انتهاء مقطع الآية — للانتقال التلقائي إلى الآية التالية. */
  onEnded?: () => void;
};

/**
 * محرّك تلاوة آيات القرآن، مبنيّ بعناية ليعمل على iOS Safari:
 *
 * - عنصر `<audio>` واحد مشترك لا يُعاد إنشاؤه مع كل تشغيل.
 * - `load()` قبل `play()` لأن Safari لا يبدأ التشغيل بعد تغيير المصدر بدونه.
 * - محاولة تشغيل ثانية تلقائيًا عند فشل الأولى (سلوك معروف في iOS أثناء التحميل).
 * - فكّ قيد التشغيل بمقطع صامت عند أول لمسة، ليعمل الانتقال التلقائي بين الآيات.
 */
export function useQuranAudio({ onEnded }: Options = {}) {
  const [reciterId, setReciterId] = useLocalStorage<string>("sj-quran-reciter", DEFAULT_RECITER_ID);
  const reciter = useMemo(() => getReciter(reciterId), [reciterId]);

  const [status, setStatus] = useState<AudioStatus>("idle");
  const [current, setCurrent] = useState<AudioTarget | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reciterRef = useRef(reciter);
  const currentRef = useRef<AudioTarget | null>(null);
  const endedRef = useRef(onEnded);
  const unlockedRef = useRef(false);

  useEffect(() => {
    reciterRef.current = reciter;
  }, [reciter]);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  // أحداث عنصر الصوت
  useEffect(() => {
    const audio = getAudioElement();

    const handlePlay = () => setStatus("playing");
    const handlePause = () =>
      setStatus((prev) => (prev === "playing" || prev === "loading" ? "paused" : prev));
    const handleWaiting = () => setStatus((prev) => (prev === "playing" ? "loading" : prev));
    const handleTime = () => setPosition(audio.currentTime || 0);
    const handleDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const handleEnded = () => {
      setPosition(0);
      setStatus((prev) => (prev === "error" ? prev : "idle"));
      endedRef.current?.();
    };
    const handleError = () => {
      // أخطاء مقطع الصمت (فكّ القيد) لا تخصّ المستخدم
      if (audio.currentSrc.startsWith("data:") || audio.src.startsWith("data:")) return;
      setStatus("error");
      setError(GENERIC_ERROR);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("playing", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("stalled", handleWaiting);
    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("durationchange", handleDuration);
    audio.addEventListener("loadedmetadata", handleDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("playing", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("stalled", handleWaiting);
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("durationchange", handleDuration);
      audio.removeEventListener("loadedmetadata", handleDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      // إيقاف التلاوة عند مغادرة صفحة القرآن
      audio.pause();
    };
  }, []);

  /** فكّ قيد التشغيل على iOS: مقطع صامت داخل نفس اللمسة. */
  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    const audio = getAudioElement();
    try {
      audio.src = SILENT_WAV;
      const started = audio.play();
      if (started && typeof started.then === "function") {
        void started
          .then(() => {
            // لا نوقف شيئًا إن كان المستخدم قد بدأ آية فعلية في الأثناء
            if (audio.src.startsWith("data:")) audio.pause();
          })
          .catch(() => {
            /* المقطع الصامت مجرّد محاولة — نتجاهل فشلها */
          });
      }
    } catch {
      /* نتجاهل أي فشل هنا */
    }
  }, []);

  const play = useCallback(
    async (target: AudioTarget) => {
      const audio = getAudioElement();
      if (!unlockedRef.current) unlock();

      setError(null);
      setPosition(0);
      setCurrent(target);
      setStatus("loading");

      const url = ayahAudioUrl(reciterRef.current, target.global);
      if (audio.src !== url) {
        audio.src = url;
        // إعادة التحميل ضرورية على iOS Safari بعد تغيير المصدر
        audio.load();
      }

      try {
        await audio.play();
        setStatus("playing");
      } catch (firstError) {
        if (isAbort(firstError)) return;
        // محاولة ثانية بعد إعادة التحميل (iOS يفشل أحيانًا في المرة الأولى)
        try {
          audio.load();
          await audio.play();
          setStatus("playing");
        } catch (secondError) {
          if (isAbort(secondError)) return;
          setStatus("error");
          setError(GENERIC_ERROR);
        }
      }
    },
    [unlock],
  );

  const pause = useCallback(() => {
    const audio = getAudioElement();
    if (!audio.paused) audio.pause();
    setStatus("paused");
  }, []);

  const stop = useCallback(() => {
    const audio = getAudioElement();
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      /* قد يرفض المتصفح قبل جاهزية المقطع — لا يهم */
    }
    setStatus("idle");
    setCurrent(null);
    setPosition(0);
    setDuration(0);
  }, []);

  /** تشغيل/إيقاف آية: إن كانت هي نفسها قيد التشغيل نُوقف، وإلا ننتقل إليها. */
  const toggle = useCallback(
    (target: AudioTarget) => {
      const audio = getAudioElement();
      const isSame = currentRef.current?.global === target.global;
      if (isSame && !audio.paused) pause();
      else void play(target);
    },
    [pause, play],
  );

  /** تغيير القارئ: يُعاد تحميل الآية الحالية بنفس موضع التشغيل. */
  const changeReciter = useCallback(
    (id: string) => {
      const nextReciter = getReciter(id);
      setReciterId(id);
      reciterRef.current = nextReciter;
      const target = currentRef.current;
      const audio = getAudioElement();
      if (target && !audio.paused) void play(target);
    },
    [play, setReciterId],
  );

  const seek = useCallback((seconds: number) => {
    const audio = getAudioElement();
    if (!Number.isFinite(audio.duration)) return;
    audio.currentTime = seconds;
    setPosition(seconds);
  }, []);

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  return useMemo(
    () => ({
      status,
      current,
      position,
      duration,
      progress,
      error,
      reciter,
      setReciter: changeReciter,
      play,
      pause,
      toggle,
      stop,
      seek,
      isActive: status === "playing" || status === "loading",
    }),
    [
      status,
      current,
      position,
      duration,
      progress,
      error,
      reciter,
      changeReciter,
      play,
      pause,
      toggle,
      stop,
      seek,
    ],
  );
}

export type QuranAudio = ReturnType<typeof useQuranAudio>;
