export type Zikr = { text: string; count: number };

export type AzkarCategory = {
  id: string;
  title: string;
  description: string;
  azkar: Zikr[];
};

/** أذكار الصباح */
const morning: AzkarCategory = {
  id: "morning",
  title: "أذكار الصباح",
  description: "أذكار الصباح المباركة، تُقال بعد الفجر حتى طلوع الشمس.",
  azkar: [
    {
      text: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
      count: 1,
    },
    {
      text: "اللهم بك أصبحنا وبك أمسينا، وبك نحيا وبك نموت وإليك النشور.",
      count: 1,
    },
    { text: "رضيت بالله ربًا، وبالإسلام دينًا، وبمحمد ﷺ نبيًا.", count: 3 },
    { text: "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.", count: 7 },
    { text: "اللهم إني أسألك العفو والعافية في الدنيا والآخرة.", count: 1 },
    { text: "سبحان الله وبحمده.", count: 100 },
    { text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.", count: 10 },
    { text: "أستغفر الله وأتوب إليه.", count: 100 },
  ],
};

/** أذكار المساء */
const evening: AzkarCategory = {
  id: "evening",
  title: "أذكار المساء",
  description: "أذكار المساء المباركة، تُقال بعد العصر حتى غروب الشمس.",
  azkar: [
    {
      text: "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
      count: 1,
    },
    {
      text: "اللهم بك أمسينا وبك أصبحنا، وبك نحيا وبك نموت وإليك المصير.",
      count: 1,
    },
    { text: "رضيت بالله ربًا، وبالإسلام دينًا، وبمحمد ﷺ نبيًا.", count: 3 },
    { text: "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.", count: 7 },
    { text: "اللهم إني أسألك العفو والعافية في الدنيا والآخرة.", count: 1 },
    { text: "سبحان الله وبحمده.", count: 100 },
    { text: "أستغفر الله وأتوب إليه.", count: 100 },
  ],
};

/** أذكار النوم */
const sleep: AzkarCategory = {
  id: "sleep",
  title: "أذكار النوم",
  description: "أذكار تقال قبل النوم.",
  azkar: [
    { text: "باسمك اللهم أموت وأحيا.", count: 1 },
    { text: "اللهم قني عذابك يوم تبعث عبادك.", count: 3 },
    { text: "سبحان الله.", count: 33 },
    { text: "الحمد لله.", count: 33 },
    { text: "الله أكبر.", count: 34 },
  ],
};

/** أذكار بعد الصلاة */
const afterPrayer: AzkarCategory = {
  id: "afterPrayer",
  title: "أذكار بعد الصلاة",
  description: "أذكار تقال بعد الصلوات المكتوبة.",
  azkar: [
    { text: "أستغفر الله.", count: 3 },
    { text: "اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام.", count: 1 },
    {
      text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
      count: 1,
    },
    { text: "سبحان الله.", count: 33 },
    { text: "الحمد لله.", count: 33 },
    { text: "الله أكبر.", count: 33 },
  ],
};

/** أذكار متنوعة — مقتصرة على أذكار واردة أعلاه وسائر الأذكار المشهورة. */
const misc: AzkarCategory = {
  id: "misc",
  title: "أذكار متنوعة",
  description: "أذكار مختارة للاستغفار والتسبيح والدعاء في أوقات متفرقة.",
  azkar: [
    { text: "أستغفر الله وأتوب إليه.", count: 100 },
    { text: "سبحان الله وبحمده.", count: 100 },
    { text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.", count: 10 },
    { text: "اللهم إني أسألك العفو والعافية في الدنيا والآخرة.", count: 1 },
    { text: "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.", count: 7 },
  ],
};

export const azkarCategories: AzkarCategory[] = [morning, evening, sleep, afterPrayer, misc];

export function getAzkarCategory(id: string): AzkarCategory | undefined {
  return azkarCategories.find((c) => c.id === id);
}
