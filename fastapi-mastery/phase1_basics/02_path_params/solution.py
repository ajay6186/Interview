# =============================================================================
# SOLUTION 02: Path Parameters
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

from fastapi import FastAPI
from enum import Enum

app = FastAPI()


# --- Path param with int type ---
@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"user_id": user_id}


# --- Path param with str type ---
@app.get("/items/{item_name}")
def get_item(item_name: str):
    return {"item_name": item_name, "item_name_upper": item_name.upper()}


# --- Predefined values with Enum ---
class ModelName(str, Enum):
    alexnet = "alexnet"
    resnet = "resnet"
    lenet = "lenet"


@app.get("/models/{model_name}")
def get_model(model_name: ModelName):
    if model_name is ModelName.alexnet:
        return {"model": model_name, "message": "Deep Learning FTW!"}
    if model_name is ModelName.lenet:
        return {"model": model_name, "message": "LeCNN all the images"}
    return {"model": model_name, "message": "Have some residuals"}
