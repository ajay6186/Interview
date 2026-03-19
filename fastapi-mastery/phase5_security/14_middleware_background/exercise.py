# =============================================================================
# EXERCISE 14: Middleware & Background Tasks
# =============================================================================
# GOAL: Add cross-cutting concerns with middleware and run tasks in background.
#
# CONCEPTS:
#   - @app.middleware("http") - intercept every request/response
#   - CORSMiddleware - allow cross-origin requests
#   - BackgroundTasks - run work after returning response
#   - Logging, timing, adding headers via middleware
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#
# =============================================================================

from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import time

app = FastAPI()


# TODO 1: Add CORS middleware to the app
#   - Allow origins: ["http://localhost:3000", "http://localhost:8080"]
#   - Allow all methods and headers
#   - allow_credentials=True
#   Hint:
#     app.add_middleware(
#         CORSMiddleware,
#         allow_origins=[...],
#         allow_credentials=True,
#         allow_methods=["*"],
#         allow_headers=["*"],
#     )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# TODO 2: Add a timing middleware
#   - Record start time before passing to next handler
#   - After response, calculate elapsed time
#   - Add header "X-Process-Time" to the response
#   Hint:
#     @app.middleware("http")
#     async def add_process_time_header(request: Request, call_next):
#         start_time = time.time()
#         response = await call_next(request)
#         process_time = time.time() - start_time
#         response.headers["X-Process-Time"] = str(round(process_time, 4))
#         return response

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 4))
    return response


# --- Background Tasks ---
# Simulated "email log" (in real app this would send email)
email_log = []

def send_email_notification(email: str, message: str):
    """Simulate slow email sending (runs in background)."""
    time.sleep(2)   # pretend this takes 2 seconds
    email_log.append({"to": email, "message": message})
    print(f"Email sent to {email}: {message}")


class OrderCreate(BaseModel):
    product: str
    quantity: int
    customer_email: str


# TODO 3: POST "/orders"
#   - Accept OrderCreate body and BackgroundTasks
#   - Add send_email_notification as a background task:
#       background_tasks.add_task(send_email_notification, order.customer_email, f"Order confirmed: {order.product}")
#   - Return {"message": "Order placed!", "product": order.product} IMMEDIATELY
#     (the email sends in background after response)
#   Hint: def create_order(order: OrderCreate, background_tasks: BackgroundTasks):

@app.post("/orders")
def creat_order(order: OrderCreate, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        send_email_notification,
        order.customer_email,
        f"Order confirmed: {order.product} x{order.quantity}",
    )
    return {"message": "Order placed!", "product": order.product}


# TODO 4: GET "/email-log"
#   - Return the email_log list
#   - Wait a few seconds after POST /orders, then call this to see sent emails

@app.get("/email-log")
def get_email_log():
    return email_log
