FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Add the current directory to PYTHONPATH
ENV PYTHONPATH=/app:$PYTHONPATH

# Make the startup script executable
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"] 