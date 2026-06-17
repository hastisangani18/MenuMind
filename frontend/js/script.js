console.log("MenuMind Loaded Successfully 🚀");

/* =========================
   SCAN PAGE IMAGE PREVIEW
========================= */

const uploadBox = document.getElementById("uploadBox");
const menuImage = document.getElementById("menuImage");
const previewArea = document.getElementById("previewArea");

if (uploadBox && menuImage && previewArea) {
    uploadBox.addEventListener("click", () => {
        menuImage.click();
    });

    menuImage.addEventListener("change", () => {
        const file = menuImage.files[0];

        if (file) {
            const imageURL = URL.createObjectURL(file);

            previewArea.innerHTML = `
                <img src="${imageURL}" alt="Uploaded Menu">
            `;
        }
    });
}

function clearPreview() {
    if (previewArea && menuImage) {
        previewArea.innerHTML = `<p>No image selected yet</p>`;
        menuImage.value = "";
    }
}

/* =========================
   OCR + GEMINI ANALYSIS
========================= */

async function analyzeMenu() {
    if (!menuImage || !menuImage.files[0]) {
        alert("Please upload a menu photo first.");
        return;
    }

    const loadingScreen = document.getElementById("loadingScreen");
    const ocrText = document.getElementById("ocrText");

    if (loadingScreen) {
        loadingScreen.classList.add("active");
    }

    try {
        const result = await Tesseract.recognize(
            menuImage.files[0],
            "eng"
        );

        const extractedText = result.data.text.trim();

        if (ocrText) {
            ocrText.value = extractedText;
        }

        localStorage.setItem("menuMindOCRText", extractedText);
        localStorage.removeItem("menuMindAIResult");

        try {
            const response = await fetch("http://localhost:5000/analyze-menu", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    menuText: extractedText
                })
            });

            const data = await response.json();

            if (data.success && Array.isArray(data.analysis)) {
                localStorage.setItem("menuMindAIResult", JSON.stringify(data.analysis));
            }

        } catch (apiError) {
            console.log("Gemini backend not available, using OCR fallback.");
        }

        setTimeout(() => {
            window.location.href = "result.html";
        }, 1000);

    } catch (error) {
        console.error(error);
        alert("OCR failed. Please try a clearer menu image.");

        if (loadingScreen) {
            loadingScreen.classList.remove("active");
        }
    }
}

/* =========================
   RESULT PAGE OCR TEXT
========================= */

const resultOcrText = document.getElementById("resultOcrText");

if (resultOcrText) {
    const savedOCR = localStorage.getItem("menuMindOCRText");

    if (savedOCR) {
        resultOcrText.textContent = savedOCR;
    }
}

/* =========================
   LOCAL FALLBACK DATABASE
========================= */

const foodDatabase = {
    "paneer butter masala": {
        calories: 480,
        protein: "18g",
        carbs: "32g",
        fat: "30g",
        allergens: "Dairy, Cashew",
        alternative: "Try Palak Paneer or Tandoori Paneer.",
        risk: "High Calorie"
    },
    "veg biryani": {
        calories: 620,
        protein: "12g",
        carbs: "92g",
        fat: "18g",
        allergens: "No major allergen detected",
        alternative: "Try Brown Rice Pulao or Vegetable Khichdi.",
        risk: "Medium"
    },
    "dal tadka": {
        calories: 220,
        protein: "13g",
        carbs: "28g",
        fat: "7g",
        allergens: "Ghee / Dairy",
        alternative: "Try plain dal with less oil and no ghee.",
        risk: "Better Choice"
    },
    "masala dosa": {
        calories: 350,
        protein: "8g",
        carbs: "55g",
        fat: "10g",
        allergens: "Gluten, Fermented Batter",
        alternative: "Try Plain Dosa or Idli Sambar.",
        risk: "Medium"
    },
    "chole bhature": {
        calories: 700,
        protein: "16g",
        carbs: "90g",
        fat: "28g",
        allergens: "Gluten, Oil",
        alternative: "Try Chole with Roti or Chole Rice.",
        risk: "High Calorie"
    },
    "pav bhaji": {
        calories: 520,
        protein: "10g",
        carbs: "65g",
        fat: "22g",
        allergens: "Butter, Gluten",
        alternative: "Try less butter bhaji with wheat roti.",
        risk: "High Calorie"
    },
    "crispy fish": {
        calories: 420,
        protein: "22g",
        carbs: "24g",
        fat: "24g",
        allergens: "Fish, Gluten, Oil",
        alternative: "Try grilled fish or fish tikka.",
        risk: "High Calorie"
    },
    "chilli fish": {
        calories: 390,
        protein: "24g",
        carbs: "28g",
        fat: "18g",
        allergens: "Fish, Soy, Gluten",
        alternative: "Try grilled chilli fish with less sauce.",
        risk: "Medium"
    },
    "fish pakora": {
        calories: 450,
        protein: "21g",
        carbs: "30g",
        fat: "26g",
        allergens: "Fish, Gram flour, Oil",
        alternative: "Try grilled fish starter.",
        risk: "High Calorie"
    },
    "honey chilli chicken": {
        calories: 430,
        protein: "25g",
        carbs: "35g",
        fat: "20g",
        allergens: "Soy, Gluten, Honey",
        alternative: "Try grilled chicken or chicken tikka.",
        risk: "Medium"
    },
    "dragon chicken": {
        calories: 460,
        protein: "28g",
        carbs: "30g",
        fat: "24g",
        allergens: "Soy, Gluten, Nuts",
        alternative: "Try roasted chicken with less sauce.",
        risk: "High Calorie"
    }
};

/* =========================
   DYNAMIC RESULT CARDS
========================= */

const dynamicResultGrid = document.getElementById("dynamicResultGrid");

if (dynamicResultGrid) {
    generateDynamicResults();
}

function generateDynamicResults() {
    const aiResult = safeParseJSON(localStorage.getItem("menuMindAIResult"));
    const ocrText = localStorage.getItem("menuMindOCRText") || "";

    let dishes = [];

    if (Array.isArray(aiResult) && aiResult.length > 0) {
        dishes = aiResult.map(item => ({
            dish: item.dish || "Unknown Dish",
            calories: Number(item.calories) || 350,
            protein: item.protein || "10g",
            carbs: item.carbs || "45g",
            fat: item.fat || "12g",
            allergens: item.allergens || "May contain dairy, gluten or nuts",
            alternative: item.alternative || "Choose grilled, steamed or less-oil version.",
            risk: item.risk || "Estimated"
        }));
    } else {
        dishes = extractDishesFromOCR(ocrText);
    }

    if (dishes.length === 0) {
        dishes = [{
            dish: "No dish detected",
            calories: 0,
            protein: "0g",
            carbs: "0g",
            fat: "0g",
            allergens: "Not available",
            alternative: "Please scan a clearer menu image.",
            risk: "Estimated"
        }];
    }

    dynamicResultGrid.innerHTML = "";

    let totalCalories = 0;
    let allergenCount = 0;

    dishes.forEach(item => {
        totalCalories += Number(item.calories) || 0;

        if (item.allergens && !item.allergens.toLowerCase().includes("no major")) {
            allergenCount++;
        }

        let riskClass = "medium";

        if (item.risk.toLowerCase().includes("high")) {
            riskClass = "high";
        } else if (
            item.risk.toLowerCase().includes("better") ||
            item.risk.toLowerCase().includes("low")
        ) {
            riskClass = "low";
        }

        dynamicResultGrid.innerHTML += `
            <div class="nutrition-card">
                <div class="dish-top">
                    <div>
                        <h2>${item.dish}</h2>
                        <p>AI estimated nutrition details</p>
                    </div>
                    <span class="risk ${riskClass}">${item.risk}</span>
                </div>

                <div class="calorie-box">
                    <h3>${item.calories} kcal</h3>
                    <p>Estimated per serving</p>
                </div>

                <div class="nutrition-values">
                    <div><strong>${item.protein}</strong><p>Protein</p></div>
                    <div><strong>${item.carbs}</strong><p>Carbs</p></div>
                    <div><strong>${item.fat}</strong><p>Fat</p></div>
                </div>

                <div class="alert-box">
                    <h4>⚠️ Possible Allergens</h4>
                    <p>${item.allergens}</p>
                </div>

                <div class="swap-box">
                    <h4>💚 Healthier Alternative</h4>
                    <p>${item.alternative}</p>
                </div>
            </div>
        `;
    });

    updateSummary(dishes.length, totalCalories, allergenCount);
}

function extractDishesFromOCR(text) {
    if (!text) return [];

    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 3);

    const cleanedDishes = [];

    lines.forEach(line => {
        const parts = line.split("|");

        parts.forEach(part => {
            let dish = part
                .replace(/[0-9]/g, "")
                .replace(/\([^)]*\)/g, "")
                .replace(/[^a-zA-Z\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim();

            const lower = dish.toLowerCase();

            if (
                dish.length > 4 &&
                !lower.includes("snacks") &&
                !lower.includes("font") &&
                !lower.includes("menu") &&
                !lower.includes("price") &&
                !lower.includes("restaurant")
            ) {
                const data = findFoodData(lower);

                cleanedDishes.push({
                    dish: titleCase(dish),
                    calories: data.calories,
                    protein: data.protein,
                    carbs: data.carbs,
                    fat: data.fat,
                    allergens: data.allergens,
                    alternative: data.alternative,
                    risk: data.risk
                });
            }
        });
    });

    return cleanedDishes.slice(0, 12);
}

function findFoodData(dishLower) {
    for (let key in foodDatabase) {
        if (dishLower.includes(key) || key.includes(dishLower)) {
            return foodDatabase[key];
        }
    }

    return {
        calories: 350,
        protein: "10g",
        carbs: "45g",
        fat: "12g",
        allergens: "May contain dairy, gluten or nuts",
        alternative: "Choose grilled, steamed or less-oil version.",
        risk: "Estimated"
    };
}

function updateSummary(dishes, calories, alerts) {
    const summaryCards = document.querySelectorAll(".summary-card h3");

    if (summaryCards.length >= 4) {
        summaryCards[0].textContent = dishes;
        summaryCards[1].textContent = calories;
        summaryCards[2].textContent = alerts;
        summaryCards[3].textContent = dishes;
    }
}

/* =========================
   HISTORY
========================= */

function saveToHistory() {
    const summaryCards = document.querySelectorAll(".summary-card h3");

    const historyData = {
        date: new Date().toLocaleString(),
        dishes: summaryCards[0]?.textContent || 0,
        calories: summaryCards[1]?.textContent || 0,
        alerts: summaryCards[2]?.textContent || 0
    };

    let history = JSON.parse(localStorage.getItem("menuMindHistory")) || [];
    history.push(historyData);

    localStorage.setItem("menuMindHistory", JSON.stringify(history));

    alert("Analysis saved to history!");
}

const historyList = document.getElementById("historyList");

if (historyList) {
    displayHistory();
}

function displayHistory() {
    const history = JSON.parse(localStorage.getItem("menuMindHistory")) || [];

    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <span>📭</span>
                <h2>No History Found</h2>
                <p>Your saved menu analysis reports will appear here.</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = "";

    history.reverse().forEach((item, index) => {
        historyList.innerHTML += `
            <div class="history-card">
                <div class="history-icon">🍽️</div>
                <h3>Menu Analysis #${history.length - index}</h3>
                <p class="date">${item.date}</p>

                <div class="history-stats">
                    <div><strong>${item.dishes}</strong><p>Dishes</p></div>
                    <div><strong>${item.calories}</strong><p>Calories</p></div>
                    <div><strong>${item.alerts}</strong><p>Alerts</p></div>
                </div>
            </div>
        `;
    });
}

function clearHistory() {
    localStorage.removeItem("menuMindHistory");
    displayHistory();
}

/* =========================
   HELPERS
========================= */

function safeParseJSON(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function titleCase(text) {
    return text
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}