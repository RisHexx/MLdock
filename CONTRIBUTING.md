# Contributing to MLDock

Thank you for your interest in contributing to MLDock! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issues and Bug Reports](#issues-and-bug-reports)

## Code of Conduct

This project is committed to providing a welcoming and inclusive environment for all contributors. Please be respectful, collaborative, and constructive in all interactions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/MLDock.git
   cd MLDock
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/MLDock.git
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Backend Development

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up the PostgreSQL database:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/mldock"
   ```

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

The backend API will be available at `http://localhost:8000`.

### Frontend Development

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`.

### Using Docker Compose (Optional)

For a complete development environment with all services:
```bash
docker compose up --build -d
```

## Project Structure

### Backend Structure

- `app/main.py` - FastAPI application entry point
- `app/config.py` - Configuration management
- `app/database.py` - Database connection and session management
- `app/drivers/` - ML model runtime drivers (scikit-learn, PyTorch, TensorFlow, ONNX)
- `app/models/` - SQLAlchemy database models
- `app/routers/` - API endpoint definitions
- `app/schemas/` - Pydantic request/response schemas
- `app/services/` - Business logic and domain services
- `app/middleware/` - HTTP middleware (authentication, etc.)
- `app/utils/` - Utility functions and helpers
- `storage/` - Model storage directory

### Frontend Structure

- `src/main.jsx` - React entry point
- `src/App.jsx` - Main application component
- `src/pages/` - Page components
- `src/components/` - Reusable UI components
- `src/store/` - Redux store and slices
- `src/api/` - API client configuration
- `src/hooks/` - Custom React hooks
- `src/assets/` - Static assets

## Making Changes

### Adding Features

1. **Create a feature branch** from the latest `main` branch
2. **Write code** following the style guidelines (see below)
3. **Add tests** for your changes
4. **Update documentation** if needed
5. **Test thoroughly** before submitting

### Adding ML Model Drivers

If adding support for a new ML framework:

1. Create a new driver in `backend/app/drivers/`
2. Extend the `BaseDriver` class from `base.py`
3. Implement required methods: `load_model()`, `predict()`
4. Register the driver in `registry.py`
5. Add corresponding metadata validation in `utils/metadata_parser.py`
6. Update tests and documentation

### Modifying the API

- Update the corresponding router in `app/routers/`
- Create/update Pydantic schemas in `app/schemas/`
- Add business logic in `app/services/`
- Update API documentation comments

### Modifying the Frontend

- Follow React best practices and component composition
- Use Redux for state management
- Keep components focused and reusable
- Update corresponding store slices when needed

## Code Style

### Backend (Python)

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guidelines
- Use type hints for function parameters and returns
- Maximum line length: 100 characters
- Use meaningful variable and function names
- Add docstrings to functions and classes

Example:
```python
def predict_batch(self, inputs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Perform batch predictions on the model.
    
    Args:
        inputs: List of input dictionaries
        
    Returns:
        List of prediction results
    """
    results = []
    for input_data in inputs:
        result = self.predict(input_data)
        results.append(result)
    return results
```

### Frontend (JavaScript/React)

- Use functional components with hooks
- Use camelCase for variables and functions
- Use PascalCase for component names
- Add JSDoc comments for complex logic
- Keep components under 300 lines

Example:
```javascript
/**
 * ModelCard component for displaying model information
 * @param {Object} model - Model data object
 * @param {Function} onSelect - Callback when model is selected
 */
export const ModelCard = ({ model, onSelect }) => {
  return (
    <Card onClick={() => onSelect(model.id)}>
      <h3>{model.name}</h3>
    </Card>
  );
};
```

## Testing

### Backend Testing

- Write unit tests for services and utilities
- Use pytest for testing framework
- Aim for at least 70% code coverage
- Test files should be placed in a `tests/` directory

Example:
```bash
pytest tests/
pytest tests/ --cov=app
```

### Frontend Testing

- Write unit tests for components and hooks
- Use Vitest or Jest for testing
- Test user interactions and edge cases
- Test files should be co-located with source files: `Component.test.jsx`

Example:
```bash
npm run test
npm run test -- --coverage
```

## Submitting Changes

### Preparing Your Pull Request

1. **Update your branch** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub with:
   - Clear title describing the feature/fix
   - Detailed description of changes
   - Reference to related issues (e.g., `Closes #123`)
   - Screenshots if UI changes were made

### PR Guidelines

- One feature/fix per PR
- Keep PRs focused and reasonably sized
- Include relevant test coverage
- Update documentation and comments
- Ensure all CI checks pass

### PR Description Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #ISSUE_NUMBER

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2

## Testing
Describe how to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes
```

### Code Review

- Respond promptly to review feedback
- Make requested changes in separate commits
- Re-request review after making changes
- Be open to suggestions and improvements

## Issues and Bug Reports

### Reporting Bugs

Please create a GitHub issue with:

1. **Title:** Clear, descriptive title
2. **Description:** What you expected vs. what happened
3. **Steps to Reproduce:**
   - Provide clear, step-by-step instructions
4. **Environment:**
   ```
   - OS: (e.g., Windows, macOS, Linux)
   - Python version: (if relevant)
   - Node version: (if relevant)
   - Docker version: (if relevant)
   ```
5. **Logs/Error Messages:** Include relevant error output
6. **Screenshots:** For UI issues

### Requesting Features

Create a GitHub issue with:

1. **Title:** Clear feature description
2. **Use Case:** Why this feature is needed
3. **Proposed Solution:** How it should work
4. **Alternatives:** Any alternative approaches considered

## Development Workflow Example

```bash
# 1. Create feature branch
git checkout -b feature/add-model-metrics

# 2. Make changes and test locally
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# ... make changes ...
pytest tests/

# 3. Commit changes
git add .
git commit -m "feat: add model metrics tracking"

# 4. Push and create PR
git push origin feature/add-model-metrics
# Then create PR on GitHub
```

## Getting Help

- **Documentation:** Check the [README.md](README.md)
- **Issues:** Search existing issues on GitHub
- **Discussions:** Use GitHub Discussions for questions
- **Contact:** Open an issue for questions or clarifications

## License

By contributing to MLDock, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to MLDock! Your efforts help make this project better for everyone. 🎉
