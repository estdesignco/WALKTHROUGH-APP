#!/bin/bash
set -e

# Note: MongoDB is provided by Emergent (managed service)
# No need to start local MongoDB instance

# Start Backend
cd /app/backend
/root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 &

# Start Frontend
cd /app/frontend  
yarn start
