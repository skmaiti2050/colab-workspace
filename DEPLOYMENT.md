# Deployment Configuration Guide

This guide explains how to configure the deployment pipeline for the Collaborative Workspace API on Render.

## Prerequisites

1.  A [Render](https://render.com) account.
2.  A [GitHub](https://github.com) account with access to this repository.

## Render Configuration

1.  **Create a New Service**:
    *   Go to your Render dashboard.
    *   Click "New +" -> "Web Service".
    *   Connect your GitHub repository.
    *   Configure the service with the following settings (matching `render.yaml`):
        *   **Name**: `collaborative-workspace-api`
        *   **Runtime**: Node
        *   **Build Command**: `npm ci && npm run build && npm run migration:run -- -d ormconfig.ts`
        *   **Start Command**: `npm start`
        *   **Environment Variables**: Ensure you set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, etc.

2.  **Retrieve Service ID**:
    *   Navigate to your service's dashboard on Render.
    *   Look at the URL in your browser address bar. It will look like: `https://dashboard.render.com/web/srv-cqs1234567890abcdef`.
    *   The Service ID is the last part: `srv-cqs1234567890abcdef`.

3.  **Create API Key**:
    *   Go to your [Account Settings](https://dashboard.render.com/settings).
    *   Scroll down to "API Keys".
    *   Click "Create API Key" and give it a name (e.g., "GitHub Actions Deploy").
    *   Copy the generated API Key.

## GitHub Secrets Configuration

1.  Go to your GitHub repository.
2.  Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
3.  Click **New repository secret**.
4.  Add the following secrets:

    *   `RENDER_API_KEY`: Paste the API Key you created in step 3.
    *   `RENDER_SERVICE_ID`: Paste the Service ID you retrieved in step 2 (e.g., `srv-xxxxxxxx`).
    *   `RENDER_APP_URL`: The full URL of your deployed app (e.g., `https://collaborative-workspace-api.onrender.com`).

## Troubleshooting Deployment Failures

### Error: `404 Not Found: Service ***`

This error means the GitHub Action cannot find the Render service specified by `RENDER_SERVICE_ID`.

*   **Cause**: The Service ID in GitHub Secrets is incorrect, belongs to a deleted service, or the API Key does not have permission to access it.
*   **Solution**:
    1.  Verify the Service ID in your Render dashboard (check the URL).
    2.  Update the `RENDER_SERVICE_ID` secret in GitHub with the correct value.
    3.  Ensure your API Key is valid and has not been revoked.

### Error: `401 Unauthorized`

This error means the API Key is invalid.

*   **Solution**: Regenerate the API Key in Render and update the `RENDER_API_KEY` secret in GitHub.
