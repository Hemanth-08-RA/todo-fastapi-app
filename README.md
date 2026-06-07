# TaskFlow — Private, Shared Real-Time Todo Application

TaskFlow is a premium, glassmorphic Todo application that allows you and your friend to sync tasks in real-time across different networks. It features a private "Secret Key" room system, local persistence, and permanent SQLite database storage.

## ✨ Features

- **Glassmorphic UI**: High-end modern design utilizing ambient backdrop animations, customized scrollbars, and vibrant neon accents.
- **Private Room Keys**: Generate separate, shared task lists on the fly. Only people knowing the exact secret key can view or modify those tasks.
- **SQLite Database**: Permanent server-side persistence ensures tasks survive browser resets, device changes, and server reboots.
- **Real-Time Syncing**: Uses smart auto-polling (every 3 seconds) with deep task diffing to synchronize changes instantly between multiple screens without screen flickering.
- **Visual Feedback**: Sleek slide-in and slide-out list animations, circular animated checkboxes, and custom toast notifications.
- **Local Persistence**: Remembers your active Secret Room Key so you don't have to enter it every time you visit.

---

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python 3)
- **Database**: SQLite3
- **Frontend**: Semantic HTML5, Vanilla CSS3 (custom variables, keyframe animations, glassmorphism), Vanilla JavaScript (async/await fetch, smart DOM diffing)
- **Server Runner**: Uvicorn

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
# Clone the repository
git clone https://github.com/Hemanth-08-RA/todo-fastapi-app.git
cd todo-fastapi-app

# Install dependencies
pip install -r requirements.txt
```

### 2. Running the Application
Start the Uvicorn web server:
```bash
python -m uvicorn main:app --reload
```
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 🌐 Sharing with Friends

Since you are on different networks, you can expose your local server temporarily to the public internet using a secure tunnel like **ngrok**:

1. Run the server locally.
2. Start ngrok:
   ```bash
   ngrok http 8000
   ```
3. Share the generated public URL (e.g. `https://xxxx-xxxx.ngrok-free.app`) with your friend.
4. Agree on a secret room key (e.g., `alice-bob-tasks`) and enter it on both screens. Enjoy real-time synchronization!

---

## 🔍 Chrome Address Bar Integration

To open the webpage instantly just by typing `to-do` in Chrome:

1. Open Chrome and head to `chrome://settings/searchEngines`.
2. Scroll to the **Site search** section and click **Add**.
3. Fill in:
   - **Search engine**: `TaskFlow`
   - **Shortcut**: `to-do` (or `todo`)
   - **URL with %s in place of query**: *Your deployed Render URL or local ngrok link*
4. Click **Add**. Now, typing `to-do` + `Enter` in Chrome will launch the app!
