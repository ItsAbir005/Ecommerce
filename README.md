# Ecommerce

A full-stack ecommerce platform built with a Node.js/Express backend and a Next.js frontend. The system supports product browsing, cart management, order processing, real-time notifications, delivery driver assignment, and Stripe-based payments.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Development (Docker)](#development-docker)
  - [Manual Setup](#manual-setup)
- [API Modules](#api-modules)
- [Scripts](#scripts)

---

## Overview

This project is a monorepo containing two main services:

- **Backend** — A REST API built with Express and TypeScript, connected to MongoDB, Redis, RabbitMQ, and integrated with Stripe, Cloudinary, and Nodemailer.
- **Frontend** — A Next.js 16 application using React 19, Tailwind CSS, Socket.IO for real-time updates, and Leaflet for map-based delivery tracking.

Both services are containerised and can be orchestrated using Docker Compose.

---

## Tech Stack

### Backend

| Technology     | Purpose                              |
|----------------|--------------------------------------|
| Node.js        | Runtime environment                  |
| Express 5      | HTTP server and routing              |
| TypeScript     | Type-safe development                |
| MongoDB        | Primary database via Mongoose        |
| Redis          | Caching and session management       |
| RabbitMQ       | Asynchronous job queue (via amqplib) |
| Socket.IO      | Real-time bidirectional events       |
| Stripe         | Payment processing                   |
| Cloudinary     | Image storage and delivery           |
| Nodemailer     | Transactional email                  |
| Pino           | Structured logging                   |
| Sentry         | Error monitoring                     |

### Frontend

| Technology     | Purpose                              |
|----------------|--------------------------------------|
| Next.js 16     | React framework with SSR/SSG         |
| React 19       | UI library                           |
| TypeScript     | Type safety                          |
| Tailwind CSS 4 | Utility-first styling                |
| Socket.IO      | Real-time event handling             |
| Leaflet        | Interactive maps for delivery tracking |
| Sentry         | Frontend error monitoring            |

---

## Project Structure

```
Ecommerce/
├── backend/
│   ├── src/
│   │   ├── app.ts              # Express app setup
│   │   ├── server.ts           # Entry point
│   │   ├── config/             # Database and service configs
│   │   ├── middleware/         # Auth, error handling, logging
│   │   ├── models/             # Mongoose schemas
│   │   ├── modules/            # Feature modules (see below)
│   │   ├── routes/             # Route aggregator
│   │   └── seed/               # Database seed helpers
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── app/                    # Next.js App Router pages
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Development compose (with dev services)
└── README.md
```

---

## Features

- User registration, login, and JWT-based authentication
- Product catalogue with categories and image uploads via Cloudinary
- Shopping cart management
- Order placement and lifecycle tracking
- Stripe payment integration with webhook support
- Real-time order status notifications via Socket.IO
- Delivery driver assignment and shipment tracking with map view
- In-app chat between customers and support
- Email notifications via Nodemailer (MailHog in development)
- Background job processing via RabbitMQ
- Redis caching for improved performance
- Structured logging with Pino and error tracking with Sentry
- Database seeding script for development data

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) and Docker Compose (recommended for local development)
- A MongoDB instance (local or Atlas)
- A Redis instance
- A RabbitMQ instance
- Stripe account and API keys
- Cloudinary account and API keys

---

## Environment Variables

Create a `.env` file inside the `backend/` directory. The following variables are required:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecommerce

JWT_SECRET=your_jwt_secret

REDIS_URL=redis://localhost:6379

RABBITMQ_URL=amqp://localhost:5672

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

SENTRY_DSN=your_sentry_dsn
```

For the frontend, create a `.env.local` file inside the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

---

## Getting Started

### Development (Docker)

The development Docker Compose file spins up MongoDB, Redis, RabbitMQ, and MailHog locally.

```bash
# Start all infrastructure services
docker compose -f docker-compose.dev.yml up -d

# Install backend dependencies and start in dev mode
cd backend
npm install
npm run dev

# In a separate terminal, install frontend dependencies and start
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:8081`.  
The backend API will be available at `http://localhost:5000`.  
MailHog web UI (view dev emails) will be at `http://localhost:8025`.  
RabbitMQ management UI will be at `http://localhost:15672`.

### Manual Setup

If you prefer not to use Docker, ensure MongoDB, Redis, and RabbitMQ are running locally and their connection strings are set in your `.env` file, then follow the same install and run steps above.

---

## API Modules

The backend is organised into self-contained feature modules under `src/modules/`:

| Module          | Responsibility                                      |
|-----------------|-----------------------------------------------------|
| `auth`          | Registration, login, logout, JWT refresh            |
| `users`         | User profile management                             |
| `categories`    | Product category CRUD                               |
| `products`      | Product listing, detail, create, update, delete     |
| `cart`          | Add, update, remove cart items                      |
| `orders`        | Place orders, view order history and status         |
| `payment`       | Stripe checkout and webhook handling                |
| `shipping`      | Shipment creation and tracking                      |
| `drivers`       | Driver registration, assignment, and location       |
| `notifications` | Real-time and persistent notification management    |
| `chat`          | Customer support messaging                          |
| `mail`          | Email dispatch helpers                              |
| `jobs`          | RabbitMQ consumer/producer job workers              |

---

## Scripts

### Backend

```bash
npm run dev      # Start backend with nodemon (hot reload)
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled production build
npm run seed     # Seed the database with sample data
```

### Frontend

```bash
npm run dev      # Start Next.js dev server on port 8081
npm run build    # Build for production
npm run start    # Serve production build
npm run lint     # Run ESLint
npm run lint:fix # Auto-fix lint issues
```

---

## License

This project is licensed under the ISC License.
