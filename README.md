# MLdock

MLDock is a self-hosted model serving platform designed to simplify the deployment of machine learning models. It provides a lightweight infrastructure for ML engineers to expose multiple model frameworks as secure REST APIs without writing boilerplate backend code.

## Core Features

- **Automated API Generation:** Upload a serialized model and metadata schema, and MLDock dynamically provisions a validation-backed REST endpoint.
- **In-Memory Caching:** Models are lazy-loaded into memory upon first request to minimize startup latency and optimize memory footprint.
- **Access Control:** Includes built-in JWT authentication for the dashboard and SHA-256-hashed API keys for endpoint access.
- **Observability:** Tracks endpoint latency, memory usage, and request status codes.
- **Interactive Playground:** Test predictions and input schemas directly from the UI.
- **Multi-Framework Drivers:** Supports scikit-learn, PyTorch, TensorFlow/Keras, and ONNX models when the relevant runtime is installed.

## Architecture

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React, Redux Toolkit, Tailwind CSS, Vite
- **ML Stack:** `scikit-learn`, `joblib`, `torch`, `tensorflow`, `onnxruntime`
- **Security:** `passlib` (bcrypt), `python-jose`

## Getting Started

### Install (Docker — recommended)

All you need is [Docker](https://docs.docker.com/get-docker/) with Docker Compose. Nothing is built on your machine: the images are prebuilt and pulled from GitHub Container Registry.

1. Download the compose file into an empty folder:
   ```bash
   mkdir mldock && cd mldock
   curl -O https://raw.githubusercontent.com/RisHexx/MLdock/main/docker-compose.yml
   ```
   (On Windows PowerShell: `curl.exe -O ...`, or download the file from GitHub.)

2. Start MLDock:
   ```bash
   docker compose up -d
   ```

3. Open **http://localhost** and create your admin account.

That's it. Your models, API keys, and logs are stored in Docker volumes, so they survive restarts and upgrades.

**Upgrade to the latest version:**
```bash
docker compose pull
docker compose up -d
```

**Pin a specific version:** create a `.env` file next to `docker-compose.yml` containing `MLDOCK_VERSION=1.0.0`.

**Stop:** `docker compose down` (keeps your data). `docker compose down -v` deletes all data.

> The dashboard is served on port 80. If that port is already in use, change `"80:80"` under `frontend` in `docker-compose.yml` to e.g. `"8080:80"` and open http://localhost:8080.

### Build from source

If you want to change the code, clone the repository and build the images locally:

```bash
git clone https://github.com/RisHexx/MLdock.git
cd MLdock
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build -d
```

### Local Development Setup

Start only the database in Docker, then run the backend and frontend directly:

```bash
docker compose up -d postgres
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scriptsctivate on Windows
pip install -r requirements.txt
cp .env.example .env      # then set DATABASE_URL to postgresql://mldock:mldock_secret@localhost:5432/mldock
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### Publishing images (maintainers)

Images are built and pushed to GHCR by `.github/workflows/docker-publish.yml` when a version tag is pushed:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This publishes `ghcr.io/rishexx/mldock-backend` and `ghcr.io/rishexx/mldock-frontend` tagged `1.0.0`, `1.0`, and `latest`.

## Usage: Deploying a Model

Models require a `metadata.json` file defining the expected schema. MLDock uses this to automatically generate Pydantic validation for the endpoint.

Supported model file extensions depend on the selected framework:

- scikit-learn: `.pkl`, `.joblib`
- PyTorch: `.pt`, `.pth`
- TensorFlow/Keras: `.h5`, `.keras`
- ONNX: `.onnx`

> **Note on PyTorch files:** `.pt` and `.pth` are the same format; what matters is what was saved inside.
>
> - A full model saved with `torch.save(model, "x.pth")` works. The catch is that the model's class code must be importable on the server, or the upload fails.
> - A weights-only file saved with `torch.save(model.state_dict(), "x.pth")` doesn't work. This is the most common kind of `.pth` file.
>
> For the most reliable results, export PyTorch models to ONNX and upload them with `"framework": "onnx"`.

Example `metadata.json`:

```json
{
  "name": "car-price",
  "display_name": "Car Price Predictor",
  "description": "Predicts used car prices based on input features",
  "framework": "sklearn",
  "version": "1.0.0",
  "input_schema": {
    "year": "integer",
    "km_driven": "integer",
    "fuel": "string",
    "transmission": "string"
  },
  "output_schema": {
    "prediction": "float"
  }
}
```

*Supported schema types: `integer`, `float`, `string`, `boolean`.*

The `framework` field should match the model type you upload. MLDock uses that value to select the appropriate runtime driver and validate the uploaded model file.
