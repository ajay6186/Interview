# =============================================================================
# EXERCISE 02: Path Parameters
# =============================================================================
# GOAL: Learn how to capture dynamic values from the URL path.
#
# CONCEPTS:
#   - {param_name} in the route path
#   - Automatic type conversion (int, str, float)
#   - Type validation — FastAPI rejects wrong types automatically
#   - Predefined path values with Enum
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#   Test URLs:
#     http://127.0.0.1:8000/users/42
#     http://127.0.0.1:8000/users/abc   <- will return validation error
#     http://127.0.0.1:8000/items/sword
#     http://127.0.0.1:8000/category/electronics
#
# =============================================================================

from fastapi import FastAPI
from enum import Enum

app = FastAPI()


# TODO 1: Create a GET endpoint at "/users/{user_id}"
#   - user_id should be typed as int
#   - Return {"user_id": user_id}
#   Hint: def get_user(user_id: int):

@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"user_id": user_id}


# TODO 2: Create a GET endpoint at "/items/{item_name}"
#   - item_name should be typed as str
#   - Return {"item_name": item_name, "item_name_upper": item_name.upper()}

@app.get("/items/{item_name}")
def get_item_name(item_name: str):
    return {"item_name": item_name, "item_name_upper": item_name.upper()}


# TODO 3: Create an Enum class called ModelName with:
#   - alexnet = "alexnet"
#   - resnet = "resnet"
#   - lenet = "lenet"
#   Hint: class ModelName(str, Enum): ...

class ModelName(str, Enum):
    alexnet = "alexnet"
    resnet = "resnet"
    lenet = "lenet"

# TODO 4: Create a GET endpoint at "/models/{model_name}"
#   - model_name should be typed as ModelName (the Enum)
#   - If model_name is ModelName.alexnet, return {"model": model_name, "message": "Deep Learning FTW!"}
#   - If model_name is ModelName.lenet, return {"model": model_name, "message": "LeCNN all the images"}
#   - Otherwise return {"model": model_name, "message": "Have some residuals"}

@app.get("/models/{model_name}")
def get_model_name(model_name: ModelName):
    if model_name is ModelName.alexnet:
        return {"model": model_name, "message": "Deep Learning FTW!"}
    if model_name is ModelName.lenet:
        return {"model": model_name, "message":"LeCNN all the images"}
    return {"model": model_name, "message": "Have some residuals"}
    