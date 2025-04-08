# Vertex AI Backend

A robust backend system for AI model management and deployment, allowing developers to upload, manage, and monetize their AI models while providing consumers with easy access to these models.

## Overview

Vertex AI Backend is a platform that bridges the gap between AI model developers and consumers. It provides a comprehensive API for:

- User management (developers and consumers)
- AI model uploading and management
- API key generation and management
- Model discovery and consumption
- Usage tracking and monetization

## Features

### User Management
- User registration and authentication
- JWT-based authentication
- Role-based access control (developer, consumer, both)
- Profile management

### AI Model Management
- Upload and host AI models
- Categorize models (NLP, Vision, etc.)
- Set pricing models (free or pay-per-call)
- Control model visibility (active, draft, suspended)
- Generate unique API endpoints for each model

### API Key Management
- Generate secure API keys for model access
- Track API usage per key
- Revoke API keys when needed
- Usage analytics for developers

### Usage Analytics
- Detailed usage logs for each API call
- Performance metrics (response time, success rate)
- Usage statistics by model and user
- Daily and monthly usage trends
- Developer dashboard with comprehensive analytics

### API Access
- Secure API endpoints for model consumption
- Usage tracking and rate limiting
- Developer analytics

## Tech Stack

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcrypt for password hashing

## API Endpoints

### User Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | /api/users/register | Register a new user | Public |
| POST | /api/users/login | Login and get token | Public |
| GET | /api/users/profile | Get user profile | Required |
| PUT | /api/users/profile | Update user profile | Required |
| PUT | /api/users/change-password | Change password | Required |
| DELETE | /api/users/delete | Delete user account | Required |
| GET | /api/users/all | Get all users (admin) | Admin only |

### AI Model Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | /api/models | Get all models (with filters) | Public |
| GET | /api/models/:id | Get model by ID | Public |
| POST | /api/models | Create a new model | Required |
| PUT | /api/models/:id | Update a model | Required (owner) |
| DELETE | /api/models/:id | Delete a model | Required (owner) |
| GET | /api/models/developer/my-models | Get developer's models | Required |
| PATCH | /api/models/:id/status | Change model status | Required (owner) |

### API Key Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | /api/keys | Generate a new API key | Required |
| GET | /api/keys/my-keys | Get user's API keys | Required |
| GET | /api/keys/:id | Get API key details | Required |
| PATCH | /api/keys/:id/revoke | Revoke an API key | Required (owner) |
| GET | /api/keys/model/:model_id | Get keys for a model | Required (model owner) |

### Usage Analytics Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | /api/usage/key/:id | Get logs for specific API key | Required (owner/developer) |
| GET | /api/usage/model/:model_id | Get logs for specific model | Required (developer) |
| GET | /api/usage/my-usage | Get user's usage across all keys | Required |
| GET | /api/usage/developer/stats | Get developer statistics | Required (developer) |

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
    ```bash
    git clone https://github.com/yourusername/vertex-ai-backend.git
    cd vertex-ai-backend
    ```

2. Install dependencies
    ```bash
    npm install
    ```

3. Set up environment variables
    ```bash
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/vertex_ai
    JWT_SECRET=your_jwt_secret_key_here
    ``` 

4. Run the server
    ```bash
    npm start
    ```
5. For Development
    ```bash
    npm run dev
    ```
## Data Models
### User Model
- name : Full name (required)
- email : Email address (required, unique)
- password_hash : Hashed password (required)
- user_type : Role ('developer', 'consumer', or 'both')
- bio : Short user bio (optional)
- profile_image_url : Profile picture URL (optional)
- created_at : Registration date

### AI Model
- developer_id : Reference to User model (required)
- name : Model name (required)
- description : Model description (required)
- category : Model category (NLP, Vision, etc.)
- pricing_type : Monetization type ('free' or 'per_call')
- price_per_call : Price per API call (if per_call)
- usage_limit_free : Usage limit for free tier
- api_endpoint : Auto-generated API endpoint
- model_file_url : URL to hosted model file
- status : Model status ('active', 'draft', 'suspended')
- created_at : Upload date

### API Key
- user_id : Reference to User model (required)
- model_id : Reference to AI Model (required)
- api_key : Unique API key string (required)
- usage_count : Number of API calls made
- status : Key status ('active', 'revoked')
- created_at : When the key was issued

### API Usage Log
- api_key_id : Reference to API Key (required)
- model_id : Reference to AI Model (required)
- input_summary : Sanitized input data summary
- response_time_ms : Response time in milliseconds
- status_code : HTTP status code of response
- created_at : Timestamp of the API call

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Register or login to get a token
2. Include the token in the Authorization header of your requests:
    ```bash
    Authorization: Bearer your_token_here
    ```
