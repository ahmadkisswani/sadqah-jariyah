const API_URL = "https://api.alquran.cloud/v1";

const SURAH_AUDIO_BASE_URL =
    "https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy";

const AUDIO_BASE_URL =
    "https://cdn.islamic.network/quran/audio/128/ar.alafasy";


// ===============================
// Elements
// ===============================

const surahSelect = document.getElementById("surahSelect");

const surahInfo = document.getElementById("surahInfo");

const readSection = document.getElementById("readSection");
const audioSection = document.getElementById("audioSection");

const readModeBtn = document.getElementById("readModeBtn");
const audioModeBtn = document.getElementById("audioModeBtn");

const mushafPageContainer =
    document.getElementById("mushafPageContainer");

const pageNavigation =
    document.getElementById("pageNavigation");

const previousPageBtn =
    document.getElementById("previousPageBtn");

const nextPageBtn =
    document.getElementById("nextPageBtn");

const pageNumber =
    document.getElementById("pageNumber");


// Audio
const quranAudio =
    document.getElementById("quranAudio");

const audioSurahName =
    document.getElementById("audioSurahName");

const audioStatus =
    document.getElementById("audioStatus");

const playAudioBtn =
    document.getElementById("playAudioBtn");

const pauseAudioBtn =
    document.getElementById("pauseAudioBtn");

const previousAyahBtn =
    document.getElementById("previousAyahBtn");

const nextAyahBtn =
    document.getElementById("nextAyahBtn");

const currentAyahBox =
    document.getElementById("currentAyahBox");

const currentAyahText =
    document.getElementById("currentAyahText");

const audioAyahsContainer =
    document.getElementById("audioAyahsContainer");


// ===============================
// Variables
// ===============================

let currentSurah = null;

let currentPages = [];

let currentPageIndex = 0;

let currentAudioAyahIndex = 0;


// ===============================
// Load Surahs
// ===============================

async function loadSurahs() {

    try {

        const response =
            await fetch(`${API_URL}/surah`);

        if (!response.ok) {
            throw new Error("Failed to load surahs");
        }

        const result =
            await response.json();

        surahSelect.innerHTML =
            `<option value="">اختر السورة</option>`;

        result.data.forEach(surah => {

            const option =
                document.createElement("option");

            option.value = surah.number;

            option.textContent =
                `${surah.number}. ${surah.name}`;

            surahSelect.appendChild(option);

        });

    }
    catch (error) {

        console.error(error);

        surahSelect.innerHTML =
            `<option value="">تعذر تحميل السور</option>`;

        surahInfo.innerHTML = `
            <div class="alert alert-danger">
                تعذر تحميل السور.
                تأكد أنك تستخدم Live Server.
            </div>
        `;

    }

}


// ===============================
// Load Selected Surah
// ===============================

async function loadSurah(surahNumber) {

    if (!surahNumber) {
        return;
    }

    try {

        mushafPageContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-success"></div>
                <p class="mt-3">
                    جاري تحميل السورة...
                </p>
            </div>
        `;

        audioAyahsContainer.innerHTML = "";

        pageNavigation.classList.add("d-none");

        const response =
            await fetch(
                `${API_URL}/surah/${surahNumber}/quran-uthmani-quran-academy`
            );

        if (!response.ok) {
            throw new Error("Failed to load surah");
        }

        const result =
            await response.json();

        currentSurah = result.data;

        // =========================
        // Surah Information
        // =========================

        surahInfo.innerHTML = `

            <div class="surah-title-box">

                <h2 class="fw-bold mb-2">
                    ${currentSurah.name}
                </h2>

                <p class="mb-1">
                    ${currentSurah.englishName}
                </p>

                <small class="text-muted">
                    عدد الآيات: ${currentSurah.numberOfAyahs}
                    |
                    ${currentSurah.revelationType === "Meccan"
                        ? "مكية"
                        : "مدنية"}
                </small>

            </div>

        `;


        // =========================
        // Create Pages
        // =========================

        createPages(currentSurah.ayahs);


        // =========================
        // Prepare Audio
        // =========================

        prepareAudio();


        // Show first page
        currentPageIndex = 0;

        renderCurrentPage();


    }
    catch (error) {

        console.error(error);

        mushafPageContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                حدث خطأ أثناء تحميل السورة.
            </div>
        `;

    }

}


// ===============================
// Create Pages
// ===============================

function createPages(ayahs) {

    const pages = {};

    ayahs.forEach(ayah => {

        const page = ayah.page;

        if (!pages[page]) {
            pages[page] = [];
        }

        pages[page].push(ayah);

    });

    currentPages =
        Object.keys(pages)
            .sort((a, b) => Number(a) - Number(b))
            .map(page => {

                return {
                    pageNumber: page,
                    ayahs: pages[page]
                };

            });

}


// ===============================
// Render Current Page
// ===============================

function renderCurrentPage() {

    if (!currentPages.length) {
        return;
    }

    const page =
        currentPages[currentPageIndex];


    // =========================
    // Page HTML
    // =========================

    let html = `

        <div class="mushaf-page">

            <div class="mushaf-page-header">

                <span>
                    ${currentSurah.name}
                </span>

                <span>
                    صفحة ${page.pageNumber}
                </span>

            </div>

            <div class="mushaf-content">

    `;


    // Bismillah
    // Don't display before At-Tawbah

    if (
        Number(currentSurah.number) !== 9 &&
        Number(page.pageNumber) === Number(currentSurah.ayahs[0].page)
    ) {

        html += `

            <div class="bismillah">
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </div>

        `;

    }


    // =========================
    // Ayahs
    // =========================

    page.ayahs.forEach(ayah => {

        html += `

            <span class="mushaf-ayah">

                ${ayah.text}

                <span class="ayah-number-circle">
                    ${toArabicNumber(ayah.numberInSurah)}
                </span>

            </span>

        `;

    });


    html += `

            </div>

            <div class="mushaf-page-footer">
                ${page.pageNumber}
            </div>

        </div>

    `;


    mushafPageContainer.innerHTML = html;


    // =========================
    // Navigation
    // =========================

    pageNavigation.classList.remove("d-none");

    pageNumber.textContent =
        `صفحة ${currentPageIndex + 1} من ${currentPages.length}`;


    previousPageBtn.disabled =
        currentPageIndex === 0;

    nextPageBtn.disabled =
        currentPageIndex === currentPages.length - 1;

}


// ===============================
// Arabic Numbers
// ===============================

function toArabicNumber(number) {

    const arabicNumbers = [
        "٠",
        "١",
        "٢",
        "٣",
        "٤",
        "٥",
        "٦",
        "٧",
        "٨",
        "٩"
    ];

    return number
        .toString()
        .split("")
        .map(n => arabicNumbers[n])
        .join("");

}


// ===============================
// Page Navigation
// ===============================

previousPageBtn.addEventListener("click", () => {

    if (currentPageIndex > 0) {

        currentPageIndex--;

        renderCurrentPage();

        window.scrollTo({
            top: mushafPageContainer.offsetTop - 100,
            behavior: "smooth"
        });

    }

});


nextPageBtn.addEventListener("click", () => {

    if (currentPageIndex < currentPages.length - 1) {

        currentPageIndex++;

        renderCurrentPage();

        window.scrollTo({
            top: mushafPageContainer.offsetTop - 100,
            behavior: "smooth"
        });

    }

});


// ===============================
// Prepare Audio
// ===============================

function prepareAudio() {

    if (!currentSurah) {
        return;
    }

    audioSurahName.textContent =
        `🎧 ${currentSurah.name}`;

    audioStatus.textContent =
        "تلاوة الشيخ مشاري راشد العفاسي";

    currentAudioAyahIndex = 0;

    audioAyahsContainer.innerHTML = "";


    // =========================
    // Full Surah Audio
    // =========================

    const surahAudioURL =
        `${SURAH_AUDIO_BASE_URL}/${currentSurah.number}.mp3`;

    quranAudio.src =
        surahAudioURL;

    quranAudio.load();


    // =========================
    // Create Ayah List
    // =========================

    currentSurah.ayahs.forEach((ayah, index) => {

        const card =
            document.createElement("div");

        card.className =
            "audio-ayah-card";


        card.innerHTML = `

            <div class="audio-ayah-number">
                ${toArabicNumber(ayah.numberInSurah)}
            </div>

            <div class="audio-ayah-content">

                <div class="audio-ayah-text">
                    ${ayah.text}
                </div>

                <div class="mt-3">

                    <button
                        class="btn btn-success btn-sm play-ayah-btn">

                        ▶ استماع للآية

                    </button>

                </div>

            </div>

        `;


        const button =
            card.querySelector(".play-ayah-btn");


        button.addEventListener("click", () => {

            currentAudioAyahIndex = index;

            playAyah();

        });


        audioAyahsContainer.appendChild(card);

    });

}


// ===============================
// Load Ayah Audio
// ===============================

function loadAudioAyah(index) {

    if (
        !currentSurah ||
        !currentSurah.ayahs[index]
    ) {
        return;
    }

    const ayah =
        currentSurah.ayahs[index];


    const audioURL =
        `${AUDIO_BASE_URL}/${ayah.number}.mp3`;


    quranAudio.src =
        audioURL;

    quranAudio.load();


    currentAyahText.textContent =
        ayah.text;

    currentAyahBox.classList.remove("d-none");


    audioStatus.textContent =
        `الآية ${ayah.numberInSurah} من ${currentSurah.numberOfAyahs}`;

}


// ===============================
// Play Current Ayah
// ===============================

function playAyah() {

    loadAudioAyah(currentAudioAyahIndex);

    quranAudio.play()
        .catch(error => {
            console.error("Audio error:", error);
        });

}


// ===============================
// Audio Controls
// ===============================

// Play Full Surah

playAudioBtn.addEventListener("click", () => {

    quranAudio.play()
        .catch(error => {
            console.error("Audio error:", error);
        });

});


// Pause

pauseAudioBtn.addEventListener("click", () => {

    quranAudio.pause();

});


// Previous Ayah

previousAyahBtn.addEventListener("click", () => {

    if (currentAudioAyahIndex > 0) {

        currentAudioAyahIndex--;

        playAyah();

    }

});


// Next Ayah

nextAyahBtn.addEventListener("click", () => {

    if (
        currentAudioAyahIndex <
        currentSurah.ayahs.length - 1
    ) {

        currentAudioAyahIndex++;

        playAyah();

    }

});


// ===============================
// Audio Ended
// ===============================

quranAudio.addEventListener("ended", () => {

    // Full Surah audio ends here.
    // No automatic next ayah.

    audioStatus.textContent =
        "انتهت السورة";

});


// ===============================
// Change Surah
// ===============================

surahSelect.addEventListener("change", () => {

    const surahNumber =
        surahSelect.value;

    if (surahNumber) {

        loadSurah(surahNumber);

    }

});


// ===============================
// Reading / Audio Modes
// ===============================

readModeBtn.addEventListener("click", () => {

    readSection.classList.remove("d-none");

    audioSection.classList.add("d-none");

    readModeBtn.classList.remove("btn-outline-success");
    readModeBtn.classList.add("btn-success");

    audioModeBtn.classList.remove("btn-success");
    audioModeBtn.classList.add("btn-outline-success");

});


audioModeBtn.addEventListener("click", () => {

    audioSection.classList.remove("d-none");

    readSection.classList.add("d-none");

    audioModeBtn.classList.remove("btn-outline-success");
    audioModeBtn.classList.add("btn-success");

    readModeBtn.classList.remove("btn-success");
    readModeBtn.classList.add("btn-outline-success");

});


// ===============================
// Start
// ===============================

loadSurahs();