const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
    res.send("MenuMind Backend Running");
});
async function analyzeMenu(){
    if(!menuImage || !menuImage.files[0]){
        alert("Please upload a menu photo first.");
        return;
    }

    const loadingScreen = document.getElementById("loadingScreen");
    const ocrText = document.getElementById("ocrText");

    if(loadingScreen){
        loadingScreen.classList.add("active");
    }

    try{
        const result = await Tesseract.recognize(
            menuImage.files[0],
            "eng"
        );

        const extractedText = result.data.text.trim();

        if(ocrText){
            ocrText.value = extractedText;
        }

        localStorage.setItem("menuMindOCRText", extractedText);

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

        if(data.success){
            localStorage.setItem("menuMindAIResult", JSON.stringify(data.analysis));
            window.location.href = "result.html";
        }else{
            alert("AI analysis failed.");
            loadingScreen.classList.remove("active");
        }

    }catch(error){
        console.error(error);
        alert("Something went wrong. Please try again.");

        if(loadingScreen){
            loadingScreen.classList.remove("active");
        }
    }
}

app.listen(5000, () => {
    console.log("🚀 MenuMind backend running on http://localhost:5000");
});