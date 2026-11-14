/* وضع اللون قبل تحميل React — لا يرسل أو يقرأ أي بيانات خارج الجهاز. */
(function () {
  try {
    var key = "sj-theme-mode";
    var stored = window.localStorage.getItem(key);
    var dark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    var mode = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = mode;
    document.documentElement.style.backgroundColor = dark ? "#0F1F1A" : "#FBF8F1";
  } catch (error) {
    /* التخزين غير متاح — تبقى القيم الافتراضية */
  }
})();
