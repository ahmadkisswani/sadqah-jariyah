# صدقة جارية

موقع إسلامي بسيط ومُحسَّن للعمل على الويب، هادئ وسريع، يُعرض فقط لأجل الأجر، مكرَّس لروح:

- توبة عبد العزيز الجربوعه
- محمد احمد مسلم

نسأل الله أن يتقبل هذا العمل ويجعله صدقةً جاريةً عنهما، وينفع كل من قرأ أو ذكر أو دعا.

## الهدف

"صدقة جارية" هو موقع خالٍ من الإعلانات والتعقيد، يجمع بين قراءة القرآن الكريم، الأذكار، الأدعية، التسبيح، والرقية الشرعية، ويعمل دون اتصال (تعمل معظم الأقسام offline، أما التلاوة الصوتية من الإنترنت فقط).

## الأقسام

- [الرئيسية](https://sadqah-jariyah.pages.dev/) — آيات اليوم، الأذكار، الأدعية، والروابط
- [القرآن الكريم](https://sadqah-jariyah.pages.dev/quran) — فهرس كامل للسور الـ١١٤، قراءة بتدبر، تكبير/تصغير الخط، حفظ الآيات، ومتابعة القراءة
- [الأذكار](https://sadqah-jariyah.pages.dev/azkar) — أذكار الصباح والمساء والنوم وبعد الصلاة مع عدّاد مريح وحفظ للتقدّم
- [الأدعية](https://sadqah-jariyah.pages.dev/duas) — تصنيف واضح مع بحث عربي، ونصوص من القرآن والسنة
- [التسبيح](https://sadqah-jariyah.pages.dev/tasbeeh) — عدّاد تسبيح كبير، أهداف ٣٣/١٠٠/مخصص، إجمالي، والاهتزاز عند التفعيل
- [الرقية الشرعية](https://sadqah-jariyah.pages.dev/ruqyah) — آيات وأدعية الرقية، وتسجيلات عند الاتصال
- [ورد اليوم](https://sadqah-jariyah.pages.dev/daily) — آية وذكر ودعاء وتذكير يتجدّد يوميًا
- [عن الموقع](https://sadqah-jariyah.pages.dev/about) — نبذة عن العمل والغرض
- [المحفوظات](https://sadqah-jariyah.pages.dev/bookmarks) — الآيات المحفوظة محليًا

## التقنية

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (كتابة خفيفة)
- [MUI 6](https://mui.com/) مع الثيم الداخلي، ألوان هادئة وعرض RTL
- [React Router 6](https://reactrouter.com/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) لتثبيت الموقع والعمل دون اتصال
- [Fontsource](https://fontsource.org/) — خطوط Amiri (للقرآن)، Noto Naskh Arabic، Noto Sans Arabic
- LocalStorage فقط، لا Firebase/Backend/تسجيل دخول، لا إعلانات، لا تتبّع

## النشر على Cloudflare Pages

1. Fork/Clone المستودع
2. في Cloudflare Pages اختر "Framework preset: Vite"
3. Build command: `npm run build`
4. Output directory: `dist`
5. SPA fallback موجود في `public/_redirects` (`/* /index.html 200`)

## التشغيل محليًا

```bash
npm install
npm run dev
npm run build
npm run preview
```

## ملاحظات

- النص القرآني مُضمَّن محليًا بالكامل (١١٤ سورة)؛ يعمل دون اتصال بعد الزيارة الأولى. التلاوة الصوتية تتطلب اتصالًا بالإنترنت.
- البحث في القرآن يعتمد على فهرس السور. حجم الخط قابل للتعديل.
- جميع التقدّم (الأذكار، التسبيح، المحفوظات، ورد اليوم، التفضيلات) يُحفظ محليًا فقط.

**نسأل الله أن يقبل هذا العمل، ويكتب أجره في ميزان حسناتهما، ويجمعنا وإياهما في الفردوس الأعلى.**

---

*هذا العمل صدقة جارية فقط، بغير أي مقابل مادي.*