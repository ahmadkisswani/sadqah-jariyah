// ===============================
// Elements
// ===============================

const dhikrSelect =
    document.getElementById("dhikrSelect");

const targetSelect =
    document.getElementById("targetSelect");

const currentDhikr =
    document.getElementById("currentDhikr");

const counter =
    document.getElementById("counter");

const targetText =
    document.getElementById("targetText");

const totalCounter =
    document.getElementById("totalCounter");

const tasbeehBtn =
    document.getElementById("tasbeehBtn");

const resetBtn =
    document.getElementById("resetBtn");

const minusBtn =
    document.getElementById("minusBtn");

const completionMessage =
    document.getElementById("completionMessage");


// ===============================
// Variables
// ===============================

let count = 0;

let totalCount = 0;

let target =
    Number(targetSelect.value);


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
        .map(number => arabicNumbers[number])
        .join("");

}


// ===============================
// Update Display
// ===============================

function updateDisplay() {

    counter.textContent =
        toArabicNumber(count);

    totalCounter.textContent =
        toArabicNumber(totalCount);


    if (target === 0) {

        targetText.textContent =
            "بدون حد";

    }
    else {

        targetText.textContent =
            `من ${toArabicNumber(target)}`;

    }


    // Progress

    if (
        target > 0 &&
        count >= target
    ) {

        completionMessage.classList.remove(
            "d-none"
        );

        tasbeehBtn.disabled = true;

    }
    else {

        completionMessage.classList.add(
            "d-none"
        );

        tasbeehBtn.disabled = false;

    }

}


// ===============================
// Tasbeeh
// ===============================

tasbeehBtn.addEventListener(
    "click",
    () => {

        if (
            target > 0 &&
            count >= target
        ) {

            return;

        }


        count++;

        totalCount++;


        updateDisplay();


        // Mobile vibration

        if (
            navigator.vibrate
        ) {

            navigator.vibrate(30);

        }

    }
);


// ===============================
// Reset
// ===============================

resetBtn.addEventListener(
    "click",
    () => {

        count = 0;

        updateDisplay();

    }
);


// ===============================
// Minus
// ===============================

minusBtn.addEventListener(
    "click",
    () => {

        if (count > 0) {

            count--;

        }


        if (totalCount > 0) {

            totalCount--;

        }


        updateDisplay();

    }
);


// ===============================
// Change Dhikr
// ===============================

dhikrSelect.addEventListener(
    "change",
    () => {

        currentDhikr.textContent =
            dhikrSelect.value;

        count = 0;

        updateDisplay();

    }
);


// ===============================
// Change Target
// ===============================

targetSelect.addEventListener(
    "change",
    () => {

        target =
            Number(targetSelect.value);

        count = 0;

        updateDisplay();

    }
);


// ===============================
// Keyboard Support
// ===============================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            tasbeehBtn.click();

        }

    }
);


// ===============================
// Start
// ===============================

updateDisplay();
