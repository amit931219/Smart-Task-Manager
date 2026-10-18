# 🚀 Smart Task Manager with Gmail Integration & AI Features

An intelligent, full-stack MERN application that centralizes task management, converts inbound emails from a central Gmail account into actionable tasks using AI, monitors deadlines with automated overdue alert dispatches, and delivers executive department summaries.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Technology Stack](#-technology-stack)
3. [Quick Start & How to Run in VS Code](#-quick-start--how-to-run-in-vs-code)
4. [Default Demo Credentials](#-default-demo-credentials)
5. [The 4 AI Features Explained](#-the-4-ai-features-explained)
6. [Central Gmail Integration (Flow 5.2)](#-central-gmail-integration-flow-52)
7. [Automated Overdue Alerts & Cron (Flow 5.3)](#-automated-overdue-alerts--cron-flow-53)
8. [Automated Testing Suite](#-automated-testing-suite)
9. [Project Architecture & File Tree](#-project-architecture--file-tree)

---

## 🌟 Key Features

- **Role-Based Access Control (RBAC):** Admin and Employee logins with JWT authentication and protected routes.
- **Interactive Kanban Board & Table Views:** Filter tasks by status, priority, department, and assignee with real-time subtask checklists.
- **AI Email-to-Task Converter (Gmail Integration):** Reads natural-language task requests from central Gmail and converts them into structured tasks (`Task`, `Assignee`, `Priority`, `Deadline`) for human review and approval.
- **AI Subtask Generator:** Suggests actionable, domain-specific subtasks in 1 click for any project deliverable.
- **AI Priority & Deadline Risk Assistant:** Evaluates time remaining vs workload and suggests appropriate priority flags with transparent reasoning.
- **AI Task Summary Assistant:** Grounded departmental reports detailing overdue work, responsible owners, and operational recommendations with one-click PDF export.
- **Automated Overdue Detection & Email Alerts:** Background `node-cron` monitors deadlines, triggers alert emails to assignees, and logs all events in MongoDB audit history.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Tailwind CSS, Recharts, Lucide Icons, Axios, date-fns |
| **Backend** | Node.js, Express.js, REST APIs, Mongoose ODM, Helmet, express-rate-limit, CORS |
| **Database** | MongoDB (local or MongoDB Atlas). Collections: `Users`, `Tasks`, `ActivityLogs`, `Notifications`, `EmailDrafts` |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs password hashing, RBAC middleware |
| **Gmail Integration** | Google Cloud Console OAuth 2.0, Gmail API (`googleapis`), Base64 message decoding, Interactive Simulator |
| **Notifications** | Nodemailer (with Ethereal / SMTP / Gmail fallback), `node-cron` scheduled overdue engine, In-app alerts |
| **AI Layer** | Heuristic NLP + `chrono-node` parser (zero external keys needed out of the box), optional Google Gemini / OpenAI LLM APIs |
| **Testing** | Jest, Supertest, Postman-ready REST endpoints |

---

## 💻 Quick Start & How to Run in VS Code

### Method 1: Using VS Code Built-In Tasks (Easiest)

1. Open this project folder in **VS Code**:
   ```powershell
   code "C:\Users\Amit Tomar\Downloads\Smart Task Manager"
   ```
2. Press **`Ctrl + Shift + B`** (or go to **Terminal > Run Build Task...**) and select:
   - **`1. Run Full Stack (Backend + Frontend)`**
3. Open your browser at **`http://localhost:5173`**.

---

### Method 2: Using the Integrated Terminal

Open the VS Code Terminal (**`Ctrl + \``**) in the project root:

1. **Seed the MongoDB Database** (Pre-configures sample tasks, users, and Gmail drafts):
   ```powershell
   npm run seed
   ```
2. **Start Both Frontend and Backend Concurrently**:
   ```powershell
   npm run dev
   ```
3. Open **`http://localhost:5173`** in your browser.

- **Backend API**: `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)
- **Frontend App**: `http://localhost:5173`

---

### Method 3: VS Code Debugger (F5)

1. Press **`F5`** or go to the **Run and Debug** view in the left sidebar.
2. Select **`Full Stack: Launch & Debug`** or **`Backend: Debug API Server`**.
3. Set breakpoints in any backend route or service file!

---

## 👥 Default Demo Credentials

The login screen features **1-click quick login buttons** for instant evaluation:

| Name | Email | Password | Role | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Dr. Vikrant Verma** | `admin@smarttask.com` | `password123` | **Admin** | Management |
| **Rahul Sharma** | `rahul@smarttask.com` | `password123` | Employee | CSE |
| **Priya Patel** | `priya@smarttask.com` | `password123` | Employee | CSE |
| **Amit Tomar** | `amit@smarttask.com` | `password123` | Employee | IT |

---

## 🤖 The 4 AI Features Explained

### 1. AI Email-to-Task Converter
- **How it works:** Reads formatted or natural language emails (e.g. *"Please ask Rahul to prepare the BCS402 course file by Monday. This is high priority."*).
- **AI extracts:**
  - `Title`: "Prepare BCS402 course file"
  - `Assignee`: Rahul Sharma (matched to known employee)
  - `Priority`: High
  - `Deadline`: Computed exact date via `chrono-node` / AI
- **Human-in-the-loop:** The user reviews, edits if needed, and clicks **"Approve & Create Task"** (or discards).

### 2. AI Subtask Generator
- **How to test:** Click **"New Task"**, type a title (e.g. *"Prepare the annual department report"*), and click **"⚡ Suggest Subtasks with AI"**.
- **Result:** Generates an actionable, domain-specific checklist that you can check, edit, or delete before saving.

### 3. AI Priority & Deadline Risk Assistant
- **How to test:** In the **Create Task** modal, select a due date and click **"AI Risk Check"**.
- **Result:** Evaluates remaining time against workload and suggests priority adjustments with transparent reasoning (e.g. flagging a 24-hour deadline with 5 subtasks as Urgent). Click **"Apply Suggestion"** to apply it.

### 4. AI Task Summary Assistant
- **How to test:** Go to **AI Summary Assistant** in the sidebar, select a department (e.g. **CSE**), and click **"Generate AI Report"**.
- **Design rule:** Queries the MongoDB database first with strict code so AI cannot hallucinate tasks, then synthesizes metrics, overdue items, responsible owners, and recommendations. Includes a **"Export / Print PDF"** button.

---

## ✉️ Central Gmail Integration (Flow 5.2)

The system supports two complementary modes:

1. **Interactive Simulation Mode (Default):**
   - Click **"Simulate Incoming Email"** on the **Gmail Inbox Hub** page.
   - Select one of the quick templates (e.g. BCS402 Course File for Rahul) or write a custom email.
   - The AI pipeline automatically decodes the body, extracts structured fields, and presents a **Draft Review Card**.

2. **Live Google Cloud Gmail API (OAuth 2.0):**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com).
   - Enable the **Gmail API** and configure the OAuth consent screen in *Testing* mode.
   - Add your Gmail account as a test user.
   - Set credentials in `backend/.env`:
     ```env
     GMAIL_CLIENT_ID=your_client_id.apps.googleusercontent.com
     GMAIL_CLIENT_SECRET=your_client_secret
     GMAIL_REFRESH_TOKEN=your_refresh_token
     CENTRAL_GMAIL_USER=your_central_email@gmail.com
     ```
   - Click **"Sync Central Gmail"** to pull live unread messages!

---

## ⏰ Automated Overdue Alerts & Cron (Flow 5.3)

1. A background `node-cron` job runs hourly to identify tasks whose `dueDate < now` that are not completed.
2. The system automatically:
   - Updates task status to `overdue`
   - Highlights the task in red on the dashboard
   - Dispatches an overdue alert email to the assigned employee via Nodemailer
   - Creates an in-app notification with an alert bell ping
   - Appends an audit event to the MongoDB `ActivityLog` collection
3. You can also trigger an immediate overdue scan on demand by clicking **"Trigger Overdue Scan"** on the dashboard!

---

## 🧪 Automated Testing Suite

Comprehensive Jest & Supertest integration tests are included:

```powershell
npm test
```

### Test Coverage Summary:
- `GET /api/health` - Service health check
- `POST /api/auth/login` - Admin and employee JWT generation
- `GET /api/tasks` - Role-based task retrieval
- `POST /api/ai/parse-email` - AI Email-to-Task structured extraction
- `POST /api/ai/subtasks` - AI subtask generation engine
- `GET /api/dashboard` - MongoDB aggregation metrics & status breakdowns
- `GET /api/gmail/drafts` - Pending email draft workflow

---

## 📁 Project Architecture & File Tree

```
Smart Task Manager/
├── .vscode/
│   ├── launch.json          # F5 Full Stack & Backend debugging
│   ├── tasks.json           # 1-click execution tasks (dev, seed, test)
│   └── settings.json        # Editor formatting configuration
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection
│   │   ├── controllers/     # Auth, Tasks, AI, Gmail, Dashboard, Notifications, Activity
│   │   ├── middlewares/     # JWT Auth, RBAC, Zod Validator, Error Handler
│   │   ├── models/          # User, Task, ActivityLog, Notification, EmailDraft
│   │   ├── routes/          # Express API route endpoints
│   │   ├── scripts/         # seed.js database seeder
│   │   ├── services/        # AI Service, Gmail Service, Email Service, Cron Service
│   │   ├── tests/           # Jest API test suite
│   │   ├── app.js           # Express app setup, Helmet, Rate-limit, CORS
│   │   └── server.js        # Server listener and cron initialization
│   ├── .env                 # Active development environment variables
│   ├── .env.example         # Configuration template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/          # AISummaryAssistant with PDF export
│   │   │   ├── dashboard/   # MetricCards, ChartsSection, UrgentAlertBanner, RecentActivityList
│   │   │   ├── gmail/       # DraftReviewCard (Flow 5.2), SimulateEmailModal
│   │   │   ├── layout/      # Navbar (with notifications drop-down), Sidebar, AppLayout
│   │   │   └── tasks/       # TaskCard, TaskDetailModal, CreateTaskModal
│   │   ├── context/         # AuthContext, NotificationContext
│   │   ├── pages/           # LoginPage, DashboardPage, TasksPage, GmailSyncPage, etc.
│   │   ├── services/        # Axios API client with interceptors
│   │   ├── App.jsx          # Route definitions & guards
│   │   ├── main.jsx         # React root entry
│   │   └── index.css        # Tailwind styles & scrollbars
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js       # Vite config with backend proxy
│   └── package.json
├── package.json             # Root orchestration script
├── .gitignore
└── README.md
```

