# Skorbord Deployment Guide

This guide covers deploying the complete Skorbord application (API + Frontend) to various platforms.

## Prerequisites

- Node.js 18.0.0 or higher
- Git repository with your code
- Environment variables configured
- Domain name (for production)

## Environment Configuration

### Backend (.env)
```env
# Database
DATABASE_PATH=./data/skorbord.db

# Server Configuration
PORT=2424
NODE_ENV=production

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://your-domain.com
CORS_CREDENTIALS=true

# Socket.IO
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
```

### Frontend (.env)
```env
# API Configuration
VITE_API_URL=https://your-api-domain.com
```

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides simple deployment for both frontend and backend with automatic HTTPS.

#### Backend Deployment
1. Connect your GitHub repository to Railway
2. Create a new service for the backend
3. Set the root directory to `/api`
4. Configure environment variables in Railway dashboard
5. Railway will automatically deploy on git push

#### Frontend Deployment
1. Create another Railway service for the frontend
2. Set the root directory to `/app`
3. Configure build command: `npm run build`
4. Configure start command: `npm run preview`
5. Set environment variables

### Option 2: Vercel + Railway

Deploy frontend to Vercel and backend to Railway for optimal performance.

#### Backend (Railway)
```bash
# In /api directory
npm install
npm run build  # if you add a build step
npm start
```

#### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set framework preset to "Vite"
3. Set root directory to `app`
4. Configure environment variables
5. Deploy automatically on push

### Option 3: DigitalOcean App Platform

Full-stack deployment on DigitalOcean.

#### App Spec Configuration
```yaml
name: skorbord
services:
  - name: api
    source_dir: /api
    github:
      repo: your-username/skorbord-react-tailwindcss-daisyui
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "8080"
    routes:
      - path: /api
  - name: web
    source_dir: /app
    github:
      repo: your-username/skorbord-react-tailwindcss-daisyui
      branch: main
    build_command: npm run build
    run_command: npm run preview
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    routes:
      - path: /
```

### Option 4: Self-Hosted (VPS)

Deploy to your own server using PM2 for process management.

#### Server Setup
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx

# Clone repository
git clone https://github.com/your-username/skorbord-react-tailwindcss-daisyui.git
cd skorbord-react-tailwindcss-daisyui
```

#### Backend Setup
```bash
cd api
npm install --production
cp .env.example .env
# Edit .env with production values

# Start with PM2
pm2 start npm --name "skorbord-api" -- start
pm2 save
pm2 startup
```

#### Frontend Setup
```bash
cd ../app
npm install
npm run build

# Serve with nginx (see nginx config below)
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/skorbord-react-tailwindcss-daisyui/app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:2424;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:2424;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### SSL with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Database Considerations

### Development
- SQLite file database (`skorbord.db`)
- Stored locally in `/api/data/`

### Production
- Ensure database directory has proper permissions
- Consider regular backups
- For high availability, consider PostgreSQL migration

### Backup Strategy
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /path/to/skorbord.db /path/to/backups/skorbord_$DATE.db

# Keep only last 7 days
find /path/to/backups -name "skorbord_*.db" -type f -mtime +7 -delete
```

## Monitoring and Maintenance

### Health Checks
- Backend: `GET /api/health`
- Frontend: Standard HTTP checks
- Database: Monitor file size and performance

### Log Management
```bash
# PM2 logs
pm2 logs skorbord-api

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Update backend
cd api
npm install --production
pm2 restart skorbord-api

# Update frontend
cd ../app
npm install
npm run build
# Files automatically served by nginx
```

## Performance Optimization

### Frontend
- Enable gzip compression in nginx
- Set appropriate cache headers
- Use CDN for static assets
- Enable HTTP/2

### Backend
- Use PM2 cluster mode for multiple processes
- Implement database connection pooling
- Add Redis for session storage (if scaling)
- Monitor memory usage

### Database
- Regular VACUUM operations for SQLite
- Monitor database file size
- Consider read replicas for high traffic

## Security Checklist

- [ ] HTTPS enabled with valid certificates
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Environment variables secured
- [ ] Database file permissions restricted
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] Backup encryption (if containing sensitive data)

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if services are running: `pm2 status`
   - Verify ports are open: `netstat -tlnp`

2. **CORS Errors**
   - Verify CORS_ORIGIN environment variable
   - Check frontend API URL configuration

3. **Socket.IO Connection Issues**
   - Ensure WebSocket support in reverse proxy
   - Check firewall settings for WebSocket traffic

4. **Database Locked**
   - Multiple processes accessing SQLite
   - Use `PRAGMA busy_timeout` in database configuration

5. **Build Failures**
   - Node.js version mismatch
   - Missing dependencies in package.json

### Debug Commands
```bash
# Check service status
pm2 status
pm2 logs skorbord-api --lines 50

# Test API endpoints
curl -v http://localhost:2424/api/health

# Check nginx configuration
sudo nginx -t
sudo systemctl status nginx

# Monitor system resources
htop
df -h
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Implement sticky sessions for Socket.IO
- Share database between instances
- Use Redis adapter for Socket.IO

### Database Scaling
- Migrate to PostgreSQL for better concurrency
- Implement read replicas
- Consider database connection pooling
- Monitor query performance

## Pre-Deployment Testing

Before deploying to production, run the complete test suite to ensure everything is working correctly:

### Backend Testing

```bash
cd api

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Run all tests with coverage
npm run test:coverage

# Verify API server starts correctly
npm run dev
```

### Frontend Testing

```bash
cd app

# Install dependencies
npm install

# Run all tests with coverage
npm run test:coverage

# Build for production and verify
npm run build
npm run preview
```

### Integration Testing

```bash
# From project root
# Run both backend and frontend tests
npm run test  # Uses VS Code task or manual commands

# Verify full development environment
npm run dev   # Should start both servers
```

### API Documentation

Verify the API documentation is accessible:

- Development: <http://localhost:2424/api/docs>
- Ensure all endpoints are documented and testable

## Production Deployment Checklist

- [ ] All tests passing (backend and frontend)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate configured
- [ ] Firewall rules configured
- [ ] API documentation accessible
- [ ] Real-time features working (Socket.IO)
- [ ] Performance testing completed
- [ ] Backup strategy implemented
- [ ] Monitoring and logging configured

---
This deployment guide provides multiple options from simple cloud deployment to self-hosted solutions with proper security and monitoring considerations.
