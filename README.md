# MLDock

MLDock is a self-hosted model serving platform designed to simplify the deployment of machine learning models. It provides a lightweight infrastructure for ML engineers to expose `scikit-learn` models as secure REST APIs without writing boilerplate backend code.

## Core Features

- **Automated API Generation:** Upload a serialized model (`.pkl`) alongside a metadata schema, and MLDock dynamically provisions a validation-backed REST endpoint.
- **In-Memory Caching:** Models are lazy-loaded into memory upon first request to minimize startup latency and optimize memory footprint.
- **Access Control:** Includes built-in JWT authentication for the dashboard and HMAC-hashed API keys for endpoint access.
- **Observability:** Tracks endpoint latency, memory usage, and request status codes.
- **Interactive Playground:** Test predictions and input schemas directly from the UI.

## Architecture

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React, Redux Toolkit, Tailwind CSS, Vite
- **ML Stack:** `scikit-learn`, `joblib`
- **Security:** `passlib` (bcrypt), `python-jose`

## Getting Started

### Using Docker Compose (Recommended)

1. Clone the repository
2. Spin up the containers:
   ```bash
   docker compose up --build -d
   ```
3. Access the dashboard at `http://localhost:5173` (or your mapped port). The initial run will prompt you to configure the admin account.

### Local Development Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
export DATABASE_URL="postgresql://user:pass@localhost:5432/mldock"
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Usage: Deploying a Model

Models require a `metadata.json` file defining the expected schema. MLDock uses this to automatically generate Pydantic validation for the endpoint.

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
