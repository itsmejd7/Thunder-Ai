# Backend Deployment Guide

## Environment Variables Required

Add these environment variables in your Render dashboard:

### Database Configuration
```
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/thunder-ai?retryWrites=true&w=majority
```

### Google AI API
```
GOOGLE_API_KEY=your-google-ai-api-key
```

### JWT Secret
```
JWT_SECRET=your-super-secret-jwt-key
```

### Environment
```
NODE_ENV=production
```

## Render Deployment Steps

1. **Connect GitHub Repository**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your repository: `itsmejd7/Thunder-Ai`

2. **Configure Service**
   - **Name**: `thunder-ai-backend`
   - **Root Directory**: `Backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Add Environment Variables**
   - Add all the variables listed above
   - Make sure to use your actual MongoDB URI and API keys

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

## Frontend Configuration

After backend deployment, update your frontend environment variable:

```
VITE_API_URL=https://your-backend-name.onrender.com
```

## Testing

Test these endpoints:
- `GET /api/thread` - Get all threads
- `POST /api/chat` - Send message
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Signup 