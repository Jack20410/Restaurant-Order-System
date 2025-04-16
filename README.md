# Restaurant Order System

A microservices-based restaurant order system with three main services: User Service, Order Service, and Kitchen Service.

## Project Structure

```
restaurant-order-system/
├── services/
│   ├── user-service/      # User management and authentication
│   ├── order-service/     # Order processing and management
│   └── kitchen-service/   # Kitchen order management
├── api-gateway/           # API Gateway for service routing
├── frontend/             # Frontend application
├── docker-compose.yml    # Docker composition file
└── README.md            # This file
```

## Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Git

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Jack20410/Restaurant-Order-System.git
cd restaurant-order-system
```

2. Start all services:
```bash
docker-compose up --build
```

Or start individual services for development:

```bash
# For user service developer 
cd user-service
uvicorn main:app --reload --port 8001
# or
docker-compose up user-service user-db

# For order service developer
cd order-service
uvicorn main:app --reload --port 8002
# or
docker-compose up order-service order-db

# For kitchen service developer
cd kitchen-service
uvicorn main:app --reload --port 8003
# or
docker-compose up kitchen-service mongodb
```

## Service Ports

- User Service: http://localhost:8001
- Order Service: http://localhost:8002
- Kitchen Service: http://localhost:8003

## Development Guidelines

### For Each Team Member

1. **User Service Developer**
   - Responsible for user management and authentication
   - Works with MySQL database
   - Port: 8001
   - Key features:
     - User registration and login
     - JWT authentication
     - User profile management

2. **Order Service Developer**
   - Responsible for order processing
   - Works with MySQL database
   - Port: 8002
   - Key features:
     - Order creation and management
     - Order status tracking
     - Integration with user service

3. **Kitchen Service Developer**
   - Responsible for kitchen order management
   - Works with MongoDB
   - Port: 8003
   - Key features:
     - Kitchen order queue
     - Order preparation status
     - Real-time updates

### Development Workflow

1. **Branch Management**
   - Create feature branches from main
   - Branch naming: `feature/service-name/feature-description`
   - Example: `feature/user-service/auth-implementation`

2. **Code Changes**
   - Work only in your service directory
   - Follow FastAPI best practices
   - Write tests for new features
   - Update documentation as needed

3. **Testing**
   - Run tests before committing
   - Test service integration locally
   - Ensure database migrations work

4. **Deployment**
   - Each service can be deployed independently
   - Use environment variables for configuration
   - Follow the deployment checklist

### Communication Between Services

Services communicate using HTTP requests:

```python
# Example: Order Service calling User Service
response = requests.get("http://user-service:8000/users/{user_id}")
```

### Database Access

1. **User Service (MySQL)**
   - Database: user_db
   - Port: 3306
   - Credentials in docker-compose.yml

2. **Order Service (MySQL)**
   - Database: order_db
   - Port: 3307
   - Credentials in docker-compose.yml

3. **Kitchen Service (MongoDB)**
   - Database: kitchen_db
   - Port: 27017
   - No authentication required for development

## Environment Variables

Create a `.env` file in your service directory:

```env
# User Service
DATABASE_URL=mysql://user:password@user-db:3306/user_db
JWT_SECRET=your-secret-key

# Order Service
DATABASE_URL=mysql://user:password@order-db:3307/order_db

# Kitchen Service
MONGODB_URL=mongodb://mongodb:27017/kitchen_db
```

## Troubleshooting

1. **Database Connection Issues**
   - Check if database container is running
   - Verify environment variables
   - Check database logs

2. **Service Communication Issues**
   - Verify service names in docker-compose.yml
   - Check network connectivity
   - Verify service ports

3. **Common Commands**
```bash
# View logs
docker-compose logs -f [service-name]

# Restart service
docker-compose restart [service-name]

# Rebuild service
docker-compose up -d --build [service-name]
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request
5. Get code review
6. Merge after approval

## Support

For questions or issues:
1. Check the documentation
2. Ask your team members
3. Create an issue in the repository