# صدقة جارية

موقع إسلامي بسيط ومُحسَّن للعمل على الويب، هادئ وسريع، يُعرض فقط لأجل الأجر، مكرَّس لروح:

- توبة عبد العزيز الجربوعه
- محمد احمد مسلم

نسأل الله أن يتقبل هذا العمل ويجعله صدقةً جاريةً عنهما، وينفع كل من قرأ أو ذكر أو دعا.

## الهدف

"صدقة جارية" هو موقع خالٍ من الإعلانات والتعقيد، يجمع بين قراءة القرآن الكريم، الأذكار، الأدعية، التسبيح، والرقية الشرعية، ويعمل دون اتصال (تعمل معظم الأقسام offline، أما التلاوة الصوتية من الإنترنت فقط).

**🔗 رابط تجريبي مباشر (Demo):** <https://sadqah-jariyah.ahmadkisswanisite.workers.dev/>

## الأقسام

- [الرئيسية](https://sadqah-jariyah.ahmadkisswanisite.workers.dev/) — آيات اليوم، الأذكار، الأدعية، والروابط
- [القرآن الكريم](https://sadqah-jariyah.ahmadkisswanisite.workers.dev/quran) — فهرس كامل للسور الـ١١٤، عرض كصفحات مصحف حقيقية (صفحة مصحف المدينة تلو الأخرى أو السورة كاملة في صفحة واحدة)، تلاوة آية بآية مع الانتقال التلقائي واختيار القارئ، تكبير/تصغير الخط، حفظ الآيات، ومتابعة القراءة
- [الأذكار](https://sadqah-jariyah.ahmadkisswanisite.workers.dev/azkar) — أذكار الصباح والمساء والنوم وبعد الصلاة مع عدّاد مريح وحفظ للتقدّم
- [الأدعية](https://sadqah-jariyah.ahmadkisswanisite.workers.dev/duas) — تصنيف واضح مع بحث عربي، ونصوص من القرآن والسنة
- [التسبيح](https://sadqah-jariyah.ahmadkisswanisite.workers.dev/tasbeeh) — عدّاد تسبيح كبير، أهداف ٣٣/١٠٠/مخصص، إجمالي، والاهتزاز عند التفعيل
- [الرقية الشرعية](https://sadqah-jariyah.ahmadkisswanisite.workers.dev/ruqyah) — آيات وأدعية الرقية، وتسجيلات عند الاتصال
- [ورد اليوم](https://sadqah-jariyah.ahmadkisswanisite.workers.dev/daily) — آية وذكر ودعاء وتذكير يتجدّد يوميًا
- [عن الموقع](https://sadqah-jariyah.ahmadkisswanisite.workers.dev/about) — نبذة عن العمل والغرض
- [المحفوظات](https://sadqah-jariyah.ahmadkisswanisite.workers.dev/bookmarks) — الآيات المحفوظة محليًا

## التقنية

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (كتابة خفيفة)
- [MUI 6](https://mui.com/) مع الثيم الداخلي، ألوان هادئة وعرض RTL
- [React Router 6](https://reactrouter.com/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) لتثبيت الموقع والعمل دون اتصال
- [Fontsource](https://fontsource.org/) — خطوط Amiri (للقرآن)، Noto Naskh Arabic، Noto Sans Arabic
- LocalStorage فقط، لا Firebase/Backend/تسجيل دخول، لا إعلانات، لا تتبّع

## النشر على Cloudflare (Workers / Pages)

- **رابط النشر الحالي (Demo):** <https://sadqah-jariyah.ahmadkisswanisite.workers.dev/>
- Cloudflare Pages: Framework preset = Vite، Build command = `npm run build`، Output directory = `dist`
- Cloudflare Workers: `npx wrangler deploy` مع توجيه الأصول الثابتة من `dist`
- لا حاجة لملف `_redirects` مع Workers؛ الخادم يتعامل مع مسارات SPA.

## التشغيل محليًا

```bash
npm install
npm run dev
npm run build
npm run preview
npm run verify   # التحقق من مخرجات البناء
npm run smoke    # اختبار دخاني حقيقي (واجهة + صوت) على نسخة dist
```

## ملاحظات

- النص القرآني مُضمَّن محليًا بالكامل (١١٤ سورة)؛ يعمل دون اتصال بعد الزيارة الأولى. التلاوة الصوتية تتطلب اتصالًا بالإنترنت.
- العرض الافتراضي للقرآن هو **صفحات مصحف المدينة** (١..٦٠٤) كما في المصحف: ترويسة بالجزء واسم السورة ورقم الصفحة، ونص متصل مضبوط، وعلامة دائرة لرقم كل آية. ويمكن التبديل إلى "متصل" (السورة كاملة في صفحة واحدة) أو "بطاقات".
- التلاوة تعمل آية بآية على iOS Safari وAndroid: عند لمس رقم الآية يبدأ التشغيل ويتابع تلقائيًا حتى نهاية السورة، مع شريط سفلي للتحكم واختيار القارئ ومشغّل نظام بديل عند الحاجة.
- البحث في القرآن يعتمد على فهرس السور. حجم الخط قابل للتعديل.
- جميع التقدّم (الأذكار، التسبيح، المحفوظات، ورد اليوم، التفضيلات) يُحفظ محليًا فقط.

**نسأل الله أن يقبل هذا العمل، ويكتب أجره في ميزان حسناتهما، ويجمعنا وإياهما في الفردوس الأعلى.**

---

*هذا العمل صدقة جارية فقط، بغير أي مقابل مادي.*