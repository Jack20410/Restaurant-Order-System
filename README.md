# Restaurant Order System

A microservices restaurant order management system built with FastAPI and Docker. The system consists of three core services that handle user management, order processing, and kitchen operations.

## 🚦 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jack20410/Restaurant-Order-System.git
   cd restaurant-order-system
   ```

2. **Start the System**

   Full system:
   ```bash
   docker-compose up --build -d
   ```
3. **Important**
     **Create an account in role Manager first** at register page
     Then, can create more accounts in manager dashboard (or can also create an account at register page)

## 🚀 Features

- **User Service**: Authentication, authorization, and user profile management
- **Order Service**: Order creation, processing, and tracking
- **Kitchen Service**: Order queue management and real-time status updates
- **API Gateway**: Centralized routing and request handling
- **Friendly Frontend**: Responsive web interface for customers and staff using VITE.JS

## 🏗️ Architecture

```
restaurant-order-system/
├── services/
│   ├── user-service/      # User authentication and management
│   ├── order-service/    # Order processing and management
│   └── kitchen-service/  # Kitchen operations and order fulfillment
├── api-gateway/         # API Gateway for service orchestration
├── frontend/           # Web interface
├── docker-compose.yml  # Container orchestration
└── README.md
```

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.11+)
- **Databases**: 
  - MySQL (User and Order services) -> Localhost database
  - MongoDB Atlas (Kitchen service) -> Cloud database
- **API Gateway**: FastAPI
- **Frontend**: React/Vite.js
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT

## 📋 Prerequisites

- Docker Engine 24.0.0+
- Docker Compose v2.0.0+
- Python 3.11 or higher
- Git
- Node.js 18+ (for frontend development)

## 🌐 Service Endpoints

| Service | Local URL | Port |
|---------|-----------|------|
| User Service | http://localhost:8001 | 8001 |
| Order Service | http://localhost:8002 | 8002 |
| Kitchen Service | http://localhost:8003 | 8003 |
| API Gateway | http://localhost:8000 | 8000 |
| Frontend | http://localhost:3000 | 3000 |



## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Stop all services
docker-compose down

# Clean up volumes
docker-compose down -v
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify database container status
   - Check environment variables
   - Ensure correct port mappings

2. **Service Communication Issues**
   - Verify service discovery settings
   - Check network connectivity
   - Validate API Gateway routes

3. **Container Issues**
   ```bash
   # Check container status
   docker ps -a
   
   # View container logs
   docker logs container_name
   
   # Rebuild specific service
   docker-compose up -d --build service-name
   ```
