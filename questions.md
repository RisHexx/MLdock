# MLDock Backend Interview Questions and Answers

This document contains 25 interview questions based on the MLDock backend project, with answers written from basic to advanced level.

## 1. What is the main problem MLDock solves?
MLDock solves the problem of deploying machine learning models as secure, reusable REST APIs without writing custom serving code for every model. In many projects, ML engineers need to manually build endpoints, validation logic, authentication, logging, and framework-specific inference code each time they want to expose a model. MLDock reduces that repeated work by providing a standard backend that can store models, validate metadata, load them dynamically, and serve predictions through a common interface.

## 2. Can you explain the overall backend architecture of your project?
The backend is built using a layered architecture. FastAPI handles HTTP requests, SQLAlchemy manages database access, services contain business logic, drivers encapsulate framework-specific ML runtime behavior, schemas define structured request and response shapes, and models represent database tables. This separation keeps the project maintainable because each layer has one clear responsibility.

At a high level, the request flow looks like this: the router receives the request, dependencies handle authentication, the service layer performs validation and orchestration, the driver runs model inference, and the database records logs or metadata.

## 3. Why did you choose FastAPI for this backend?
FastAPI is a strong choice for an ML-serving backend because it is fast, modern, and designed around Python type hints. It makes request validation easier, automatically generates interactive API docs, and integrates naturally with Python ML libraries. Since MLDock needs to handle JSON input, schema validation, authentication, and prediction endpoints, FastAPI is a good fit.

Another advantage is that FastAPI works well with dependency injection, which makes database sessions, authentication, and reusable helpers easier to organize.

## 4. What role does SQLAlchemy play in your application?
SQLAlchemy is the ORM used to interact with PostgreSQL. It lets the backend work with Python classes instead of writing raw SQL for every operation. In MLDock, SQLAlchemy is used to store and retrieve models, API keys, users, and prediction logs.

It improves development speed and code readability because queries like filtering by model name or status can be expressed cleanly in Python. It also makes the code easier to maintain as the schema grows.

## 5. How does the backend connect to PostgreSQL?
The database connection is configured in the backend settings and initialized through SQLAlchemy. The application creates an engine using the database URL, then uses a session factory to produce per-request database sessions. These sessions are injected into routes or services when needed.

This pattern is important because it keeps database access controlled and ensures sessions are properly closed after use.

## 6. What is the purpose of the `MLModel` database table?
The `MLModel` table acts as the registry for all uploaded models. It stores essential metadata such as the model name, display name, framework, file path, input schema, output schema, version, and current status.

This table allows the system to look up a model by name or ID, validate whether it is active, determine which driver should load it, and know where the artifact lives on disk. In short, it is the source of truth for model management.

## 7. Why did you separate the code into routers, services, models, drivers, and schemas?
The separation follows the principle of separation of concerns. Routers only handle HTTP request and response handling. Services contain business rules and orchestration. Models represent database structures. Schemas define validation and serialization contracts. Drivers isolate framework-specific inference logic.

This structure makes the code easier to test, easier to extend, and easier to explain in an interview. For example, if you add a new ML framework, you usually only need a new driver, not a rewrite of the whole backend.

## 8. What happens when a user uploads a model to the backend?
When a model is uploaded, the backend first reads and validates the metadata file. It checks that the metadata is valid JSON and that it contains the expected fields like model name, framework, input schema, and output schema. Then it resolves the correct driver based on the framework.

After that, it validates the model file extension, checks file size, ensures the model name does not already exist, saves the artifact to the storage folder, verifies that the driver can actually load the file, writes metadata to disk, and finally creates a database record for the model.

## 9. Why does MLDock require a `metadata.json` file along with the model file?
The metadata file is required because the backend needs more than just the raw serialized model. It needs to know the model name, framework, expected input fields, and expected output structure so that it can validate requests and route the file to the correct driver.

Without metadata, the backend would not know how to validate user input or which runtime to use. The metadata file is what makes the deployment process standardized and framework-agnostic.

## 10. How does the backend validate whether an uploaded model file is valid?
The backend validates a model file in multiple steps. First, it checks that the file extension is supported by the selected framework. Then it checks the file size to enforce limits. After the file is saved to disk, the system calls the driver’s validation method to see whether the file can actually be loaded by that runtime.

This is a good defensive design because a file can look correct by extension but still be corrupted, incompatible, or otherwise invalid.

## 11. How do you support multiple ML frameworks in the same backend?
The backend uses a driver abstraction layer. Each framework has its own driver implementation, such as scikit-learn, PyTorch, TensorFlow/Keras, or ONNX. All drivers follow a shared contract defined by a base driver interface.

When the backend needs to load or predict with a model, it asks the registry for the driver corresponding to the framework name stored in metadata. This lets the system stay flexible and avoids mixing framework-specific code into the service layer.

## 12. What is the purpose of the driver pattern in your project?
The driver pattern isolates framework-specific behavior behind a common interface. Each driver knows how to load a model, run inference, unload resources, validate a file, and report supported extensions.

This pattern is useful because every framework has different expectations for input shape, serialization, and resource management. By hiding those differences behind drivers, the rest of the backend can work in a framework-neutral way.

## 13. How does the registry decide which driver to use for a model?
The registry maintains a mapping from framework names to driver instances. When a model is uploaded or used for prediction, the backend reads the framework field from metadata or the database and passes it to the registry.

If the framework is supported, the registry returns the matching driver. If not, it raises an error. This makes driver selection explicit and predictable.

## 14. What is the difference between `model_service.py` and `model_manager.py`?
`model_service.py` handles persistence and lifecycle management around stored model artifacts. It is responsible for upload, listing, retrieval, deletion, and status updates. `model_manager.py` handles runtime inference concerns such as loading models into memory, caching them, validating inputs, executing predictions, and logging prediction outcomes.

A simple way to explain it is: model_service manages the model as a stored asset, while model_manager manages the model as a live runtime object.

## 15. Why is `model_manager` implemented as a singleton instance?
`model_manager` is instantiated once so that the cache of loaded models is shared across requests within the same application process. If it were recreated for every request, the cache would be useless and every prediction might trigger a reload.

Using one shared instance improves latency because loaded models can be reused. It also simplifies memory management since unload operations can target the same cache.

## 16. How does model caching improve prediction performance?
Caching avoids repeatedly loading models from disk on every request. Model loading can be slow because it may involve deserialization, runtime initialization, and framework setup. Once a model is cached in memory, subsequent requests can use the already loaded object immediately.

This reduces response latency and improves throughput, especially for models that are requested frequently.

## 17. What happens if a model is already loaded in memory and another prediction request comes in?
If the model is already cached, the manager returns the cached instance instead of loading it again. This means the request skips the expensive disk loading step and goes directly to inference.

That behavior is important for both performance and resource efficiency. It also helps keep the serving experience stable under repeated traffic.

## 18. How does input validation work before prediction?
Before prediction, the backend compares the incoming JSON payload with the model’s declared input schema. It checks that required fields are present and that each field has the expected type, such as integer, float, string, or boolean.

If validation fails, the request is rejected before inference happens. This prevents bad data from reaching the model and makes the API more reliable and easier to debug.

## 19. Why do you check the input schema before calling the model inference logic?
Schema validation protects the model from unexpected or malformed input. ML models are often sensitive to field names, ordering, type mismatches, and missing values. If the backend sends incorrect data into the driver, the model may fail or produce unreliable output.

Checking the schema early gives users clearer error messages and avoids unnecessary computation.

## 20. How does the backend handle prediction logging?
The backend creates a `PredictionLog` record for each prediction attempt. It stores information such as the model name, model ID, status code, and latency in milliseconds. Successful predictions and failed predictions are both logged.

This is useful for observability because you can later analyze how often a model is used, how long it takes to respond, and where failures happen.

## 21. What kind of data do you store in `PredictionLog`, and why is it useful?
`PredictionLog` typically stores the model reference, response status code, latency, timestamps, and possibly other request metadata depending on the implementation. This gives the system an audit trail of prediction activity.

The value of this table is that it helps with debugging, performance monitoring, and product analytics. For example, you can identify slow models or patterns of user errors.

## 22. How do you handle errors differently for validation errors, missing models, and inference failures?
The backend uses different HTTP status codes and messages depending on the failure type. If the model does not exist, it returns 404. If the model exists but is inactive, it returns 403. If validation fails, it returns 400 with validation details. If an unexpected error happens during inference, it returns 500.

This distinction is important because it helps clients understand whether the problem is with the request, the model state, or the server itself.

## 23. Why is API key authentication important for a model-serving platform?
API key authentication is important because model endpoints may expose sensitive business logic or proprietary models. It lets the platform control who can call predictions, which is useful for preventing abuse and keeping usage traceable.

For a self-hosted serving platform, API keys also make it easier to separate dashboard authentication from endpoint access, which improves security design.

## 24. How would you add support for a new framework like XGBoost or CatBoost?
To add a new framework, I would create a new driver that implements the base driver interface. That driver would handle loading, prediction, validation, unloading, and supported file extensions for that framework. Then I would register it in the driver registry using a framework name like `xgboost` or `catboost`.

After that, I would update metadata validation and upload rules so the new framework is allowed. If needed, I would also update the frontend so users can select it during model upload.

## 25. What are the scalability and security trade-offs in your current backend design?
On the scalability side, in-memory caching is fast, but it can become expensive if many large models are loaded at once. The current design is good for moderate usage, but for high scale you may need cache limits, eviction policies, process isolation, or model pooling.

On the security side, the platform already uses authentication and structured validation, but production systems would still need stronger hardening such as stricter file scanning, safer artifact handling, rate limiting, secrets management, and better audit controls. The trade-off is that the current design is simple and practical, while a production-grade deployment would need more safeguards.

## Short Interview Summary
If you want to summarize the backend in one answer, you can say:

"MLDock is a FastAPI-based model serving backend that lets users upload ML models with metadata, validates and stores them, loads them through framework-specific drivers, caches models for faster inference, and logs prediction activity for observability."
