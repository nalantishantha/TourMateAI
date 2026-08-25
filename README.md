# TourMateAI 🌴

*An Intelligent AI-Based Travel Companion for Sri Lanka.*

TourMateAI is a comprehensive web application designed to give tourists personalized, context-aware travel assistance. It leverages advanced AI capabilities to provide recommendations based on location, weather, and time, alongside a conversational RAG chatbot, a multi-agent itinerary planner, and landmark image recognition.

> **Note:** University final project — CIS6035, Cardiff Metropolitan / ICBT. Academic MVP, free-tier tooling.

---

## 🌟 Features

- **Personalized Recommendations**: Content-based recommendation engine (scikit-learn) that suggests attractions and hotels based on user preferences, current weather, and location.
- **AI RAG Chatbot**: Powered by Google Gemini and ChromaDB to answer your travel queries with context-aware responses.
- **Multi-Agent Itinerary Planner**: Uses LangGraph to automatically generate optimal travel plans and schedules.
- **Landmark Image Recognition**: Upload a photo of a Sri Lankan landmark, and our custom TensorFlow/Keras CNN will identify it.
- **Multi-Language Support**: Fully internationalized frontend (i18next) with real-time translations via deep-translator on the backend.
- **Interactive Maps & Weather**: Integration with Google Maps and OpenWeather APIs.

## 🏗️ Architecture

TourMateAI uses a modern three-tier architecture:

1. **Presentation (Frontend)**: React SPA built with Vite.
2. **Application (Backend)**: Python Flask modular monolith. AI features live inside a self-contained package (`backend/app/ai/`).
3. **Data**: MySQL database managed via SQLAlchemy models and Alembic migrations.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS (Responsive Design)
- **Internationalization**: i18next, react-i18next
- **PDF Generation**: html2pdf.js
- **Routing**: react-router-dom

### Backend
- **Framework**: Python Flask
- **ORM**: SQLAlchemy + Flask-Migrate
- **Authentication**: Firebase Admin SDK
- **External APIs**: Google Maps, OpenWeather, Requests

### AI & Machine Learning
- **Recommendation Engine**: scikit-learn, pandas, numpy (Content-based, cosine similarity)
- **RAG Chatbot**: Google Gemini (`google-generativeai`), ChromaDB, sentence-transformers
- **Itinerary Planner**: LangGraph, LangChain
- **Image Recognition**: TensorFlow, Keras, Pillow

---

## 🚀 Getting Started

Follow this step-by-step guide to clone the repository and run TourMateAI on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Python 3.10+](https://www.python.org/downloads/)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)
- API Keys: Google Gemini, Google Maps, OpenWeather, and Firebase credentials.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/TourMateAI.git
cd TourMateAI
```

### 2. Setup the Database
1. Open your MySQL client or terminal.
2. Create a new database for the project:
   ```sql
   CREATE DATABASE tourmateai_db;
   ```

### 3. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure the environment variables:
   - Copy the `.env.example` file to `.env` (or create a new `.env` file in the `backend` folder).
   - Add your database connection string and API keys:
     ```env
     SECRET_KEY=your_flask_secret_key
     DATABASE_URL=mysql+pymysql://username:password@localhost/tourmateai_db
     GEMINI_API_KEY=your_gemini_api_key
     GOOGLE_MAPS_API_KEY=your_google_maps_api_key
     OPENWEATHER_API_KEY=your_openweather_api_key
     FIREBASE_CREDENTIALS=path/to/your/firebase-adminsdk.json
     ```
5. Run database migrations and seed the initial data:
   ```bash
   flask db upgrade
   flask seed-db
   ```

### 4. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Configure the frontend environment variables:
   - Create a `.env` file in the `frontend` folder and add your Firebase configuration and backend URL:
     ```env
     VITE_API_BASE_URL=http://localhost:5000/api
     VITE_FIREBASE_API_KEY=your_firebase_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_firebase_app_id
     ```

### 5. Run the Application
1. Start the Flask backend (ensure your virtual environment is activated):
   ```bash
   # From the backend directory
   python run.py
   # Or alternatively: flask run --host=0.0.0.0 --port=5000
   ```
2. Start the Vite frontend development server:
   ```bash
   # From the frontend directory
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`. 

Enjoy using TourMateAI! 🌴
