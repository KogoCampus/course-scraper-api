FROM python:3.11-slim

WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Install frontend dependencies and build
WORKDIR /app/static
RUN npm install
RUN npm run build

# Return to app directory
WORKDIR /app

# Create script to build frontend and start server
RUN echo '#!/bin/bash\ncd /app/static && npm run build && cd /app && exec uvicorn app.main:app --host 0.0.0.0 --port 8000' > /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"] 