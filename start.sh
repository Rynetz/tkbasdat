#!/bin/bash
echo "=== RAILWAY STARTUP SCRIPT ==="
echo "Current directory: $(pwd)"
echo "PORT env is: $PORT"
echo "NODE_ENV is: $NODE_ENV"
echo "DATABASE_URL is set: $(if [ -n "$DATABASE_URL" ]; then echo "YES"; else echo "NO"; fi)"
echo "Starting Node.js server now..."
node backend/server.js
