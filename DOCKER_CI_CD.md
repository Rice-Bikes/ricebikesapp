# Rice Bikes Frontend - Docker CI/CD Setup

This repository contains the GitHub Actions workflow for automated Docker image building and deployment of the Rice Bikes frontend application.

## Overview

The frontend application is built with:

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **Data Fetching**: TanStack Query (React Query)

## Docker Image Build Process

### Automated Builds

The Docker image is automatically built and pushed to GitHub Container Registry (GHCR) when:

- **Push to `main` branch**: Creates `latest` tag and branch-specific tag
- **Push to `develop` branch**: Creates branch-specific tag
- **Pull Requests**: Builds image for testing (doesn't push)
- **Tags**: Creates versioned releases (e.g., `v1.0.0`, `1.0`, `1`)

### Workflow Steps

1. **Code Quality Checks**

   - Install dependencies
   - Run tests (`npm test`)
   - Run linting (`npm run lint`)
   - Build application (`npm run build`)

2. **Docker Build**

   - Multi-platform build (AMD64, ARM64)
   - Efficient layer caching
   - Metadata extraction for proper tagging

3. **Security Scanning**
   - Vulnerability scanning with Trivy
   - Results uploaded to GitHub Security tab

### Image Registry

Images are published to: `ghcr.io/rice-bikes/ricebikesapp`

Available tags:

- `latest` (latest main branch)
- `main` (main branch)
- `develop` (develop branch)
- `v1.0.0` (version tags)
- `pr-123` (pull request builds)

## Local Development

### Prerequisites

- Node.js 23.x
- npm
- Docker

### Building Locally

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build application
npm run build

# Build Docker image
docker build -t ricebikes-frontend .

# Run container
docker run -p 5173:5173 ricebikes-frontend
```

### Development with Docker Compose

```bash
# Start all services (from root directory)
docker-compose up --build

# Frontend will be available at http://localhost:5173
```

## Environment Variables

The frontend requires the following environment variables:

- `VITE_API_URL`: Backend API URL (default: `http://localhost:7130`)

## Dockerfile Structure

```dockerfile
FROM node:23.11.0-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "/app/dist", "-l", "5173"]
EXPOSE 5173
```

## Deployment

### Manual Deployment

```bash
# Pull latest image
docker pull ghcr.io/rice-bikes/ricebikesapp:latest

# Run container
docker run -d \
  --name ricebikes-frontend \
  -p 5173:5173 \
  -e VITE_API_URL=http://your-backend-url:7130 \
  ghcr.io/rice-bikes/ricebikesapp:latest
```

### Production Deployment

The workflow includes a deployment step that can be customized for your infrastructure:

```yaml
deploy:
  needs: [build]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'

  steps:
    - name: Deploy to production
      run: |
        # Add your deployment logic here
        # Examples:
        # - SSH to server and update containers
        # - Use kubectl for Kubernetes deployment
        # - Trigger deployment via webhook
```

## Secrets Configuration

Configure these secrets in your GitHub repository settings:

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions (no setup needed)

Optional secrets for enhanced functionality:

- `DEPLOY_SSH_KEY`: SSH key for server deployment
- `DEPLOY_HOST`: Production server hostname
- `SLACK_WEBHOOK`: Notifications webhook

## Monitoring and Logging

- **Build Status**: Check GitHub Actions tab
- **Security Vulnerabilities**: GitHub Security tab
- **Container Logs**:
  ```bash
  docker logs ricebikes-frontend
  ```

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check Node.js version compatibility
   - Verify all dependencies are correctly installed
   - Review test failures in Actions logs

2. **Runtime Issues**

   - Verify environment variables are set correctly
   - Check backend connectivity
   - Review container logs

3. **Docker Issues**
   - Ensure sufficient disk space for builds
   - Check Docker daemon is running
   - Verify network connectivity for image pulls

### Debug Commands

```bash
# Check container status
docker ps

# View logs
docker logs ricebikes-frontend

# Execute into container
docker exec -it ricebikes-frontend sh

# Check environment variables
docker exec ricebikes-frontend env
```

## Contributing

1. Create feature branch from `develop`
2. Make changes and test locally
3. Submit pull request
4. Automated tests and builds will run
5. Merge to `develop` for staging deployment
6. Merge to `main` for production deployment

## Links

- [Frontend Repository](https://github.com/Rice-Bikes/ricebikesapp)
- [Backend Repository](https://github.com/Rice-Bikes/ricebikesbackend)
- [Docker Images](https://github.com/orgs/Rice-Bikes/packages)
- [GitHub Actions](https://github.com/Rice-Bikes/ricebikesapp/actions)
