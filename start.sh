#!/bin/bash
echo "=== RAILWAY STARTUP SCRIPT ==="
echo "PORT: $PORT"
echo "Starting Node.js server now..."
exec node backend/server.js
