# Enterprise Employee Management System (EMS)

A complete, production-ready, secure, and containerized Enterprise Employee Management System.

---

## Technical Stack & Architecture

### Backend:
- **Node.js & Express.js**
- **Architecture**: Route → Controller → Service → Repository → PostgreSQL Pool client
- **Security**: JWT Access/Refresh tokens, bcrypt password hashing, Helmet headers, express-rate-limit request throttling, input cleansing via Joi schemas
- **Cron Engine**: node-cron background reminders and database health logging
- **Logger**: Winston JSON file logger (logs split into `error.log` and `combined.log`)

### Frontend:
- **Vite & React.js** (SPA)
- **State & Alerts**: Context API (Auth session, toast alarms, unread event bell triggers)
- **Styling**: Tailwind CSS dark-slate corporate UI featuring glassmorphism elements
- **Visuals**: Recharts (Pie, Bar, Area, and Line charts)

### Database:
- **PostgreSQL** (15 tables, indexes, constraints, and custom aggregated SQL views)

---

## Directory Structure

```
enterprise-ems/
├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── src/
│   │   ├── config/ (db.js, logger.js)
│   │   ├── controllers/ (auth, employee, leave, asset, dashboard, notifications)
│   │   ├── services/ (auth, employee, leave, asset)
│   │   ├── repositories/ (user, employee, leave, asset)
│   │   ├── middleware/ (auth, validate, multer, errorHandler)
│   │   ├── validators/ (auth, employee, leave, asset)
│   │   ├── routes/ (auth, employee, leave, asset, dashboard, notifications, health)
│   │   ├── jobs/ (cronJobs.js)
│   │   ├── utils/ (appError.js, auditLogger.js, mailer.js)
│   │   └── tests/ (auth.test.js)
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/ (apiClient.js)
│   │   ├── context/ (Auth, Toast, Notification)
│   │   ├── layouts/ (DashboardLayout, AuthLayout)
│   │   ├── pages/ (LoginPage, Dashboard, EmployeesList, EmployeeDetails, LeavesDashboard, AssetsDashboard, Reports)
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml
├── postman_collection.json
└── README.md
```

---

## Database Optimization Report

To ensure scalability and performance under high transaction loads, we implemented the following strategies:

### 1. PostgreSQL Indexing
- **`idx_users_email`**: Accelerates lookup during login validations and token refreshes.
- **`idx_employee_profiles_names`**: Speeds up text searches on employee lists.
- **`idx_employee_profiles_dept`**: Optimizes list filtering operations.
- **`idx_leave_apps_status`**: Speeds up pending queues for manager/HR dashboards.
- **`idx_notifications_user_read`**: Speeds up fetching alerts feeds for individual sessions.

### 2. Aggregation Optimization via Views
- **`v_employee_details`**: Joins user accounts, employee profiles, department listings, and counts active allocations and skills arrays inside a single query.
- **`v_leave_summary`**: Optimizes calculation of duration and consolidates profile metadata.
- **`v_asset_details`**: Speeds up join operations between hardware details and active user assignments.

---

## Getting Started: Local Setup

### Prerequisite
Ensure you have **Node.js (v18+)** and **PostgreSQL** installed locally.

### Step 1: Database Setup
Create a PostgreSQL database named `enterprise_ems`:
```bash
createdb -U postgres enterprise_ems
```
Restore the schema and seed data:
```bash
psql -U postgres -d enterprise_ems -f backend/database/schema.sql
psql -U postgres -d enterprise_ems -f backend/database/seed.sql
```

### Step 2: Configure Environment
Create a `backend/.env` file with your credentials (see example in `backend/.env`).

### Step 3: Run Backend Server
```bash
cd backend
npm install
npm run dev
```
The server will start on `http://localhost:5000`.

### Step 4: Run Frontend Client
```bash
cd ../frontend
npm install
npm run dev
```
The application will launch on `http://localhost:3000`.

---

## Running with Docker Compose

You can build and spin up the database, API server, and web client automatically:
```bash
docker-compose up --build
```
- **Web Client**: Access on `http://localhost` (Port 80)
- **API Server**: Access on `http://localhost:5000`
- **Database**: Port `5432`

---

## Deployment Guide

### 1. PostgreSQL (Neon Database)
1. Sign up on [Neon Console](https://neon.tech/).
2. Create a new project and select PostgreSQL version 15.
3. Retrieve your connection string `postgresql://...`
4. Use this connection string as `DATABASE_URL` in your backend deployment.
5. Execute the `schema.sql` and `seed.sql` queries inside the Neon SQL Editor.

### 2. Backend API (Render)
1. Sign up on [Render](https://render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository containing the backend code.
4. Select Root Directory as `backend`.
5. Set environment variables:
   - `DATABASE_URL` = (Your Neon connection string)
   - `JWT_SECRET` = (Custom secure string)
   - `JWT_REFRESH_SECRET` = (Custom secure string)
   - `NODE_ENV` = `production`
6. Deploy the web service.

### 3. Frontend (Vercel)
1. Install Vercel CLI or connect repository on [Vercel](https://vercel.com/).
2. Select Root Directory as `frontend`.
3. Set build commands:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Set up rewrite configuration inside `vercel.json` to route endpoints back to the Render URL (replaces local proxy):
   ```json
   {
     "rewrites": [{ "source": "/api/(.*)", "destination": "https://your-render-api.com/api/$1" }]
   }
   ```
5. Deploy.
