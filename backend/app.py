from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import tensorflow as tf
import numpy as np
from PIL import Image
import os

app = FastAPI()

# CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # allow all frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- MODEL LOADING ---------
MODEL_PATH = os.path.join("model", "mobilenetv2_model.h5")

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ Model Loaded Successfully!")
except Exception as e:
    print("❌ Error loading model:", e)
    model = None

# Waste classes
classes = [
    "battery", "biological", "cardboard", "clothes",
    "glass", "metal", "paper", "plastic", "shoes", "trash"
]

# --------- DEFAULT ROUTE ---------
@app.get("/")
def home():
    return {"message": "FastAPI Waste Classification Backend Running!"}

# --------- PREDICTION ROUTE ---------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        return {"error": "Model not loaded on server."}

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
        return {"error": f"Failed to process image: {e}"}

# --------- RUN SERVER ---------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
