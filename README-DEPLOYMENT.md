# 🚀 ORAH HRMS Frontend Deployment Guide

## 📋 Prerequisites

1. **Google Cloud SDK** installed and configured
2. **Docker** installed locally
3. **GCP Project** with billing enabled
4. **Required APIs** enabled:
   - Cloud Run API
   - Cloud Build API
   - Container Registry API

## 🐳 Docker Configuration

The project includes a multi-stage Dockerfile optimized for Cloud Run:

### Dockerfile Features:
- **Multi-stage build** for minimal image size
- **Nginx** for serving static files
- **Non-root user** for security
- **Port 8080** (Cloud Run requirement)
- **Gzip compression** for performance
- **Security headers** for protection

## 🌐 Deployment Options

### Option 1: Automated Deployment Script (Recommended)

```bash
# Make the script executable
chmod +x deploy.sh

# Deploy to Cloud Run (uses default project and region)
./deploy.sh

# Or specify project and region
./deploy.sh my-gcp-project us-central1
```

### Option 2: Manual Deployment

```bash
# 1. Set your project
gcloud config set project YOUR_PROJECT_ID

# 2. Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 3. Build and push image
docker build -t gcr.io/YOUR_PROJECT_ID/orah-hrms-frontend:latest .
docker push gcr.io/YOUR_PROJECT_ID/orah-hrms-frontend:latest

# 4. Deploy to Cloud Run
gcloud run deploy orah-hrms-frontend \
    --image=gcr.io/YOUR_PROJECT_ID/orah-hrms-frontend:latest \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --timeout=300s \
    --concurrency=1000 \
    --max-instances=100 \
    --set-env-vars=NODE_ENV=production
```

### Option 3: Cloud Build (CI/CD)

```bash
# Trigger Cloud Build
gcloud builds submit --config cloudbuild.yaml .
```

## ⚙️ Configuration

### Environment Variables
- `NODE_ENV=production` (automatically set)
- `VITE_API_URL` (backend API URL - update in vite.config.ts)

### Backend API Configuration
Update your `vite.config.ts` to point to your backend service:

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://your-backend-service-url.run.app',
        changeOrigin: true,
      }
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://your-backend-service-url.run.app')
  }
})
```

## 🔧 Cloud Run Service Configuration

### Default Settings:
- **Memory**: 512Mi
- **CPU**: 1 vCPU
- **Timeout**: 300s (5 minutes)
- **Concurrency**: 1000
- **Max Instances**: 100
- **Port**: 8080

### Scaling Options:
```bash
# Enable autoscaling
gcloud run services update orah-hrms-frontend \
    --region=us-central1 \
    --set-min-instances=0 \
    --set-max-instances=1000
```

## 🔒 Security Considerations

### Built-in Security:
- **Non-root user** in container
- **Security headers** via Nginx
- **HTTPS** automatically provided
- **IAM** controls for access

### Additional Security:
```bash
# Restrict access to specific users
gcloud run services add-iam-policy-binding orah-hrms-frontend \
    --region=us-central1 \
    --member=user:your-email@example.com \
    --role=roles/run.invoker
```

## 📊 Monitoring and Logging

### View Logs:
```bash
# View service logs
gcloud logs read "resource.type=cloud_run_revision" \
    --limit=50 \
    --format="table(timestamp,textPayload)"

# Stream logs in real-time
gcloud logs tail "resource.type=cloud_run_revision"
```

### Monitoring:
- Visit [Cloud Run Console](https://console.cloud.google.com/run)
- Check metrics in Cloud Monitoring
- Set up alerting for errors and latency

## 🔄 CI/CD Integration

### GitHub Actions Example:
```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Google Cloud
        uses: google-github-actions/setup-gcloud@v1
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy orah-hrms-frontend \
            --image=gcr.io/$PROJECT_ID/orah-hrms-frontend:latest \
            --region=us-central1 \
            --allow-unauthenticated
```

## 🚨 Troubleshooting

### Common Issues:

1. **Container fails to start**
   - Check logs: `gcloud logs read "resource.type=cloud_run_revision"`
   - Verify port 8080 is exposed
   - Check nginx configuration

2. **404 errors**
   - Ensure `try_files $uri $uri/ /index.html;` is in nginx.conf
   - Check if build completed successfully

3. **CORS issues**
   - Update backend CORS settings
   - Check API proxy configuration

4. **High memory usage**
   - Increase memory allocation: `--memory=1Gi`
   - Optimize build size

### Health Check:
```bash
# Test health endpoint
curl https://your-service-url.run.app/health
```

## 💰 Cost Optimization

### Tips to reduce costs:
1. **Enable minimum instances = 0** for scale-to-zero
2. **Use appropriate memory allocation** (don't over-provision)
3. **Monitor usage** and adjust resources
4. **Set up budgets** in Cloud Billing

### Estimated Costs (us-central1):
- **Free tier**: 2 million requests/month
- **Beyond free tier**: ~$0.40 per million requests
- **CPU**: ~$0.000024 per vCPU-second
- **Memory**: ~$0.0000025 per GB-second

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Container Registry Documentation](https://cloud.google.com/container-registry)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)

## 🆘 Support

If you encounter issues:
1. Check the [Cloud Run troubleshooting guide](https://cloud.google.com/run/docs/troubleshooting)
2. Review service logs
3. Verify configuration files
4. Test locally with Docker: `docker run -p 8080:8080 gcr.io/PROJECT_ID/orah-hrms-frontend:latest`
