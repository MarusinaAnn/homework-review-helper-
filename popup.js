document.addEventListener("DOMContentLoaded", async function () {
    const kodirovkaInput = document.getElementById("kodirovka");
    const zadanieInput = document.getElementById("zadanie");
    const ballsSelect = document.getElementById("balls");
    const templateTextArea = document.getElementById("template");
    const solutionContainer = document.getElementById("solution-container");
    const copyButton = document.getElementById("copyTemplate");

    let database = {}; // Загруженные данные

    // Определение месяца по второй букве кодировки
    function getMonthFromCode(code) {
        const monthMap = {
            'с': 'СЕНТЯБРЬ', 'о': 'ОКТЯБРЬ', 'н': 'НОЯБРЬ', 'д': 'ДЕКАБРЬ',
            'я': 'ЯНВАРЬ', 'ф': 'ФЕВРАЛЬ', 'м': 'МАРТ', 'а': 'АПРЕЛЬ',
            'й': 'МАЙ', 'х': 'ХАРД'
        };
        return monthMap[code[1]?.toLowerCase()] || 'МАРТ'; // По умолчанию март
    }

    // Загрузка JSON базы данных
    async function loadDatabase() {
        try {
            const response = await fetch("homework_db.json");
            database = await response.json();
        } catch (error) {
            console.error("Ошибка загрузки базы данных:", error);
        }
    }

// Функция обновления выпадающего списка (изначально весь список, затем фильтруется)
function updateSuggestions(inputElement, dataListId, items) {
    const dataList = document.getElementById(dataListId);
    dataList.innerHTML = "";

    let value = inputElement.value.toLowerCase();
    let filteredItems = value
        ? items.filter(item => item.toLowerCase().includes(value))
        : items; // Если поле пустое, показываем весь список

    filteredItems.forEach(item => {
        let option = document.createElement("option");
        option.value = item;
        dataList.appendChild(option);
    });
}

// При фокусе на кодировке — очищаем поле и сразу показываем весь список
kodirovkaInput.addEventListener("focus", function () {
    kodirovkaInput.value = ""; // Очищаем поле
    updateSuggestions(kodirovkaInput, "kodirovka-list", Object.keys(database));
});


kodirovkaInput.addEventListener("input", function () {
    updateSuggestions(kodirovkaInput, "kodirovka-list", Object.keys(database));
});

 // При фокусе на номере задания — очищаем поле и показываем все доступные номера
 zadanieInput.addEventListener("focus", function () {
    zadanieInput.value = ""; // Очищаем поле
    const selectedKod = kodirovkaInput.value.trim();
    if (database[selectedKod]) {
        updateSuggestions(zadanieInput, "zadanie-list", Object.keys(database[selectedKod]));
    }
});

// Автоподстановка номеров заданий (фильтруется по введенным символам)
zadanieInput.addEventListener("input", function () {
    const selectedKod = kodirovkaInput.value.trim();
    if (database[selectedKod]) {
        updateSuggestions(zadanieInput, "zadanie-list", Object.keys(database[selectedKod]));
    }
});

// При смене кодировки сбрасываем поле задания
kodirovkaInput.addEventListener("change", function () {
    zadanieInput.value = ""; // Очищаем номер задания
    ballsSelect.innerHTML = '<option value="">Выберите баллы</option>';
    templateTextArea.value = ""; // Очищаем шаблон
    solutionContainer.innerHTML = ""; // Очищаем картинки
});

// При смене номера задания сбрасываем баллы и шаблон
zadanieInput.addEventListener("change", function () {
    ballsSelect.innerHTML = '<option value="">Выберите баллы</option>';
    templateTextArea.value = "";
    solutionContainer.innerHTML = "";
});

    // 🔹 Загружаем список баллов после выбора задания
    zadanieInput.addEventListener("change", function () {
        ballsSelect.innerHTML = '<option value="">Выберите баллы</option>';
        const selectedKod = kodirovkaInput.value.trim();
        const selectedZad = zadanieInput.value.trim();
        if (database[selectedKod] && database[selectedKod][selectedZad]) {
            Object.keys(database[selectedKod][selectedZad]["cases"]).forEach(b => {
                let option = document.createElement("option");
                option.value = b;
                option.textContent = b;
                ballsSelect.appendChild(option);
            });
        }
    });

    // 🔹 Загружаем шаблон и изображения при выборе баллов
    ballsSelect.addEventListener("change", function () {
        const selectedKod = kodirovkaInput.value.trim();
        const selectedZad = zadanieInput.value.trim();
        const selectedBall = ballsSelect.value;

        if (database[selectedKod] && database[selectedKod][selectedZad]) {
            const data = database[selectedKod][selectedZad];
            const caseData = data["cases"]?.[selectedBall] || { comment: "Комментарий не найден", solution_images: [] };

            templateTextArea.value = `${data.start}\n\n${caseData.comment}\n\n${data.motivation}`;

            let examType = selectedKod.startsWith("Е") ? "ЕГЭ" : "ОГЭ"; 
            let month = getMonthFromCode(selectedKod); 

            // Очищаем контейнер и подгружаем новые изображения
            solutionContainer.innerHTML = "";
            caseData.solution_images.forEach(imgName => {
                let imgElement = document.createElement("img");
                imgElement.src = `https://marusinaann.github.io/solutions/${examType}/${month}/${selectedKod}/${imgName}`;
                imgElement.alt = "Эталонное решение";
                imgElement.style.maxWidth = "100%";
                imgElement.style.display = "block"; 
                imgElement.style.marginBottom = "10px"; 
                solutionContainer.appendChild(imgElement);
            });
        } else {
            console.warn("Шаблон не найден для:", selectedKod, selectedZad, selectedBall);
            templateTextArea.value = "Шаблон не найден";
            solutionContainer.innerHTML = "";
        }
    });

    copyButton.addEventListener("click", async function () {
        try {
            const selectedKod = kodirovkaInput.value.trim();
            const selectedZad = zadanieInput.value.trim();
            const selectedBall = ballsSelect.value;
    
            if (!database[selectedKod] || !database[selectedKod][selectedZad] || !database[selectedKod][selectedZad]["cases"][selectedBall]) {
                alert("Шаблон не найден.");
                return;
            }
    
            const data = database[selectedKod][selectedZad];
            const caseData = data["cases"][selectedBall];
    
            let examType = selectedKod.startsWith("Е") ? "ЕГЭ" : "ОГЭ";
            let month = getMonthFromCode(selectedKod);
    
            let imagesHTML = "";
            for (let img of caseData.solution_images) {
                let imgSrc = `https://marusinaann.github.io/solutions/${examType}/${month}/${selectedKod}/${img}`;
                
                imagesHTML += `<img src="${imgSrc}" alt="Эталонное решение" style="max-width:100%; display:block; margin-bottom:10px;">`;
            }
    
            const htmlContent = `
            <div>
                <p>${data.start}</p>
                <p style="margin-bottom:10px;">&nbsp;</p> <!-- Пустая строка -->
                <p>${caseData.comment}</p>
                ${imagesHTML}
                <p>${data.motivation}</p>
            </div>
        `;
    
            // Создаем временной элемент для копирования
            const tempElement = document.createElement("div");
            tempElement.innerHTML = htmlContent;
            document.body.appendChild(tempElement);
    
            // Используем Range для копирования HTML-контента
            const range = document.createRange();
            range.selectNodeContents(tempElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
    
            document.execCommand("copy");
            document.body.removeChild(tempElement);
    
            alert("Шаблон успешно скопирован!");
        } catch (error) {
            console.error("Ошибка копирования: ", error);
            alert("Ошибка копирования шаблона.");
        }
    });
    

    await loadDatabase();
});
