# Production Deployment Guide

## 🚀 Production CORS & API Management Strategies

The current proxy setup only works in **development**. For production, you have several options to handle API communication without CORS issues.

## 📋 Deployment Strategies

### **Strategy 1: Same Domain Deployment** ⭐ (Recommended)

Deploy both frontend and backend on the same domain using different paths:

```
https://yourdomain.com/           → Frontend (React app)
https://yourdomain.com/api/       → Backend API
https://yourdomain.com/auth/      → Authentication endpoints
```

#### **Implementation:**
```bash
# Nginx configuration example
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (React build)
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Authentication endpoints
    location /auth/ {
        proxy_pass http://localhost:3000/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### **Strategy 2: Environment-Based Configuration** ⭐

Configure different API URLs for different environments:

#### **Environment Files:**

**`.env.development`** (Current - uses proxy):
```bash
VITE_API_BASE_URL=
VITE_APP_ENV=development
```

**`.env.production`**:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_ENV=production
```

**`.env.staging`**:
```bash
VITE_API_BASE_URL=https://staging-api.yourdomain.com
VITE_APP_ENV=staging
```

#### **Updated Constants:**
```typescript
// src/constants/index.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 
           (import.meta.env.DEV ? '' : 'https://api.yourdomain.com'),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;
```

### **Strategy 3: Backend CORS Configuration** ⭐

Configure your backend to allow specific origins:

#### **Node.js/Express Example:**
```javascript
// Backend server configuration
const cors = require('cors');

const corsOptions = {
  origin: [
    'https://yourdomain.com',
    'https://admin.yourdomain.com',
    'http://localhost:5173', // Development
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

#### **Python/FastAPI Example:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://admin.yourdomain.com",
        "http://localhost:5173",  # Development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **Strategy 4: CDN + API Gateway** ⭐ (Enterprise)

Use a CDN with API gateway for advanced routing:

```
CDN (Cloudflare/AWS CloudFront)
├── /app/*           → Frontend assets
├── /api/*           → API Gateway → Backend
└── /auth/*          → API Gateway → Auth Service
```

## 🛠️ Implementation for Your Project

### **Recommended Approach:**

1. **Use Strategy 1 + 2 Combined**
2. **Deploy on same domain with reverse proxy**
3. **Environment-based configuration for flexibility**

### **Updated Configuration Files:**

Let me create the production-ready configuration files for you.

## 📁 File Structure for Production

```
project/
├── .env.development     # Development (proxy)
├── .env.staging         # Staging environment
├── .env.production      # Production environment
├── docker-compose.yml   # Full stack deployment
├── nginx.conf           # Reverse proxy config
└── deploy/
    ├── Dockerfile.frontend
    ├── Dockerfile.backend
    └── kubernetes/
        ├── frontend-deployment.yaml
        └── backend-deployment.yaml
```

## 🚀 Deployment Commands

### **Build for Production:**
```bash
# Build with production environment
npm run build

# Build with custom environment
npm run build -- --mode staging
```

### **Docker Deployment:**
```bash
# Build and run full stack
docker-compose up -d

# Production build
docker build -f deploy/Dockerfile.frontend -t bm-admin-frontend .
```

### **Kubernetes Deployment:**
```bash
# Deploy to Kubernetes
kubectl apply -f deploy/kubernetes/
```

## 🔒 Security Considerations

### **Production Security Checklist:**

- [ ] **HTTPS Only:** Force SSL/TLS encryption
- [ ] **Secure Headers:** CSP, HSTS, X-Frame-Options
- [ ] **API Rate Limiting:** Prevent abuse
- [ ] **JWT Tokens:** Secure token handling
- [ ] **Environment Variables:** Never expose secrets
- [ ] **CORS Configuration:** Restrict origins
- [ ] **Input Validation:** Sanitize all inputs
- [ ] **Error Handling:** Don't expose stack traces

### **Environment Variables Security:**
```bash
# ❌ NEVER expose sensitive data in VITE_ variables
VITE_API_SECRET=secret123  # This will be visible in browser!

# ✅ Keep secrets on backend only
VITE_API_BASE_URL=https://api.yourdomain.com  # This is fine
```

## 📊 Monitoring & Logging

### **Production Monitoring:**
```typescript
// Enhanced logging for production
if (import.meta.env.PROD) {
  // Initialize error tracking
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    environment: import.meta.env.VITE_APP_ENV,
  });

  // Performance monitoring
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      analytics.track('performance', {
        name: entry.name,
        duration: entry.duration,
      });
    }
  }).observe({entryTypes: ['measure', 'navigation']});
}
```

## 🧪 Testing Production Build

### **Local Production Testing:**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Test with production API
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

### **Staging Environment:**
```bash
# Deploy to staging
npm run build -- --mode staging
docker build -t bm-admin-staging .
docker run -p 80:80 bm-admin-staging
```

## 📋 Deployment Checklist

### **Pre-Deployment:**
- [ ] Environment variables configured
- [ ] Backend CORS settings updated
- [ ] SSL certificates installed
- [ ] Database migrations run
- [ ] Security headers configured
- [ ] Error monitoring setup
- [ ] Performance monitoring enabled
- [ ] Load balancer configured (if needed)

### **Post-Deployment:**
- [ ] Health checks passing
- [ ] HTTPS working correctly
- [ ] API endpoints accessible
- [ ] Authentication flow working
- [ ] Error logging active
- [ ] Performance metrics collected
- [ ] Backup procedures tested

This guide provides multiple strategies to choose from based on your infrastructure and requirements.
