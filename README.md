# 🏪 BM Admin App

A modern, responsive admin dashboard for BM E-commerce platform built with React, TypeScript, and Vite.

## 🚀 Features

- **🔐 Role-Based Access Control**: Super Admin, Admin, and Customer roles
- **👥 User Management**: Create and manage admin users with single store assignment
- **📦 Order Management**: Complete order lifecycle management with image support
- **🏪 Store Management**: Multi-store support with image galleries
- **📊 Dashboard Analytics**: Real-time statistics and insights
- **📱 Responsive Design**: Mobile-friendly interface
- **🔒 Secure Authentication**: JWT-based authentication with rate limiting
- **🖼️ Image Upload**: Support for store images and order images (max 2 per order)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Tailwind CSS + Lucide Icons
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Yup validation
- **Backend**: Railway-hosted Node.js API
- **Deployment**: Ready for Netlify, Vercel, Docker, or manual deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd bm-admin-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
```bash
# Copy environment file
cp env.production .env

# Update API URL if needed
VITE_API_BASE_URL=https://bm-ecommerce-api-production.up.railway.app
```

## 🚀 Production Deployment

### Quick Deployment
```bash
# Run the deployment script
./deploy-production.sh
```

### Manual Deployment Options

#### 1. Netlify (Recommended)
```bash
npm run build:production
netlify deploy --prod --dir=dist
```

#### 2. Vercel
```bash
npm run build:production
vercel --prod
```

#### 3. Docker
```bash
docker build -t bm-admin-app:production .
docker run -d -p 80:80 bm-admin-app:production
```

## 📚 Documentation

- [Production Deployment Guide](PRODUCTION_DEPLOYMENT.md)
- [Role-Based Access Control](ROLE_BASED_ACCESS_CONTROL.md)
- [Dashboard Strategy](DASHBOARD_STRATEGY.md)
- [Development Guide](DEVELOPMENT.md)

## 🔧 Configuration

### Environment Variables
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_ENABLE_DEBUG`: Enable debug logging
- `VITE_LOG_API_CALLS`: Log API calls
- `VITE_ENABLE_ERROR_BOUNDARY`: Enable error boundary

### Backend Integration
- **API URL**: https://bm-ecommerce-api-production.up.railway.app
- **Health Check**: `/health`
- **Authentication**: `/auth/admin-login`
- **API Documentation**: Check backend repository

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npm run type-check

# Build for production
npm run build:production
```

## 📊 Performance

- **Bundle Size**: ~440KB (gzipped: ~135KB)
- **Load Time**: <3 seconds
- **Code Splitting**: Implemented
- **Tree Shaking**: Enabled
- **Gzip Compression**: Configured

## 🔒 Security

- **HTTPS Only**: All API calls use HTTPS
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Client and server-side validation
- **XSS Protection**: React sanitizes output
- **CORS**: Properly configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is proprietary software for BM E-commerce platform.

---

**Ready for Production! 🚀**

Your BM Admin App is configured and ready for deployment with the Railway backend.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
