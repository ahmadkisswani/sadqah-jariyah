// =========================
// COPY RUQYAH TEXT
// =========================

function copyText(button) {

    const card = button.closest(".ruqyah-card");

    const text = card.querySelector(".ruqyah-text").innerText;

    navigator.clipboard.writeText(text)
        .then(() => {

            const oldText = button.innerText;

            button.innerText = "✅ تم النسخ";

            button.classList.remove("btn-outline-success");
            button.classList.add("btn-success");

            setTimeout(() => {

                button.innerText = oldText;

                button.classList.remove("btn-success");
                button.classList.add("btn-outline-success");

            }, 1500);

        })
        .catch(() => {

            alert("تعذر نسخ النص");

        });
        

}
function loadRuqyahPlayer(button) {

    const container = button.parentElement;
    const audioUrl = container.dataset.src;

    const iframe = document.createElement("iframe");

    iframe.src = audioUrl;
    iframe.width = "100%";
    iframe.height = "280";
    iframe.frameBorder = "0";
    iframe.loading = "lazy";

    container.innerHTML = "";
    container.appendChild(iframe);
}
