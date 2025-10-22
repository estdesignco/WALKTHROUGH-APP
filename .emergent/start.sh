#!/bin/bash
set -e

# Start MongoDB
mkdir -p /data/db
mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db
sleep 3

# Start Backend
cd /app/backend
/root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 &

# Start Frontend
cd /app/frontend  
yarn start
