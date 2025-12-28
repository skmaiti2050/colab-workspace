# API Documentation

This document provides detailed information about the Collaborative Workspace API endpoints.

## Base URL

- **Development:** `http://localhost:3000/api/v1`
- **Production:** `https://your-app.onrender.com/api/v1`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **Default:** 100 requests per 15 minutes per IP
- **Authentication endpoints:** 10 requests per 15 minutes per IP

## Error Handling

All API errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Endpoints

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "id": "713df652-8eeb-4a41-9ec9-4fe03942b77b",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "713df652-8eeb-4a41-9ec9-4fe03942b77b",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout

```http
POST /auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Workspaces

#### List Workspaces

```http
GET /workspaces
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "id": "2204e384-f55a-49d8-920d-8fc9c8bb124f",
    "name": "My Workspace",
    "description": "A collaborative workspace for my team",
    "ownerId": "713df652-8eeb-4a41-9ec9-4fe03942b77b",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "memberCount": 3,
    "projectCount": 5
  }
]
```

#### Create Workspace

```http
POST /workspaces
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Workspace",
  "description": "Description of the workspace"
}
```

#### Get Workspace

```http
GET /workspaces/:id
Authorization: Bearer <token>
```

#### Update Workspace

```http
PUT /workspaces/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Workspace Name",
  "description": "Updated description"
}
```

#### Delete Workspace

```http
DELETE /workspaces/:id
Authorization: Bearer <token>
```

#### Invite User to Workspace

```http
POST /workspaces/:id/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "collaborator"
}
```

**Roles:** `owner`, `collaborator`, `viewer`

#### Update Member Role

```http
PUT /workspaces/:id/members/:userId/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "collaborator"
}
```

### Projects

#### List Projects

```http
GET /projects?workspaceId=2204e384-f55a-49d8-920d-8fc9c8bb124f
Authorization: Bearer <token>
```

#### Create Project

```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "2204e384-f55a-49d8-920d-8fc9c8bb124f",
  "name": "My Project",
  "description": "Project description"
}
```

#### Get Project

```http
GET /projects/:id
Authorization: Bearer <token>
```

#### Update Project

```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

#### Delete Project

```http
DELETE /projects/:id
Authorization: Bearer <token>
```

#### Add File to Project

```http
POST /projects/:id/files
Authorization: Bearer <token>
Content-Type: application/json

{
  "path": "src/main.ts",
  "content": "console.log('Hello World');",
  "mimeType": "text/typescript"
}
```

#### Update Project File

```http
PUT /projects/:id/files/:fileId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "console.log('Updated content');",
  "mimeType": "text/typescript"
}
```

#### Delete Project File

```http
DELETE /projects/:id/files/:fileId
Authorization: Bearer <token>
```

### Jobs

#### Submit Job

```http
POST /jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "code-execution",
  "data": {
    "code": "console.log('Hello World');",
    "language": "javascript"
  }
}
```

#### Get Job Status

```http
GET /jobs/:id
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "7c113159-72cd-498c-b46a-e8ff980bf1d6",
  "type": "code-execution",
  "status": "completed",
  "data": {
    "code": "console.log('Hello World');",
    "language": "javascript"
  },
  "result": {
    "output": "Hello World\n",
    "exitCode": 0
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "completedAt": "2025-01-01T00:00:05.000Z"
}
```

#### Get Job Result

```http
GET /jobs/:id/result
Authorization: Bearer <token>
```

### Health Check

#### System Health

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 15
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5
    },
    "jobQueue": {
      "status": "healthy",
      "activeJobs": 2,
      "waitingJobs": 0
    }
  },
  "uptime": 3600,
  "memory": {
    "rss": 52428800,
    "heapTotal": 29360128,
    "heapUsed": 20971520,
    "external": 1048576
  }
}
```

## WebSocket Events

### Connection

Connect to the WebSocket server:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token',
  },
});
```

### Events

#### Join Workspace

```javascript
socket.emit('join-workspace', {
  workspaceId: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
});
```

#### Leave Workspace

```javascript
socket.emit('leave-workspace', {
  workspaceId: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
});
```

#### File Change Events

```javascript
// Listen for file changes
socket.on('file-changed', (data) => {
  console.log('File changed:', data);
  // {
  //   fileId: 'uuid',
  //   projectId: 'uuid',
  //   content: 'new content',
  //   userId: 'uuid',
  //   timestamp: '2025-01-01T00:00:00.000Z'
  // }
});

// Broadcast file change
socket.emit('file-change', {
  fileId: 'uuid',
  projectId: 'uuid',
  content: 'new content',
});
```

#### User Presence Events

```javascript
// User joined workspace
socket.on('user-joined', (data) => {
  console.log('User joined:', data);
  // {
  //   userId: 'uuid',
  //   username: 'John Doe',
  //   timestamp: '2025-01-01T00:00:00.000Z'
  // }
});

// User left workspace
socket.on('user-left', (data) => {
  console.log('User left:', data);
  // {
  //   userId: 'uuid',
  //   timestamp: '2025-01-01T00:00:00.000Z'
  // }
});
```

#### Cursor Updates

```javascript
// Listen for cursor updates
socket.on('cursor-update', (data) => {
  console.log('Cursor update:', data);
  // {
  //   userId: 'uuid',
  //   fileId: 'uuid',
  //   position: { line: 10, column: 5 },
  //   timestamp: '2025-01-01T00:00:00.000Z'
  // }
});

// Send cursor update
socket.emit('cursor-update', {
  fileId: 'uuid',
  position: { line: 10, column: 5 },
});
```

## Status Codes

- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

## Interactive Documentation

For interactive API testing, visit the Swagger UI at:

- **Development:** http://localhost:3000/api/docs
- **Note:** Swagger UI is disabled in production for security
