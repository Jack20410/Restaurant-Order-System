#!/bin/bash

# Start the FastAPI application using uvicorn
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload 