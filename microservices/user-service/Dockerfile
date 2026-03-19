FROM python:3.12-slim
WORKDIR /app

# Non-root user for security
RUN groupadd -r app && useradd -r -g app app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
EXPOSE 3001
USER app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001"]
