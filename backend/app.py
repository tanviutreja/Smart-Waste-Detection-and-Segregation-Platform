from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import tensorflow as tf
import numpy as np
from PIL import Image
import os
import requests

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str


# ---------------- LOCAL AI FUNCTION ----------------
def ask_local_ai(message):

    prompt = f"""
You are an AI Waste Management Assistant.

Help users with:
- recycling
- waste disposal
- environmental impact
- sustainability

Give very short precise helpful answers.

User question: {message}
"""

    try:
        r = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            }
        )

        data = r.json()

        # Safe extraction
        return data.get("response", "AI could not generate a response.")

    except Exception as e:
        return f"Local AI error: {str(e)}"

# ---------------- MODEL LOADING ----------------
MODEL_PATH = os.path.join("model", "mobilenetv2_model.h5")

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ Waste Classification Model Loaded")
except Exception as e:
    print("❌ Model loading failed:", e)
    model = None


# Waste classes
classes = [
    "battery", "biological", "cardboard", "clothes",
    "glass", "metal", "paper", "plastic", "shoes", "trash"
]


# ---------------- DEFAULT ROUTE ----------------
@app.get("/")
def home():
    return {"message": "Smart Waste Detection Backend Running"}


# ---------------- PREDICTION ROUTE ----------------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    if model is None:
        return {"error": "Model not loaded"}

    try:
        img = Image.open(file.file).convert("RGB")
        img = img.resize((224, 224))
        img = np.array(img) / 255.0
        img = np.expand_dims(img, axis=0)

        prediction = model.predict(img)
        index = int(np.argmax(prediction))
        confidence = float(np.max(prediction))

        return {
            "class": classes[index],
            "confidence": round(confidence, 4)
        }

    except Exception as e:
        return {"error": f"Image processing failed: {str(e)}"}


# ---------------- AI CHATBOT ROUTE ----------------
@app.post("/chat")
async def chat(request: ChatRequest):

    try:

        reply = ask_local_ai(request.message)

        return {"reply": reply}

    except Exception as e:

        return {"reply": f"AI error: {str(e)}"}


# ---------------- RUN SERVER ----------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)