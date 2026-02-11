# Stock Portfolio Management System

A full-stack web application for managing stock portfolios with KYC verification, admin panel, and ML-powered stock predictions.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Python** (v3.8 or higher)
- **Node.js** (v14 or higher) and npm
- **MongoDB** (running locally or a cloud URI)

## 🚀 Quick Start Guide

### 1. Backend Setup (Flask)

The backend runs on Python and handles the API, database, and stock data processing.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment (optional but recommended):**
    ```bash
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # Mac/Linux
    source .venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    - Create a file named `.env` in the `backend` folder.
    - Copy the contents from `.env.example` into `.env`.
    - Update the values if needed (e.g., your MongoDB URI).

5.  **Run the Backend Server:**
    ```bash
    python app.py
    ```
    *The server will start at `http://localhost:5000`*

---

### 2. Frontend Setup (React)

The frontend is a React application utilizing Material UI.

1.  **Open a new terminal and navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install Node dependencies:**
    ```bash
    npm install
    ```

3.  **Start the React Development Server:**
    ```bash
    npm start
    ```
    *The application will open in your browser at `http://localhost:3000`*

---

## 🛠 Features
- **User Authentication**: Secure login/signup with JWT and KYC verification.
- **Portfolio Management**: Buy and sell stocks, view transaction history.
- **Admin Panel**: Approve/Reject KYC requests, view user queries.
- **Stock Predictions**: ML-powered predictions using Prophet.
- **Real-time Data**: Integration with Yahoo Finance for live stock data.

## 🔑 Default Admin Credentials
- **Email**: `admin@gmail.com`
- **Password**: `123456`

## 📦 Troubleshooting

- **MongoDB Error**: Ensure your MongoDB service is running locally (`mongod`).
- **Module Not Found**: Make sure you activated the virtual environment before running `pip install`.
- **Port Conflicts**: If port 3000 or 5000 is in use, the terminal will ask to assume a different port.
