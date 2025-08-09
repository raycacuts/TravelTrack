# React + Vite

Track places you've been and spots you want to go. Works with a React frontend and Node.js backend.

## Features
- Log visited cities and planned trips
- Interactive map with markers and travel lines
- User login/signup with JWT
- Upload avatar
- Mobile friendly

## Tech
**Frontend**
- React + Vite
- Leaflet
- React Router
- CSS Modules

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT Auth
- Multer uploads
- Helmet, CORS, Rate Limit

## Setup

### Backend
```bash
cd server
npm install
# make a .env file
PORT=8080
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
CORS_ORIGINS=http://localhost:5173
UPLOAD_DIR=uploads
npm run dev
