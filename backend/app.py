from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
models = joblib.load(os.path.join(BASE_DIR, "models", "itemModel.pkl"))

class InputData(BaseModel):
    item_id: str
    price: float
    promo: int      # 0 or 1
    weekday: int    # 0=Monday to 6=Sunday
    month: int      # 1-12

@app.get("/")
def root():
    return {"status": "API is running"}

@app.post("/predict")
def predict(data: InputData):
    if data.item_id not in models:
        model = list(models.values())[0]
    else:
        model = models[data.item_id]

    features = np.array([[data.price, data.promo, data.weekday, data.month]])
    prediction = model.predict(features)
    return {"forecast": prediction.tolist()}