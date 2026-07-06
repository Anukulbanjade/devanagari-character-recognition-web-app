# Devanagari Handwritten Character Recognition System (DHCRS)

A state-of-the-art Web application for segmenting, recognizing, and vocalizing handwritten Devanagari characters. This system utilizes a custom Convolutional Neural Network (CNN) trained on the Devanagari Handwritten Character Dataset, a Python/Flask REST API backend, and a modern, high-fidelity React frontend.

---

## 📺 Project Video Demonstration

Watch the system in action:

<div align="center">
  <a href="https://www.youtube.com/watch?v=jsNn9rQNuvs" target="_blank">
    <img src="https://img.youtube.com/vi/jsNn9rQNuvs/0.jpg" alt="Devanagari Recognition System Video Demo" width="600" style="border-radius: 10px;" />
  </a>
  <p><em>Click the image above to watch the project demonstration video on YouTube.</em></p>
</div>

---

## 🌟 Key Features

*   **Advanced OCR Preprocessing**: Automated removal of the *Dikka* (Devanagari horizontal header line), Otsu's thresholding, CLAHE contrast enhancement, and connected components-based segmentation.
*   **Multi-Character Segmentation**: Intelligently segments full handwritten words into individual characters, performs concurrent classification, and rebuilds the word.
*   **Nepali Text-to-Speech (TTS)**: Converts recognized Devanagari text into natural-sounding audio using `gTTS` with Nepali pronunciation support.
*   **Premium Web Dashboard**: A modern dashboard containing drag-and-drop file upload, real-time animated processing pipelines, result tables, copy-to-clipboard functionality, and profile management.
*   **User Management & Security**: Fully-featured signup, sign-in, JWT-based stateful authentication, and profile updates.
*   **History & Logging**: Saves processed images and stores prediction outputs and confidence scores under a PostgreSQL database schema.

---

## 📂 Project Structure

```directory
d:\Final Year Final Folder
├── backend/                    # Core Flask API Backend
│   ├── models/                 # Model files (devanagari.h5)
│   ├── uploads/                # Saved uploaded images for recognition
│   ├── audio/                  # Cached generated TTS MP3 files
│   ├── logs/                   # System runtime logs
│   ├── app.py                  # Primary Flask application (routing, segmentation, prediction)
│   ├── keygen.py               # Utility to generate cryptographic SECRET_KEY
│   ├── final.py                # Legacy single-character API backend
│   ├── dikaremov.py            # Development scripts for header line removal
│   ├── requirement.txt         # Backend Python dependencies
│   └── .env                    # Environment variables configuration
│
├── react-frontend/             # Modern React Single Page Application (SPA)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components (ImageUploader, Layout, PrivateRoute)
│   │   ├── pages/              # SPA Pages (Dashboard, Auth, Profile)
│   │   ├── utils/              # Helper utilities
│   │   ├── App.jsx             # Main Application routing definition
│   │   └── main.jsx            # React root entry point
│   ├── package.json            # Node.js dependencies & scripts
│   └── vite.config.js          # Vite configurations
│
├── Backend v1/                 # Model Training scripts and datasets
│   ├── Model.py                # CNN model training script
│   ├── devanagari.h5           # Trained weights file
│   └── data.csv                # Dataset features for training
│
├── Documentation/              # Project reports, front page, and printouts (PDF/DOCX)
└── Test Images/                # Sample test screenshots and images
```

---

## ⚙️ Preprocessing & Segmentation Pipeline

One of the highlights of this project is the custom image preprocessing workflow written in OpenCV (`cv2`) within [app.py](file:///d:/Final%20Year%20Final%20Folder/backend/app.py):

```mermaid
graph TD
    A[Raw Image Upload] --> B[Grayscale Resize to 150px height]
    B --> C[CLAHE Histogram Equalization]
    C --> D[Otsu Binarization & Inversion]
    D --> E[Dikka / Header Line Removal]
    E --> F[Connected Components Analysis]
    F --> G[Spatial Component Grouping & Merging]
    G --> H[Character Segment Extraction & Padding]
    H --> I["Inference Engine (32x32 CNN)"]
```

### Key Preprocessing Algorithms:
1.  **Dikka Removal (`remove_header_line`)**:
    Computes horizontal projection profiles (row-wise sum of pixels) across the upper half of the image. The row containing the maximum intensity corresponds to the *Dikka*. A mask removes this horizontal band to isolate character components.
2.  **Component Merging (`merge_components`)**:
    Extracts connected components and groups them horizontally. Nearby or overlapping components are merged to prevent isolated character strokes (like modifiers or parts of a letter) from being parsed as individual characters.

---

## 🧠 Model Architecture

The core CNN model is configured inside [Model.py](file:///d:/Final%20Year%20Final%20Folder/Backend%20v1/Model.py):

| Layer (type) | Output Shape | Parameters | Function |
| :--- | :--- | :--- | :--- |
| **Conv2D** | (None, 28, 28, 32) | 832 | 32 filters, 5x5 kernel, ReLU activation |
| **MaxPooling2D** | (None, 14, 14, 32) | 0 | 2x2 pool size, 2x2 stride |
| **Conv2D** | (None, 10, 10, 64) | 51,264 | 64 filters, 5x5 kernel, ReLU activation |
| **MaxPooling2D** | (None, 2, 2, 64) | 0 | 5x5 pool size, 5x5 stride |
| **Flatten** | (None, 256) | 0 | Flattens 2D arrays to 1D vector |
| **Dense (Output)** | (None, 37) | 9,509 | 37 classes, Softmax activation |

*   **Total Parameters**: 61,605 (All trainable)
*   **Loss Function**: Categorical Crossentropy
*   **Optimizer**: Adam
*   **Output Classes (37)**: Consonants क (ka) to ज्ञ (gya), plus a dedicated control class 'CHECK'.

---

## 🛢️ Database Schema

The system integrates a PostgreSQL database containing two relational tables:

```mermaid
erDiagram
    USERS {
        int id PK
        string first_name
        string last_name
        string username UNIQUE
        string email UNIQUE
        date date_of_birth
        string password
        datetime created_at
    }
    PREDICTIONS {
        int id PK
        int user_id FK
        string filename
        string prediction
        float confidence
        datetime created_at
    }
    USERS ||--o{ PREDICTIONS : "owns"
```

---

## 🚀 Setup & Installation

### Prerequisite Software
*   Python 3.10 (Required)
*   Node.js (v18+)
*   PostgreSQL

---

### 1. Backend Configuration
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and configure your `.env` file based on the environment structure:
   ```env
   SECRET_KEY=your_generated_hex_key
   DATABASE_URL=postgresql://postgres:password@localhost:5432/final_year_project
   FLASK_ENV=development
   JWT_EXPIRATION_HOURS=24
   UPLOAD_FOLDER=uploads
   MODEL_PATH=models/devanagari.h5
   ```
3. Install required Python modules:
   ```bash
   pip install -r requirement.txt
   ```
4. Run the backend Flask server:
   ```bash
   python app.py
   ```

---

### 2. Frontend Configuration
1. Navigate to the `react-frontend/` directory:
   ```bash
   cd ../react-frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot the development web server:
   ```bash
   npm run dev
   ```
4. Access the frontend locally at `http://localhost:5173` (or the port specified by Vite).

---



## 📡 API Endpoints

All secure endpoints require the `Authorization` header with a valid Bearer Token: `Bearer <JWT_TOKEN>`.

### Authentication Endpoints

#### `POST /api/signup`
Creates a new user profile.
*   **Request Body**:
    ```json
    {
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "email": "johndoe@example.com",
      "password": "strongpassword123",
      "date_of_birth": "2000-01-01"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "status": "success",
      "message": "User created successfully",
      "data": { ... }
    }
    ```

#### `POST /api/signin`
Logs in user and yields a JWT Token.
*   **Request Body**:
    ```json
    {
      "email": "johndoe@example.com",
      "password": "strongpassword123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "token": "eyJhbGciOi...",
        "user": { ... }
      }
    }
    ```

---

### Core Recognition Endpoints

#### `POST /api/predict` (Protected)
Uploads an image containing handwritten Devanagari characters, processes it, and returns the prediction text.
*   **Request Format**: `multipart/form-data`
*   **Parameters**:
    *   `image`: File (PNG, JPG, or JPEG)
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "text": "कखग",
        "characters": [
          { "id": 1, "character": "क", "confidence": 0.98 },
          { "id": 2, "character": "ख", "confidence": 0.95 },
          { "id": 3, "character": "ग", "confidence": 0.91 }
        ]
      }
    }
    ```

#### `POST /api/generate-audio` (Protected)
Generates and returns an audio file (.mp3) pronouncing the recognized Devanagari text.
*   **Request Body**:
    ```json
    {
      "text": "कखग"
    }
    ```
*   **Response**: Audio Stream (MIME: `audio/mpeg`)

---

### User Profile Endpoints

#### `GET /api/user/profile` (Protected)
Retrieves current user details.

#### `PUT /api/user/profile` (Protected)
Updates user information (allows updates to `first_name`, `last_name`, and `date_of_birth`).
