# Real-Time Missile Tracking System

A comprehensive real-time web application for monitoring and visualizing missile launches with animated trajectories on an interactive map.

## Features

- **Real-time Data Streaming**: WebSocket-based live updates
- **Interactive Map**: Animated missile trajectories with Leaflet.js
- **Metadata Display**: Detailed information panels for each missile
- **Alert System**: Critical event notifications
- **Historical Playback**: Time-based replay functionality
- **Responsive Design**: Mobile-friendly interface
- **Performance Optimized**: Redis caching and efficient data handling

## Tech Stack

### Frontend
- React 18 with TypeScript
- Leaflet.js for mapping
- Socket.io-client for real-time communication
- Tailwind CSS for styling
- Framer Motion for animations

### Backend
- Node.js with Express
- Socket.io for WebSocket communication
- Redis for caching and session management
- MongoDB for data persistence
- TypeScript for type safety

### DevOps
- Docker & Docker Compose
- Nginx for reverse proxy
- PM2 for process management
- Cloud deployment ready (AWS/Azure)

## Quick Start

```bash
# Clone and setup
git clone <repository>
cd missile-tracker

# Start with Docker
docker-compose up -d

# Or run locally
npm run dev:all
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Data Layer    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Redis/Mongo) │
│                 │    │                 │    │                 │
│ • Map Display   │    │ • WebSocket     │    │ • Live Data     │
│ • Animations    │    │ • API Routes    │    │ • Historical    │
│ • UI Controls   │    │ • Data Sim.     │    │ • Cache         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Security Features

- Rate limiting
- CORS configuration
- Input validation
- Environment-based configuration
- Optional authentication system

## Deployment

Supports deployment to:
- AWS (ECS, EC2, Lambda)
- Azure (Container Instances, App Service)
- Google Cloud Platform
- Self-hosted with Docker

## License

MIT License
