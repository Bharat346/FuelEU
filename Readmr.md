# FuelEU Maritime Compliance Platform

![FuelEU Maritime](https://img.shields.io/badge/FuelEU-Maritime%20Compliance-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![React](https://img.shields.io/badge/React-18.2-green)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue)
![License](https://img.shields.io/badge/License-MIT-green)

A comprehensive, AI-powered compliance platform for FuelEU Maritime Regulation (EU) 2023/1805. This enterprise-grade solution helps maritime operators monitor, calculate, and manage GHG compliance obligations with advanced analytics and real-time insights.

## 🌟 Key Features

### 📊 Core Compliance Management
- **Real-time GHG Monitoring** - Track vessel emissions and intensity metrics
- **Automated Compliance Balance** - Calculate CB using exact EU regulation formulas
- **Banking Operations** - Manage surplus banking per Article 20 requirements
- **Compliance Pooling** - Create and manage pools following Article 21 rules
- **Comparative Analytics** - Baseline vs comparison route performance analysis

### 🚀 Advanced Capabilities
- **3D Visualization Dashboard** - Immersive data experience with glass morphism effects
- **AI-Powered Insights** - Predictive analytics and compliance forecasting
- **Real-time Analytics** - Live compliance metrics and performance indicators
- **Responsive Design** - Mobile-optimized interface with advanced CSS effects
- **Dark/Light Theme** - System-aware theme switching with smooth transitions
- **Particle Backgrounds** - Dynamic animated backgrounds with connection visualizations


### Technology Stack

#### Backend Services
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js with hexagonal architecture
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Validation**: Zod schema validation
- **Testing**: Vitest with supertest for integration tests
- **API Documentation**: OpenAPI/Swagger

#### Frontend Application
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **UI Library**: shadcn/ui with Tailwind CSS
- **Charts**: Recharts for advanced data visualization
- **State Management**: React Query for server state
- **Routing**: React Router v6 with lazy loading
- **Icons**: Lucide React for consistent iconography

## 📦 Installation & Setup

### Prerequisites
- Node.js 18.0 or higher
- PostgreSQL 14.0 or higher
- npm or yarn package manager

### Backend Setup

1. **Clone and navigate to backend**
```bash
cd backend


##Database Schema

### Routes Table

``` sql
routes
├── id (PK, String)
├── routeId (String, Unique)
├── vesselType (Enum: Container, BulkCarrier, Tanker, RoRo)
├── fuelType (Enum: HFO, LNG, MGO)
├── year (Int)
├── ghgIntensity (Float)          -- gCO₂e/MJ
├── fuelConsumption (Float)       -- tons
├── distance (Float)              -- km
├── totalEmissions (Float)        -- tons CO₂e
├── isBaseline (Boolean)
├── createdAt (DateTime)
└── updatedAt (DateTime)



### Compliance Table

```sql
ship_compliance
├── id (PK, String)
├── shipId (String)
├── year (Int)
├── cbGco2eq (Float)              -- Compliance Balance in gCO₂eq
└── createdAt (DateTime)

bank_entries
├── id (PK, String)
├── shipId (String)
├── year (Int)
├── amountGco2eq (Float)          -- Banked amount
└── createdAt (DateTime)

pools
├── id (PK, String)
├── year (Int)
└── createdAt (DateTime)

pool_members
├── id (PK, String)
├── poolId (FK → pools)
├── shipId (String)
├── cbBefore (Float)
└── cbAfter (Float)

# API Endpoints Documentation

## Routes Management

### GET /routes
List all routes with optional filtering capabilities.

**Query Parameters:**
- `vesselType` (optional) - Filter by vessel type: `Container`, `BulkCarrier`, `Tanker`, `RoRo`
- `fuelType` (optional) - Filter by fuel type: `HFO`, `LNG`, `MGO`
- `year` (optional) - Filter by year

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clabc123...",
      "routeId": "R001",
      "vesselType": "Container",
      "fuelType": "LNG",
      "year": 2024,
      "ghgIntensity": 88.5,
      "fuelConsumption": 5000,
      "distance": 12000,
      "totalEmissions": 4200,
      "isBaseline": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}


# CI/CD Pipeline Configuration

## GitHub Actions Workflow

### `.github/workflows/ci-cd.yml`

```yaml
name: FuelEU Maritime CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  NODE_VERSION: '18.x'
  DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
  DOCKER_REGISTRY: ghcr.io
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Backend Testing & Validation
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_fueleu
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json

    - name: Install backend dependencies
      working-directory: ./backend
      run: npm ci

    - name: Generate Prisma client
      working-directory: ./backend
      run: npx prisma generate
      env:
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test_fueleu"

    - name: Run database migrations
      working-directory: ./backend
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test_fueleu"

    - name: Run backend tests
      working-directory: ./backend
      run: |
        npm run test
        npm run test:coverage
      env:
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test_fueleu"
        NODE_ENV: test

    - name: Upload backend coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage/lcov.info
        flags: backend
        name: backend-coverage

  # Frontend Testing & Build
  frontend-test:
    name: Frontend Tests
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install frontend dependencies
      working-directory: ./frontend
      run: npm ci

    - name: Run frontend tests
      working-directory: ./frontend
      run: |
        npm run test
        npm run test:coverage
      env:
        VITE_API_URL: http://localhost:3001

    - name: Build frontend
      working-directory: ./frontend
      run: npm run build
      env:
        VITE_API_URL: https://api.fueleu-maritime.com

    - name: Upload frontend coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./frontend/coverage/lcov.info
        flags: frontend
        name: frontend-coverage

  # Security Scanning
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  # Docker Build & Push
  docker-build:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test, security-scan]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata for Docker
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}

    - name: Build and push Backend Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        file: ./backend/Dockerfile
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:latest
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:${{ github.sha }}
        labels: ${{ steps.meta.outputs.labels }}

    - name: Build and push Frontend Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        file: ./frontend/Dockerfile
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:latest
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }}
        labels: ${{ steps.meta.outputs.labels }}

  # Deployment to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [docker-build]
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    
    environment: staging
    steps:
    - name: Deploy to Staging Environment
      uses: appleboy/ssh-action@v0.1.7
      with:
        host: ${{ secrets.STAGING_HOST }}
        username: ${{ secrets.STAGING_USERNAME }}
        key: ${{ secrets.STAGING_SSH_KEY }}
        script: |
          cd /opt/fueleu-maritime
          docker-compose pull
          docker-compose up -d
          docker system prune -f

    - name: Run Staging Health Check
      run: |
        curl -f https://staging.fueleu-maritime.com/health || exit 1

  # Deployment to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [docker-build]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    environment: production
    steps:
    - name: Deploy to Production
      uses: appleboy/ssh-action@v0.1.7
      with:
        host: ${{ secrets.PRODUCTION_HOST }}
        username: ${{ secrets.PRODUCTION_USERNAME }}
        key: ${{ secrets.PRODUCTION_SSH_KEY }}
        script: |
          cd /opt/fueleu-maritime
          docker-compose pull
          docker-compose up -d
          docker system prune -f

    - name: Run Production Health Check
      run: |
        curl -f https://fueleu-maritime.com/health || exit 1

    - name: Notify Slack on Success
      uses: 8398a7/action-slack@v3
      with:
        status: success
        channel: '#deployments'
        text: 'FuelEU Maritime Platform successfully deployed to production!'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # Performance Testing
  performance-test:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    
    steps:
    - name: Run Lighthouse CI
      uses: treosh/lighthouse-ci-action@v10
      with:
        uploadArtifacts: true
        temporaryPublicStorage: true
        configPath: './frontend/lighthouserc.json'

    - name: Run Artillery Load Test
      run: |
        npm install -g artillery
        artillery run load-test.yml