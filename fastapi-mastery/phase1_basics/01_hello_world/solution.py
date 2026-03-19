# =============================================================================
# SOLUTION 01: Hello World
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
#   Then open: http://127.0.0.1:8000
#   Auto docs: http://127.0.0.1:8000/docs
# =============================================================================

from fastapi import FastAPI

# Create the FastAPI app instance
app = FastAPI()


# GET endpoint at root "/"
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}


# GET endpoint at "/about"
@app.get("/about")
def about():
    return {"app": "FastAPI Mastery", "version": "1.0"}
