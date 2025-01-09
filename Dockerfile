# Build stage for frontend
FROM --platform=linux/amd64 node:20-slim AS frontend-builder
COPY rules/ /app/rules
WORKDIR /app/frontend
COPY frontend/package.json .
COPY frontend/tsconfig.json .
RUN npm install
COPY frontend/ .
RUN npm run build

# Final stage
FROM --platform=linux/amd64 ghcr.io/astral-sh/uv:python3.12-bookworm
WORKDIR /app/backend

# Install Python dependencies
COPY backend/pyproject.toml .
COPY backend/uv.lock .
RUN uv sync --frozen

# Copy backend code
COPY backend/ .

# Copy built frontend files
COPY --from=frontend-builder /app/frontend/dist /app/backend/static

# Expose port
EXPOSE 8000

# Start the application
CMD ["uv", "run", "python", "-m", "uvicorn", "main:app"]
