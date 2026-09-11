// ===============================
// Azkar Data
// ===============================

const azkarData = {

    morning: {

        title: "🌅 أذكار الصباح",

        description: "أذكار الصباح المباركة",

        azkar: [

            {
                text: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
                count: 1
            },

            {
                text: "اللهم بك أصبحنا وبك أمسينا، وبك نحيا وبك نموت وإليك النشور.",
                count: 1
            },

            {
                text: "رضيت بالله ربًا، وبالإسلام دينًا، وبمحمد ﷺ نبيًا.",
                count: 3
            },

            {
                text: "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.",
                count: 7
            },

            {
                text: "اللهم إني أسألك العفو والعافية في الدنيا والآخرة.",
                count: 1
            },

            {
                text: "سبحان الله وبحمده.",
                count: 100
            },

            {
                text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
                count: 10
            },

            {
                text: "أستغفر الله وأتوب إليه.",
                count: 100
            }

        ]

    },


    evening: {

        title: "🌇 أذكار المساء",

        description: "أذكار المساء المباركة",

        azkar: [

            {
                text: "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
                count: 1
            },

            {
                text: "اللهم بك أمسينا وبك أصبحنا، وبك نحيا وبك نموت وإليك المصير.",
                count: 1
            },

            {
                text: "رضيت بالله ربًا، وبالإسلام دينًا، وبمحمد ﷺ نبيًا.",
                count: 3
            },

            {
                text: "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.",
                count: 7
            },

            {
                text: "اللهم إني أسألك العفو والعافية في الدنيا والآخرة.",
                count: 1
            },

            {
                text: "سبحان الله وبحمده.",
                count: 100
            },

            {
                text: "أستغفر الله وأتوب إليه.",
                count: 100
            }

        ]

    },


    sleep: {

        title: "🌙 أذكار النوم",

        description: "أذكار تقال قبل النوم",

        azkar: [

            {
                text: "باسمك اللهم أموت وأحيا.",
                count: 1
            },

            {
                text: "اللهم قني عذابك يوم تبعث عبادك.",
                count: 3
            },

            {
                text: "سبحان الله.",
                count: 33
            },

            {
                text: "الحمد لله.",
                count: 33
            },

            {
                text: "الله أكبر.",
                count: 34
            }

        ]

    },


    afterPrayer: {

        title: "🕌 أذكار بعد الصلاة",

        description: "أذكار تقال بعد الصلوات",

        azkar: [

            {
                text: "أستغفر الله.",
                count: 3
            },

            {
                text: "اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام.",
                count: 1
            },

            {
                text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
                count: 1
            },

            {
                text: "سبحان الله.",
                count: 33
            },

            {
                text: "الحمد لله.",
                count: 33
            },

            {
                text: "الله أكبر.",
                count: 33
            }

        ]

    }

};


// ===============================
// Elements
// ===============================

const azkarContainer =
    document.getElementById("azkarContainer");

const categoryTitle =
    document.getElementById("categoryTitle");

const categoryDescription =
    document.getElementById("categoryDescription");

const progressText =
    document.getElementById("progressText");

const progressBar =
    document.getElementById("progressBar");

const categoryButtons =
    document.querySelectorAll("[data-category]");


// ===============================
// Variables
// ===============================

let currentCategory = "morning";

let completedAzkar = 0;


// ===============================
// Load Category
// ===============================

function loadCategory(category) {

    currentCategory = category;

    completedAzkar = 0;

    const categoryData =
        azkarData[category];

    if (!categoryData) {
        return;
    }


    // Title

    categoryTitle.textContent =
        categoryData.title;


    // Description

    categoryDescription.textContent =
        categoryData.description;


    // Update buttons

    categoryButtons.forEach(button => {

        const isActive =
            button.dataset.category === category;

        if (isActive) {

            button.classList.remove(
                "btn-outline-success"
            );

            button.classList.add(
                "btn-success"
            );

        }
        else {

            button.classList.remove(
                "btn-success"
            );

            button.classList.add(
                "btn-outline-success"
            );

        }

    });


    // Render Azkar

    renderAzkar(
        categoryData.azkar
    );

}


// ===============================
// Render Azkar
// ===============================

function renderAzkar(azkarList) {

    azkarContainer.innerHTML = "";


    azkarList.forEach(
        (zekr, index) => {

            const card =
                document.createElement("div");

            card.className =
                "azkar-card";


            card.innerHTML = `

                <div class="azkar-number">

                    ${index + 1}

                </div>


                <div class="azkar-content">

                    <div class="azkar-text">

                        ${zekr.text}

                    </div>


                    <div class="azkar-actions mt-4">


                        <div class="azkar-count">

                            <span>
                                عدد التكرار
                            </span>

                            <strong>
                                ${zekr.count}
                            </strong>

                        </div>


                        <button
                            class="btn btn-success azkar-counter-btn">

                            <span>
                                اضغط للتكرار
                            </span>

                            <span class="counter-number">
                                0
                            </span>

                        </button>


                    </div>

                </div>

            `;


            const counterButton =
                card.querySelector(
                    ".azkar-counter-btn"
                );

            const counterNumber =
                card.querySelector(
                    ".counter-number"
                );


            let currentCount = 0;


            counterButton.addEventListener(
                "click",
                () => {

                    if (
                        currentCount <
                        zekr.count
                    ) {

                        currentCount++;

                        counterNumber.textContent =
                            currentCount;

                    }


                    // Finished

                    if (
                        currentCount >=
                        zekr.count
                    ) {

                        counterButton.disabled =
                            true;

                        counterButton.classList.remove(
                            "btn-success"
                        );

                        counterButton.classList.add(
                            "btn-secondary"
                        );

                        counterButton.querySelector(
                            "span"
                        ).textContent =
                            "✓ تم";

                        completedAzkar++;

                        updateProgress();

                    }

                }
            );


            azkarContainer.appendChild(card);

        }
    );


    updateProgress();

}


// ===============================
// Progress
// ===============================

function updateProgress() {

    const total =
        azkarData[currentCategory]
            .azkar.length;


    progressText.textContent =
        `${completedAzkar} / ${total}`;


    const percentage =
        total === 0
            ? 0
            : (completedAzkar / total) * 100;


    progressBar.style.width =
        `${percentage}%`;

}


// ===============================
// Category Buttons
// ===============================

categoryButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const category =
                button.dataset.category;

            loadCategory(category);

        }
    );

});


// ===============================
// Start
// ===============================

loadCategory("morning");
