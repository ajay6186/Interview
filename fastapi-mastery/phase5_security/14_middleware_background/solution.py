# =============================================================================
# SOLUTION 14: Middleware & Background Tasks
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
#   1. POST /orders -> response is instant
#   2. Wait 2 seconds, then GET /email-log -> see sent email
#   3. Check response headers for X-Process-Time
# =============================================================================

from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time

app = FastAPI()


# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Timing Middleware ---
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 4))
    return response


# --- Background Tasks ---
email_log = []


def send_email_notification(email: str, message: str):
    time.sleep(2)   # simulate slow IO
    email_log.append({"to": email, "message": message})
    print(f"[Background] Email sent to {email}: {message}")


class OrderCreate(BaseModel):
    product: str
    quantity: int
    customer_email: str


@app.post("/orders")
def create_order(order: OrderCreate, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        send_email_notification,
        order.customer_email,
        f"Order confirmed: {order.product} x{order.quantity}",
    )
    return {"message": "Order placed!", "product": order.product}


@app.get("/email-log")
def get_email_log():
    return email_log
