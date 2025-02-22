FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm and uv
RUN npm install -g pnpm && \
    curl -LsSf https://astral.sh/uv/install.sh | sh && \
    echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc && \
    . ~/.bashrc

# Set working directory
WORKDIR /app

# Copy project and install dependencies
COPY . .
RUN . ~/.cargo/env && uv sync --system

# Build frontend
WORKDIR /app/ui

# Install dependencies and build
RUN pnpm install --force && \
    pnpm run build

# Return to app directory
WORKDIR /app

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]