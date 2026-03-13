#!/bin/bash

# Cloud Run Deployment Script for ORAH HRMS Frontend
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

# Default values
PROJECT_ID=${1:-$(gcloud config get-value project)}
REGION=${2:-us-central1}
SERVICE_NAME="orah-hrms-frontend"
IMAGE_NAME="orah-hrms-frontend"

echo "🚀 Deploying ORAH HRMS Frontend to Cloud Run..."
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first."
    exit 1
fi

# Set the project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build the Docker image
echo "🏗️ Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:latest .

# Push the Docker image
echo "📤 Pushing Docker image to Container Registry..."
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:latest

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image=gcr.io/$PROJECT_ID/$IMAGE_NAME:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --timeout=300s \
    --concurrency=1000 \
    --max-instances=100 \
    --set-env-vars=NODE_ENV=production \
    --set-cloud-run-keywords=frontend,react,hrms

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format='value(status.url)')

echo "✅ Deployment completed successfully!"
echo "🌐 Your application is now live at: $SERVICE_URL"
echo "📊 Monitor your service at: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"

# Optional: Open the service in browser
if command -v xdg-open &> /dev/null; then
    xdg-open $SERVICE_URL
elif command -v open &> /dev/null; then
    open $SERVICE_URL
fi

echo "🎉 Done!"
