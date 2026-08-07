# TourMateAI — Complete Local Setup Guide

This guide is for setting up the TourMateAI project on a new computer, using the project files
shared directly (including working API keys and credentials), and pushing it to your own GitHub
repository.

> ⚠️ **Important security note:** This copy of the project includes a real `.env` file and
> `serviceAccountKey.json` with live API keys and Firebase credentials. Keep these out of any
> public GitHub repository — use a **private repo**, and make sure `.env` and
> `serviceAccountKey.json` are listed in `.gitignore` before pushing, so they never end up
> committed to version control.

---

## Phase 0 — Verify & Install Prerequisites

Open a terminal (PowerShell or Command Prompt) and run each command below to confirm the required
tools are installed.

### 1. Git

```bash
git --version
```

**Expected:** `git version 2.x.x`  
**If missing:** https://git-scm.com/downloads

---

### 2. Node.js & npm (required for the React frontend)

```bash
node --version
npm --version
```

**Expected:**
- `node` → `v18.x.x` or higher (v20+ recommended)
- `npm` → `9.x.x` or higher

**If missing:** https://nodejs.org/en/download — choose the **LTS** version

---

### 3. Python (required for the Flask backend)

```bash
python --version
```

or

```bash
python3 --version
```

**Expected:** `Python 3.10.x` or higher (project was built on **3.10.11**)  
**If missing:** https://www.python.org/downloads/

> ⚠️ **Windows users:** During installation, tick **"Add Python to PATH"** before clicking Install.

---

### 4. pip (Python package manager)

```bash
pip --version
```

**Expected:** `pip 23.x.x from ...`  
Comes bundled with Python. If missing: `python -m ensurepip`

---

### 5. MySQL Server

```bash
mysql --version
```

**Expected:** `mysql  Ver 8.x.x ...`  
**If missing:** https://dev.mysql.com/downloads/mysql/  
*(Alternatively, install **XAMPP** — https://www.apachefriends.org — which bundles MySQL with a GUI.)*

---

### ✅ All-in-One Check

Run this single command to verify everything at once:

```bash
git --version && node --version && npm --version && python --version && pip --version && mysql --version
```

If all six lines print version numbers, you are ready to proceed.

---

## Phase 1 — Set Up Your Own GitHub Repository

1. Log into your own GitHub account.
2. Create a **new repository** — give it a name (e.g. `TourMateAI`), and set its visibility to
   **Private** (important, since the project includes real API keys — see the security note above).
3. Leave the repository **empty** during creation — do not add a README, `.gitignore`, or licence
   at this stage, so it stays ready to receive the project files cleanly.
4. Once created, keep the repository page open — you will need its URL (from the green **Code**
   button) when connecting the local project folder to it.
5. Confirm that `.env` and `serviceAccountKey.json` are already listed in the project's
   `.gitignore` file before making the first commit, so your credentials never get pushed to
   GitHub, even to a private repo.
6. Then initialise the local project folder as a Git repository, connect it to your new GitHub
   repository, and push the project files up:

```bash
# Run these inside the root project folder

git init
git add .
git commit -m "Initial commit — TourMateAI project"
git remote add origin https://github.com/YourUsername/TourMateAI.git
git branch -M main
git push -u origin main
```

---

## Phase 2 — API Keys & Credentials

Since this copy of the project already includes a working `.env` file and `serviceAccountKey.json`,
you **do not** need to create your own accounts or generate your own keys for Gemini, Google Cloud,
OpenWeather, or Firebase — everything is already filled in and ready to use.

Just confirm these files are present before continuing:

| File | Location |
|------|----------|
| `serviceAccountKey.json` | inside the `backend/` folder |
| `.env` | root project folder |
| `.env` | inside the `frontend/` folder |

> If either file is missing, check with the person who shared the project with you rather than
> generating new ones — mixing a newly generated key with the rest of an existing `.env` can cause
> mismatched credentials.

---

## Phase 3 — Environment Variables (Already Configured)

Both `.env` files are already filled in and ready to use — there is nothing to copy from a
`.env.example` or fill in manually.

For reference, here is what each file contains:

### Backend `.env` (root folder)

```env
FLASK_ENV=development
FLASK_APP=run.py
SECRET_KEY=any-random-secret-string-here

DB_HOST=localhost
DB_PORT=3306
DB_NAME=tourmateai
DB_USER=root          # or whichever MySQL user you create locally
DB_PASSWORD=yourpassword

GEMINI_API_KEY=your_gemini_key_here
GOOGLE_MAPS_API_KEY=your_maps_key_here
OPENWEATHER_API_KEY=your_openweather_key_here

FIREBASE_CREDENTIALS=serviceAccountKey.json

CHROMA_DB_PATH=./chroma_db
EMBEDDING_MODEL=all-MiniLM-L6-v2

USE_MOCK_AI=True
```

> **Note:** `DB_PASSWORD` (and `DB_USER`, if you are not using root) still needs to match your own
> local MySQL setup from Phase 4 below — that part is specific to your machine, not shared.

### Frontend `.env` (inside `frontend/` folder)

```env
VITE_API_BASE_URL=http://localhost:5000/api

VITE_GOOGLE_MAPS_API_KEY=your_maps_key_here

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## Phase 4 — Database Setup & Restore (Importing Backup)

This project contains a database backup file with all the existing users, itineraries, and system data saved at `database/tourmateai_backup.sql`. Follow these steps to set it up:

### Step 1: Create the Database
Open MySQL (via terminal, command line, or MySQL Workbench) and run:

```sql
CREATE DATABASE tourmateai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

If you want a dedicated user instead of root (recommended):

```sql
CREATE USER 'tourmateai_user'@'localhost' IDENTIFIED BY 'tourmate_ai';
GRANT ALL PRIVILEGES ON tourmateai.* TO 'tourmateai_user'@'localhost';
FLUSH PRIVILEGES;
```

> **Note:** If you use a different user/password here, update the `DB_USER` and `DB_PASSWORD` in the backend `.env` file to match.

### Step 2: Import the Backup Database
Open a terminal in the **root project folder** and import the database backup:

* **Using Windows PowerShell (Default):**
  ```powershell
  cmd.exe /c "mysql -u tourmateai_user -ptourmate_ai tourmateai < database/tourmateai_backup.sql"
  ```
  *(If using root: `cmd.exe /c "mysql -u root -pyour_root_password tourmateai < database/tourmateai_backup.sql"`)*

* **Using Windows Command Prompt (CMD) or Linux/macOS Bash:**
  ```bash
  mysql -u tourmateai_user -ptourmate_ai tourmateai < database/tourmateai_backup.sql
  ```

* **Using XAMPP / phpMyAdmin / MySQL Workbench GUI:**
  1. Open phpMyAdmin (`http://localhost/phpmyadmin`) or MySQL Workbench.
  2. Click on the **tourmateai** database you created.
  3. Go to the **Import** tab.
  4. Choose the file: `database/tourmateai_backup.sql` inside the project directory.
  5. Click **Import / Go**.

> 💡 **Tip:** If you successfully import the backup database, **you do not need to run migrations or seed the database** in Phase 5 (you can skip `flask db upgrade` and `flask seed-db`).

---

## Phase 5 — Backend Setup (Python Flask)

Open a terminal in the **root project folder** and run the following commands in order:

```bash
# Step 1: Go to the backend folder
cd backend

# Step 2: Create a Python virtual environment
python -m venv venv

# Step 3: Activate the virtual environment
#   Windows (PowerShell):
venv\Scripts\Activate.ps1
#   Windows (Command Prompt):
venv\Scripts\activate.bat
#   Mac / Linux:
source venv/bin/activate

# You should now see (venv) at the start of your terminal prompt.

# Step 4: Install all Python packages
pip install -r requirements.txt
# This installs TensorFlow, PyTorch, ChromaDB, etc. — it can take several minutes.

# Step 5: Run database migrations (creates all tables)
# (Skip this step if you imported the backup database in Phase 4!)
flask db upgrade

# Step 6: Seed the database with initial data
# (Skip this step if you imported the backup database in Phase 4!)
flask seed-db

# Step 7: Start the backend server
python run.py
```

**Expected output:** `Running on http://127.0.0.1:5000`

> ⚠️ Keep this terminal open — the backend must stay running while you use the app.

---

## Phase 6 — Frontend Setup (React + Vite)

Open a **new terminal** in the **root project folder** and run:

```bash
# Step 1: Go to the frontend folder
cd frontend

# Step 2: Install all Node.js packages
npm install

# Step 3: Start the development server
npm run dev
```

**Expected output:**

```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser — the app should be running. 🎉

---

## Phase 7 — Final Verification Checklist

| Check | Command / Action | Expected Result |
|-------|-----------------|-----------------|
| Backend is running | Open `http://localhost:5000/api` in browser | JSON response (not an error page) |
| Frontend is running | Open `http://localhost:5173` in browser | TourMateAI UI loads |
| Database connected | Check backend terminal logs | No "connection refused" errors |
| Python packages installed | `pip list` (inside venv) | Shows Flask, SQLAlchemy, tensorflow, etc. |
| Node packages installed | `npm list --depth=0` (inside `frontend/`) | Shows react, vite, axios, firebase, etc. |

---

## 🔄 Running the Project Every Day After Setup

You will need **two terminals open** each time you work on the project.

**Terminal 1 — Backend:**

```bash
cd backend
venv\Scripts\Activate.ps1   # activate the virtual environment
python run.py                # start Flask
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev                  # start React
```

Then open **http://localhost:5173** in your browser.

---

## ❗ Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| `python` not found | Use `python3` instead, or reinstall Python with "Add to PATH" checked |
| `venv\Scripts\Activate.ps1` blocked | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell |
| `pip install` fails on tensorflow | Confirm you are using **Python 3.10.x** exactly |
| MySQL connection refused | Make sure the MySQL server is running (check XAMPP control panel or Windows Services) |
| Port 5000 already in use | Change the port in `run.py`, or find and stop the process using that port |
| Firebase credentials error | Confirm `serviceAccountKey.json` is inside the `backend/` folder |
