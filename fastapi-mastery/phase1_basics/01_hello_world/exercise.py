# =============================================================================
# EXERCISE 01: Hello World
# =============================================================================
# GOAL: Create your very first FastAPI application.
#
# CONCEPTS:
#   - FastAPI() app instance
#   - @app.get() decorator
#   - Returning a dict (auto-converted to JSON)
#   - Running with uvicorn
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#   Then open: http://127.0.0.1:8000
#   Auto docs: http://127.0.0.1:8000/docs
#
# =============================================================================

from fastapi import FastAPI
app = FastAPI()
# TODO 1: Create a FastAPI app instance
#   Hint: app = FastAPI()
app = FastAPI()


# TODO 2: Create a GET endpoint at path "/"
#   - It should return {"message": "Hello, FastAPI!"}
#   Hint: Use @app.get("/") decorator above the function

@app.get("/")
def test():
    return {"message": "Hello, FadtAPI!"}


# TODO 3: Create a GET endpoint at path "/about"
#   - It should return {"app": "FastAPI Mastery", "version": "1.0"}

@app.get("/about")
def about():
    return {"app": "FastAPI Mastery", "version": "1.0"}
