FROM python:3.11-slim

# No .pyc files, unbuffered logs (so `docker logs` shows output immediately)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# libpq5 is the only runtime system dependency (psycopg2-binary bundles the rest)
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first. The default Linux torch wheel bundles ~4 GB of
# NVIDIA CUDA libraries that a CPU server never uses; the CPU wheel is ~200 MB.
# requirements.txt then sees torch as already satisfied and won't pull the CUDA build.
RUN pip install --index-url https://download.pytorch.org/whl/cpu "torch>=2.0.0"

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Create storage directory (mounted as a volume in docker-compose)
RUN mkdir -p /app/storage

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
