# Первый этап
FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --target=/install -r requirements.txt

# Второй этап
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONPATH="/usr/local/lib/python3.12/site-packages"

COPY --from=builder /install /usr/local/lib/python3.12/site-packages
COPY app.py .

CMD ["python", "app.py"]

