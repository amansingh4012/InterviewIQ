# Multi-stage Dockerfile for InterviewIQ
# Runs both Next.js frontend and FastAPI backend in one container

# ===== Stage 1: Build Frontend =====
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ ./

# Build Next.js app with standalone output
RUN npm run build

# ===== Stage 2: Production Image =====
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for Next.js runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Create supervisor configuration
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port (Render will set PORT env var)
EXPOSE 10000

# Start supervisor which manages both processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
