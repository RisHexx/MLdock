# MLDock Backend Complete Deep Dive

This document is a full interview-prep walkthrough of the MLDock backend.
It is written to help you answer:
- What each backend file does
- How requests move across layers
- Why specific syntax/patterns were used
- What trade-offs and edge cases exist
- How to explain improvements in an interview

---

## 1) High-Level Architecture

MLDock backend is a FastAPI-based ML model serving platform with:
- Control plane APIs for auth, model management, dashboard, logs
- Data plane API for live predictions
- SQLAlchemy ORM for persistence
- Driver-based runtime abstraction for multiple ML frameworks
- Metadata-driven model contracts for input and output validation

### Core design idea
A model is treated as:
1. Metadata contract (`metadata.json`)
2. Runtime artifact (`model.pkl`, `model.pt`, `.onnx`, etc.)
3. Database registry entry (`ml_models` table)

The runtime framework-specific inference logic is isolated in drivers, so the service layer is framework-agnostic.

---

## 2) Request Lifecycle (Startup to Prediction)

## App startup
1. Uvicorn starts FastAPI app from `app.main:app`.
2. Lifespan hook runs:
   - Initializes database schema
   - Ensures storage path exists
3. Routers are registered by concern (auth, models, predict, etc.).
4. CORS middleware allows frontend clients.

## Prediction lifecycle
1. Client calls `POST /predict/{model_name}` with JSON payload.
2. API key is read from `X-API-Key` header and validated.
3. Service loads model config from DB.
4. Input payload is validated against model input schema.
5. If model is not in memory cache, it is loaded from filesystem using proper driver.
6. Driver runs framework-specific inference.
7. Result is normalized to output schema.
8. Prediction log row is written (success/failure, latency, timestamps).
9. API response returns prediction and latency.

---

## 3) Folder Structure and Responsibility Split

- `app/routers`: HTTP layer (endpoints)
- `app/middleware`: auth dependencies and guards
- `app/services`: business logic and orchestration
- `app/models`: SQLAlchemy ORM entities
- `app/schemas`: Pydantic request/response models
- `app/drivers`: ML framework adapters
- `app/utils`: helper utilities (metadata parsing)

This is a classic layered backend with separation of concerns.

---

## 4) Complete File-by-File Explanation

## Root backend files

### `backend/.env.example`
Purpose:
- Template for runtime configuration values.

Key fields:
- `DATABASE_URL`: SQLAlchemy database connection
- `SECRET_KEY`: JWT signing key
- `STORAGE_PATH`: model artifact directory

Interview angle:
- Explain that secrets should be generated securely and never committed.
- Mention blank defaults are developer-friendly but risky if copied to production.

### `backend/.gitignore`
Purpose:
- Prevent committing secrets, generated files, caches, local DB/storage data.

Interview angle:
- Helps enforce clean repos and avoid secret leakage.

### `backend/Dockerfile`
Purpose:
- Reproducible backend container build and startup command.

What to explain:
- Uses slim Python image for size/performance balance
- Installs system dependencies for Python packages
- Installs requirements
- Starts uvicorn

Interview angle:
- Can discuss multi-stage builds, non-root users, healthchecks, and image hardening as next steps.

### `backend/requirements.txt`
Purpose:
- Python dependency lock baseline.

Major dependency groups:
- API/web: FastAPI, Uvicorn
- Auth/security: python-jose, passlib, bcrypt
- DB/ORM: SQLAlchemy, psycopg2
- ML runtimes: scikit-learn, torch, tensorflow, onnxruntime

Interview angle:
- Discuss pinning strategy and reproducibility concerns.

---

## App core files

### `backend/app/__init__.py`
Purpose:
- Package marker file.

### `backend/app/config.py`
Purpose:
- Centralized settings object via environment variables.

Syntax and pattern:
- Pydantic `BaseSettings` is used for typed env loading.
- `.env` support keeps dev setup simple.

Interview angle:
- Typed config avoids stringly-typed bugs.
- Central config improves testability and maintainability.

### `backend/app/database.py`
Purpose:
- Database engine/session/base declaration and DB init helper.

Key pieces:
- `engine`: SQLAlchemy database engine
- `SessionLocal`: per-request DB session factory
- `Base`: declarative base for ORM models
- `get_db()`: dependency generator for FastAPI endpoints
- `init_db()`: imports models and runs `Base.metadata.create_all(...)`

Syntax and pattern:
- `yield` in `get_db` creates a request-scoped session and ensures cleanup.

Interview angle:
- Explain dependency injection pattern in FastAPI.
- Mention migration tools (Alembic) are preferred over create_all in mature systems.

### `backend/app/main.py`
Purpose:
- FastAPI app assembly and router mounting.

Key pieces:
- Lifespan startup hook
- CORS middleware registration
- `include_router` for endpoint groups

Syntax and pattern:
- `@asynccontextmanager` for startup/shutdown lifecycle.

Interview angle:
- Good entrypoint for discussing app composition and startup responsibilities.

---

## Driver system (framework abstraction)

### Why this layer exists
Without drivers, service code would be full of framework-specific branching.
With drivers, framework-specific operations are isolated and replaceable.

### `backend/app/drivers/base.py`
Purpose:
- Defines abstract contract all drivers must implement.

Important methods:
- `load(model_path)`
- `predict(model, input_data, input_schema)`
- `unload(model)`
- `validate_model_file(path)`
- `supported_extensions()`

Syntax and pattern:
- `ABC` + `@abstractmethod` enforces interface compliance.

Interview angle:
- Strategy pattern for runtime polymorphism.

### `backend/app/drivers/registry.py`
Purpose:
- Runtime mapping from framework name to driver instance.

Key functions:
- `register_driver(framework, driver)`
- `get_driver(framework)`
- `registered_frameworks()`

Syntax and pattern:
- Registry dictionary used as plugin directory.

Interview angle:
- Extensibility: adding a new framework means adding one driver and one registration.

### `backend/app/drivers/sklearn_driver.py`
Purpose:
- scikit-learn model load/predict/unload handling.

Inference pattern:
- Build ordered feature list from `input_schema`
- Convert to 2D array-like shape expected by sklearn
- Return first prediction or class output

Syntax highlights:
- Uses joblib/pickle compatibility path
- Keeps input ordering deterministic using schema keys

Interview angle:
- Explain why schema-based ordering avoids feature mismatch bugs.

### `backend/app/drivers/pytorch_driver.py`
Purpose:
- PyTorch model inference adapter.

Inference pattern:
- Build float tensor from ordered features
- Move tensor/model to available device
- `model.eval()` + `torch.no_grad()` for inference

Syntax highlights:
- Handles tensor-to-python conversion for JSON response compatibility

Interview angle:
- Discuss GPU/CPU handling, memory release, and device consistency.

### `backend/app/drivers/tensorflow_driver.py`
Purpose:
- TensorFlow/Keras model adapter.

Inference pattern:
- Prepare tensor/ndarray input in expected shape
- Call model for forward pass
- Convert output to serializable Python structures

Syntax highlights:
- Session/graph cleanup patterns used in unload.

Interview angle:
- Explain shape handling and model serialization constraints.

### `backend/app/drivers/onnx_driver.py`
Purpose:
- ONNX Runtime adapter.

Inference pattern:
- Create `InferenceSession`
- Resolve input node name
- Execute `session.run(...)`

Syntax highlights:
- Numpy-based input mapping for runtime compatibility

Interview angle:
- ONNX as an interoperability format for cross-framework deployment.

### `backend/app/drivers/__init__.py`
Purpose:
- Imports and auto-registers driver modules.

Pattern:
- Optional dependency registration with guarded imports.

Interview angle:
- Graceful behavior when some ML runtimes are not installed.

---

## Middleware

### `backend/app/middleware/__init__.py`
Purpose:
- Package marker.

### `backend/app/middleware/auth.py`
Purpose:
- Auth dependencies used by routers.

Key functions:
- `get_current_user`: validates JWT bearer token and returns user
- `verify_api_key`: validates `X-API-Key` header for predict route

Syntax and pattern:
- FastAPI dependencies (`Depends`, `Security`) provide declarative route protection.

Interview angle:
- Separation between control-plane auth (JWT) and data-plane auth (API keys).

---

## ORM Models (database layer)

### `backend/app/models/__init__.py`
Purpose:
- Imports model classes so metadata is registered before table creation.

### `backend/app/models/user.py`
Purpose:
- User table for admin/operator access.

Typical columns:
- id (UUID/string), username, password_hash, created_at

Interview angle:
- Why storing password hashes only is mandatory.

### `backend/app/models/api_key.py`
Purpose:
- API key records for client authentication.

Typical columns:
- id, name, key_hash, key_prefix, is_active, created_at, user_id

Interview angle:
- Hash storage plus visible prefix pattern supports secure ops and auditability.

### `backend/app/models/ml_model.py`
Purpose:
- Registry table for uploaded ML models.

Typical columns:
- id, name, framework, version, file_path, metadata, input_schema, output_schema, is_active

Interview angle:
- Explain this as the source of truth for serving configuration.

### `backend/app/models/prediction_log.py`
Purpose:
- Stores observability records per prediction request.

Typical columns:
- id, model_id, api_key_id, latency_ms, status_code, created_at, error_message

Interview angle:
- Enables analytics, debugging, and SLA tracking.

---

## Schemas (API contracts)

### `backend/app/schemas/__init__.py`
Purpose:
- Package marker.

### `backend/app/schemas/auth.py`
Purpose:
- Auth request/response models.

Contains:
- Setup request model
- Login request model
- Token response model
- User response model
- Setup status response model

Syntax highlights:
- Pydantic field constraints
- `from_attributes`-style ORM compatibility for response models

### `backend/app/schemas/api_key.py`
Purpose:
- API key create/list response contracts.

Contains:
- Input schema for key creation
- Output schemas for key metadata and one-time plaintext key return

Interview angle:
- Plaintext key is shown only once after generation.

### `backend/app/schemas/ml_model.py`
Purpose:
- Model listing/detail and status update contracts.

Contains:
- Model response payloads
- Bulk list envelope
- Active/inactive toggle schema

### `backend/app/schemas/prediction.py`
Purpose:
- Prediction request and response contracts.

Contains:
- Generic input data wrapper
- Prediction result with latency and model name

### `backend/app/schemas/log.py`
Purpose:
- Log entry and paginated log list responses.

### `backend/app/schemas/dashboard.py`
Purpose:
- Aggregated stats response contract for dashboard UI.

Interview angle for schemas in general:
- They are the boundary contract of your API and central to validation + auto docs.

---

## Services (business logic)

### `backend/app/services/__init__.py`
Purpose:
- Package marker.

### `backend/app/services/auth_service.py`
Purpose:
- Core authentication primitives and user auth workflow.

Key functions:
- Password hashing and verification
- JWT creation and decode
- Setup completion check
- Admin creation
- User authentication

Syntax highlights:
- Passlib `CryptContext` for hash policy
- JOSE JWT for token operations

Interview angle:
- Can discuss expiry claims, issuer/audience, and secret rotation.

### `backend/app/services/key_service.py`
Purpose:
- API key generation, hashing, validation, revocation, listing.

Key functions:
- `generate_api_key()`
- `hash_key()`
- `create_api_key(...)`
- `validate_api_key(...)`
- `revoke_api_key(...)`

Syntax highlights:
- `secrets.token_urlsafe(...)` for high entropy random tokens
- SHA-256 hash lookup model

Interview angle:
- Hash-only storage and key prefix are practical secure design patterns.

### `backend/app/services/model_service.py`
Purpose:
- Upload and lifecycle operations for model registry entries.

Key responsibilities:
- Parse and validate metadata
- Save artifact files
- Validate file format support via driver
- Confirm model can actually load
- Persist DB row
- Handle cleanup on partial failures

Interview angle:
- This is where transactional thinking matters (filesystem + DB consistency).

### `backend/app/services/model_manager.py`
Purpose:
- Runtime serving engine and in-memory model cache.

Primary methods:
- `load_model(model_record)`
- `unload_model(model_record)`
- `predict(model_name, payload, db)`
- `_validate_input(payload, schema)`
- health/memory introspection helpers

What it does during prediction:
- Finds model in DB
- Checks active status
- Validates input schema
- Loads model from cache or disk
- Delegates to selected driver
- Maps output schema
- Logs prediction outcome with latency

Interview angle:
- Explain this as the core orchestration layer of the serving pipeline.

### `backend/app/services/prediction_service.py`
Purpose:
- Thin compatibility wrapper around `model_manager`.

Interview angle:
- Can discuss when wrappers are useful during refactors.

---

## Routers (HTTP layer)

### `backend/app/routers/__init__.py`
Purpose:
- Package marker.

### `backend/app/routers/health.py`
Purpose:
- Liveness/readiness endpoint for uptime checks.

### `backend/app/routers/auth.py`
Purpose:
- Setup/login/current-user endpoints.

Likely routes:
- `GET /auth/setup-check`
- `POST /auth/setup`
- `POST /auth/login`
- `GET /auth/me`

Security model:
- Setup allowed only once (before first admin exists)
- JWT returned for authenticated control panel sessions

### `backend/app/routers/api_keys.py`
Purpose:
- API key management endpoints for authenticated users.

Likely routes:
- `POST /api-keys`
- `GET /api-keys`
- `DELETE /api-keys/{id}`

### `backend/app/routers/models.py`
Purpose:
- Model upload/list/detail/delete/toggle endpoints.

Likely routes:
- `POST /models/upload`
- `GET /models`
- `GET /models/{id or name}`
- `DELETE /models/{id}`
- `PATCH /models/{id}/status`

### `backend/app/routers/predict.py`
Purpose:
- Public prediction endpoint protected by API key.

Likely route:
- `POST /predict/{model_name}`

Design note:
- Uses API key auth instead of JWT to simplify machine-to-machine calling.

### `backend/app/routers/dashboard.py`
Purpose:
- Aggregated usage and model metrics for UI dashboard.

### `backend/app/routers/logs.py`
Purpose:
- Prediction log retrieval endpoint with filtering/pagination.

Interview angle for router layer:
- Very thin controllers: validate IO, delegate to services, return schema-shaped responses.

---

## Utility module

### `backend/app/utils/__init__.py`
Purpose:
- Package marker.

### `backend/app/utils/metadata_parser.py`
Purpose:
- Parse and strictly validate uploaded model metadata.

What is validated:
- Required top-level keys
- Name/version formatting
- Framework compatibility
- Input/output schema presence

Syntax and pattern:
- Contract-first validation to fail fast before expensive model operations.

Interview angle:
- Metadata as a strict serving contract reduces runtime ambiguity.

---

## Storage example artifacts

### `backend/storage/iris-flower-classifier-joblib/metadata.json`
Purpose:
- Example sklearn model contract and feature schema.

### `backend/storage/iris-flower-classifier-joblib/model.pkl`
Purpose:
- Serialized sklearn model artifact.

### `backend/storage/wine-classifier/metadata.json`
Purpose:
- Example PyTorch model contract with feature mapping.

### `backend/storage/wine-classifier/model.pt`
Purpose:
- Serialized torch model artifact.

Interview angle:
- Great examples to show how metadata drives generic serving regardless of framework.

---

## 5) Syntax Deep Dive (How to Explain in Interview)

## FastAPI dependency injection
Pattern used:
- Provide shared resources/auth checks as dependency functions
- Attach using `Depends(...)` or `Security(...)`
- FastAPI resolves them per request and injects return values

How to explain:
- Keeps endpoint handlers concise and testable.

## Pydantic schema-driven validation
Pattern used:
- Request body is parsed into typed models
- Automatic 422 errors for invalid payload shape
- Response models guarantee output consistency

How to explain:
- This is both runtime validation and API contract documentation.

## SQLAlchemy ORM mapping
Pattern used:
- Declarative model classes map Python attributes to table columns
- Session-based unit-of-work commits DB changes

How to explain:
- Enables domain modeling in Python while preserving SQL-level control.

## Strategy pattern via drivers
Pattern used:
- Base abstract interface + multiple concrete implementations
- Runtime chooses implementation based on model framework

How to explain:
- Open/closed principle: add new framework with minimal changes.

## Lifespan hook
Pattern used:
- Startup sequence initializes system resources before serving traffic.

How to explain:
- Ensures DB/table availability and storage setup at app boot.

## Caching in model manager
Pattern used:
- Lazy load on first request
- Keep loaded model object in memory for subsequent requests

How to explain:
- Trades memory for lower inference latency.

---

## 6) Security Design Summary

Current strengths:
- Password hashes, not plaintext storage
- JWT for authenticated UI/control routes
- API key hashing with one-time display
- Route-level dependency guards

Interview improvements to propose:
- Enforce non-empty strong secret key in startup checks
- Add token refresh strategy and key rotation policy
- Add rate limiting for login and predict endpoints
- Add audit logs for auth failures and key use anomalies
- Add per-key scopes and expiry

---

## 7) Performance and Scalability Talking Points

Current design strengths:
- In-memory loaded model cache
- Lightweight framework dispatch through registry
- Latency logging for observability

Potential scaling upgrades:
- LRU/TTL cache eviction for loaded models
- Warm-up endpoint for preload strategies
- Async task queue for heavy model operations
- Horizontal scaling with shared DB and object storage
- Metrics export (Prometheus/OpenTelemetry)

---

## 8) Known Risks and Edge Cases You Can Mention Proactively

1. Schema migration strategy:
- `create_all` is fine for early stage; Alembic migrations should be added for production evolution.

2. Validation edge cases:
- Numeric type checks need explicit bool handling.
- Unknown extra fields could optionally be rejected for stricter contracts.

3. Caching growth:
- No strict eviction policy can increase memory usage with many models.

4. Abuse prevention:
- No request throttling can expose predict endpoint to brute-force or traffic spikes.

5. Config hardening:
- Startup should fail if required secrets/config are missing.

These are excellent interview points because they show product engineering maturity.

---

## 9) Endpoint-to-Service Mapping (Quick Revision Sheet)

- Auth routes -> `auth_service`
- API key routes -> `key_service`
- Model management routes -> `model_service`
- Predict route -> `model_manager`
- Dashboard route -> aggregate queries over models/logs
- Logs route -> prediction log query layer

Use this mapping if interviewer asks: "Where does this logic belong?"

---

## 10) 30 Interview Questions with Strong Answer Direction

1. Why FastAPI for this project?
- Strong typing, auto docs, fast development, clear dependency injection.

2. Why separate router/service/model layers?
- Maintainability, testability, single responsibility.

3. How do you support multiple ML frameworks?
- Driver interface + registry strategy.

4. How do you validate model input?
- Metadata-driven schema validation before inference.

5. How do you avoid loading model each request?
- In-memory cache in model manager.

6. Why keep API keys hashed?
- Prevent credential exposure even if DB leaks.

7. Why JWT and API keys both?
- Human admin flows vs machine prediction flows.

8. How do you measure model performance?
- Prediction latency logging per request.

9. How do you monitor failures?
- Prediction logs with status code and error tracking.

10. What if a model file is corrupt?
- Upload pipeline validates loadability and cleans partial state.

11. How do you enforce contract consistency?
- Metadata parser with strict required fields and compatibility checks.

12. How would you add XGBoost support?
- Add new driver implementing base interface and register it.

13. Why not store model binary in DB?
- Filesystem/object storage is more suitable for large binaries.

14. How would you handle model versioning?
- Keep version in metadata/DB and route by name+version strategy.

15. How do you secure secrets in production?
- Vault/KMS, env injection, rotation, startup validation.

16. How do you scale prediction traffic?
- Horizontal pods, cache strategy, batching where possible.

17. How would you implement rate limiting?
- Middleware or API gateway keyed by API key and IP.

18. Why use Pydantic schemas?
- Contract validation + serialization + docs.

19. How do you test this architecture?
- Unit tests for services/drivers, integration tests for routers.

20. Where can race conditions happen?
- First-admin setup and concurrent model upload edge cases.

21. What is the role of dashboard endpoint?
- Operational insights from logs/model stats.

22. What observability would you add?
- Structured logs, tracing, metrics dashboards.

23. How do you prevent invalid model metadata?
- Strict parser and framework/extension checks.

24. What are trade-offs of in-process model cache?
- Faster latency, but memory pressure and per-instance cache duplication.

25. Why dependency injection for DB session?
- Request-scoped lifecycle and easier testing.

26. How would you migrate DB safely?
- Alembic versioned migrations with CI checks.

27. How do you keep frontend and backend capability in sync?
- Expose supported frameworks/extensions from backend registry API.

28. How do you handle backward-compatible API changes?
- Versioning, additive schema changes, deprecation policy.

29. How would you support async model loading?
- Queue + background workers + load status updates.

30. If latency spikes, what do you inspect first?
- Cache hit ratio, model load frequency, DB latency, runtime device utilization.

---

## 11) If Interviewer Asks "What Will You Do If..."

## If they ask: "Add a new framework support"
Answer structure:
1. Implement new driver in `app/drivers`
2. Implement base contract methods
3. Register in driver registry
4. Extend metadata validation allow-list
5. Add upload and predict tests

## If they ask: "Make it production ready"
Answer structure:
1. Add Alembic migrations
2. Add strict startup config validation
3. Add rate limiting and quotas
4. Add observability stack
5. Add CI tests and security checks

## If they ask: "Improve reliability"
Answer structure:
1. Improve transactional behavior around file+DB writes
2. Add retries/circuit breakers for heavy operations
3. Add health/readiness with dependency checks
4. Add graceful shutdown and model unload behavior

---

## 12) Suggested Personal Revision Strategy

1. Memorize layer responsibilities (router, service, driver, model, schema).
2. Practice explaining the prediction flow in 60 seconds.
3. Practice explaining one security flow (JWT) and one machine auth flow (API key).
4. Pick 3 improvement points and defend trade-offs.
5. Be ready to explain one concrete bug risk and fix approach.

---

## 13) One-Minute Pitch You Can Say in Interview

"I built a FastAPI-based multi-framework model serving backend where uploaded models are governed by metadata contracts. I separated concerns across routers, services, ORM models, and framework drivers. Control plane APIs use JWT auth while prediction APIs use hashed API keys. Inference is orchestrated by a model manager that validates payloads, caches loaded artifacts, dispatches to framework-specific drivers, and logs latency and status for observability. The design is extensible because new frameworks only require a new driver implementation and registration. For production hardening, I would add DB migrations, rate limiting, stricter config checks, and richer telemetry." 

---

## 14) Final Practical Takeaway

If interviewer asks any deep backend question, answer in this order:
1. Which layer owns it
2. Which file implements it
3. What validation/security is applied
4. What trade-off exists
5. How you would improve it for production

This structure makes your answers sound senior, structured, and implementation-aware.
