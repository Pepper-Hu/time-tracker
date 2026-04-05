# Time Tracker

Time Tracker is a full-stack MERN application for logging work sessions and managing time entries. The project includes authentication, timer-based time entry tracking, editable records, automated backend tests, and CI/CD deployment through GitHub Actions and an AWS EC2 self-hosted runner.

## Project Summary

This repository contains:

- A React frontend for sign in, sign up, and managing time entries
- A Node.js + Express backend with MongoDB for authentication and time-entry CRUD operations
- Automated backend tests using Mocha, Chai, and Sinon
- A GitHub Actions workflow for CI/CD deployment to EC2
- Nginx and PM2 hosting on AWS EC2

## Live Deployment

- Public URL: http://54.252.140.237
- Backend API base URL: http://54.252.140.237:5001

Note: The deployment currently uses HTTP. HTTPS is not configured.

## Features

- User registration and sign in
- Auth persistence using localStorage
- Start/stop timer workflow
- Create time entries when the timer is stopped
- View all entries
- Edit time entries including date, start time, end time, and description
- Delete time entries
- Protected backend routes
- Automated backend controller tests
- Self-hosted GitHub Actions runner on EC2

## Tech Stack

### Frontend

- React 18
- React Router v6
- Axios
- Tailwind CSS
- Create React App

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- bcrypt password hashing

### DevOps

- GitHub Actions
- AWS EC2
- PM2
- Nginx
- Self-hosted GitHub Actions runner

## Repository Structure

```text
time-tracker/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── test/
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
├── .github/
│   └── workflows/
├── requirements/
└── README.md
```

## Prerequisites

Before running locally, make sure to have:

- Node.js installed
- npm installed
- A MongoDB Atlas connection string or local MongoDB instance

## Environment Variables

### Backend `backend/.env`

Create a file at `backend/.env`:

```dotenv
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
```

### Frontend API Configuration

The frontend uses the deployed backend URL in:

- `frontend/src/axiosConfig.jsx`

For local development, temporarily switch it to:

```jsx
baseURL: 'http://localhost:5001';
```

For deployment, it is configured to use the EC2 public IP.

## Installation

### Option 1: Install everything from the root

```bash
npm run install-all
```

### Option 2: Install separately

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Running Locally

### Run the full application from the root

```bash
npm run dev
```

This starts:

- backend in development mode
- frontend React development server

### Run backend only

```bash
cd backend
npm run dev
```

### Run frontend only

```bash
cd frontend
npm start
```

## Running Tests

Backend automated tests are written with Mocha, Chai, and Sinon.

```bash
npm test --prefix backend
```

Test coverage includes:

- authentication controller
- time-entry controller

## Deployment Overview

The project is deployed to AWS EC2 using:

- a GitHub self-hosted runner
- GitHub Actions workflow
- PM2 for process management
- Nginx for web serving and reverse proxying

The workflow runs on push to `main` and executes on the EC2 runner.

## CI/CD Workflow

The GitHub Actions workflow is located at:

- `.github/workflows/ci.yml`

It currently:

1. Runs on push to `main`
2. Uses the EC2 self-hosted runner
3. Installs dependencies
4. Runs backend tests
5. Deploys the backend and frontend using PM2

## AWS / EC2 Notes

On the EC2 instance, the following were configured:

- Node.js
- Nginx
- PM2
- GitHub self-hosted runner

The live app is accessible at:

- http://54.252.140.237

If the browser does not load over HTTPS, use HTTP. HTTPS is not configured for this deployment.

## Useful Commands

```bash
npm run install-all
npm run dev
npm test --prefix backend
```

## Troubleshooting

### Public URL not opening

Check:

- EC2 Security Group inbound rules
- Nginx status
- PM2 status
- Port 80 access

### Backend API not responding

Check:

- `backend/.env` values
- MongoDB connection string
- PM2 backend process status

### Local frontend cannot reach backend

Check:

- `frontend/src/axiosConfig.jsx`
- `baseURL` value

## Assessment Notes

This project was completed as part of IFN636 Assessment 1.2 and includes:

- backend and frontend development
- authentication and authorisation
- version control with branches and pull requests
- CI/CD integration
- AWS deployment evidence
- backend unit testing

## Author

Pepper-Hu
