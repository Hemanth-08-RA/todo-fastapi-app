# TaskFlow — Private, Shared Real-Time Todo Application

TaskFlow is a premium, collaborative web application that enables users to schedule and synchronize tasks in real-time across different networks. Featuring a high-end glassmorphic UI, a dynamic Month/Week calendar scheduler, and private "Secret Room Keys," it allows you and your friends to manage lists securely without requiring standard user registrations. 

All task states are permanently persisted in a lightweight SQLite database.

---

## 📖 Project Description

TaskFlow is designed to solve a common problem: sharing collaborative to-do lists quickly and privately across different devices and networks. 

Instead of requiring email verification, passwords, or complex account creation, TaskFlow uses **Secret Room Keys**. By entering the same secret key (e.g. `house-chores-list` or `project-deadline`), you and your collaborators connect to the same task pool. Any update made by one person (adding a task, checking it off, or deleting it) is synchronized on all other connected screens in real-time via smart 3-second auto-polling.

### Core Architectural Features:
- **State-Based Calendar views**: Switch between a full **Month Grid** and a compact **7-Day Week Strip** dynamically to organize your timeline.
- **Database Partitioning**: A single SQLite file (`todo.db`) partitions tasks using the room ID. If someone visits the app and types a different key, your tasks remain private and completely hidden from them.
- **Optimized Client Syncing**: The JavaScript client implements a deep-diffing state algorithm. The DOM only updates when actual database changes occur, preventing UI flickering and maintaining a fluid interactive experience.

---

## ✨ Features

- **Integrated Month/Week Calendar**: Select any day on the visual calendar to schedule and view tasks specifically for that date.
- **Task Indicator Dots**: The calendar displays glowing cyan dots under dates that have tasks scheduled.
- **Glassmorphic Theme**: Dark mode design featuring radial glowing blobs, backdrop blurs (`backdrop-filter`), smooth hover transitions, and slide-in/out animations.
- **Instant Connection**: Use browser `localStorage` to save your Secret Room Key so you stay logged into your shared room between sessions.
- **Custom Toast Alerts**: Provides visual notifications for actions like "Task Completed," "Task Deleted," or "Connected to Room."
- **Clean Responsive Layout**: Tailored CSS flexbox and grid layouts optimize rendering on mobile screens, tablets, and desktop monitors.

---

## 🛠️ Technology Stack

- **Backend Framework**: FastAPI (Python 3)
- **ASGI Server**: Uvicorn
- **Database**: SQLite3 (native Python bindings)
- **Frontend**: HTML5, Vanilla CSS3 (Custom properties & CSS variables), Vanilla JavaScript (ES6+ Fetch API)

---

## 🚀 Step-by-Step Installation Guide

Follow these instructions to set up and run TaskFlow on your local machine.

### Prerequisites
Before starting, ensure you have the following installed on your system:
- **Python (Version 3.8 or higher)**: Download it from the [Official Python Website](https://www.python.org/downloads/).
- **Git**: Download it from the [Official Git Website](https://git-scm.com/downloads).

---

### Step 1: Clone the Repository
Open your terminal (PowerShell or Command Prompt on Windows, Terminal on macOS/Linux) and run the following command to clone the code to your local machine:
```bash
git clone https://github.com/Hemanth-08-RA/todo-fastapi-app.git
```

Move into the project directory:
```bash
cd todo-fastapi-app
```

---

### Step 2: Create a Virtual Environment (Recommended)
Creating a virtual environment isolates the project dependencies so they do not conflict with other Python packages on your system.

**On Windows:**
```powershell
python -m venv .venv
```

**On macOS / Linux:**
```bash
python3 -m venv .venv
```

---

### Step 3: Activate the Virtual Environment
Activate the environment so that any python commands run inside it.

**On Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```
*(If you get a script execution policy warning on Windows, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` first, then run the activation command).*

**On Windows (Command Prompt):**
```cmd
.venv\Scripts\activate.bat
```

**On macOS / Linux:**
```bash
source .venv/bin/activate
```

---

### Step 4: Install Dependencies
Install all required Python packages (FastAPI, Uvicorn, Pydantic) defined in the `requirements.txt` file:
```bash
pip install -r requirements.txt
```

---

### Step 5: Start the Uvicorn Server
Run the FastAPI development server:
```bash
python -m uvicorn main:app --reload
```

You should see output indicating that the server is active:
`INFO:     Uvicorn running on http://127.0.0.1:8000`

---

### Step 6: Access the Application
Open Google Chrome (or any modern web browser) and navigate to:
```
http://127.0.0.1:8000
```
Enter a secret room key of your choice to begin using TaskFlow!

---

## 🌐 Sharing Across Networks (ngrok Tunneling)

If you want your friend on a different network to connect to your local computer:
1. Keep the Uvicorn server running (`http://127.0.0.1:8000`).
2. Download and run [ngrok](https://ngrok.com/).
3. Expose port 8000:
   ```bash
   ngrok http 8000
   ```
4. Copy the public URL generated by ngrok (e.g. `https://xxxx-xxxx.ngrok-free.app`) and send it to your friend.
5. Enter the same Secret Key on both screens to coordinate tasks in real-time.

---

## ☁️ Permanent Free Cloud Hosting (Render)

To keep the application online permanently without running your local terminal, you can host it for free on **Render**:

1. Log in to [Render.com](https://render.com/) using your GitHub account.
2. Click **New +** and select **Web Service**.
3. Choose your repository: **`Hemanth-08-RA/todo-fastapi-app`**.
4. Configure the settings:
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click **Deploy Web Service**. Render will generate a permanent public URL for you.

---

## 🔍 Chrome Address Bar Integration

To make typing `to-do` in Chrome open your app instantly:
1. Navigate to `chrome://settings/searchEngines` in Chrome.
2. Under **Site search**, click **Add**.
3. Fill in the fields:
   - **Search engine**: `TaskFlow`
   - **Shortcut**: `to-do` (or `todo`)
   - **URL**: Paste your Render URL here (e.g., `https://your-app-name.onrender.com`)
4. Click **Add**. Now, typing `to-do` + `Enter` in Chrome will launch the app!
