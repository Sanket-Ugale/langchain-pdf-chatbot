# Chat Application with PDF Upload and LLM Integration

This project is an end-to-end chat application built with Flask that allows you to:

- Upload PDF Documents: Extract text from PDFs, split it into manageable chunks, and compute embeddings.
- Store & Retrieve Embeddings: Use Qdrant to store PDF embeddings and retrieve relevant chunks using LangChain.
- Chat with an LLM: Send a prompt along with the retrieved context to a local LLM API (e.g., mistral-7b) and receive a streaming, real-time response.
- Containerized Deployment: Easily run the application and its dependencies using Docker and Docker Compose.

## Project Structure

```
.
├── app.py               # Flask backend application
├── requirements.txt     # Python dependencies
├── Dockerfile           # Dockerfile for containerizing the Flask app
├── docker-compose.yml   # Docker Compose configuration for Flask and Qdrant services
├── templates
│   └── index.html       # HTML frontend for file upload and chat interface
└── static
    ├── style.css        # CSS for styling the frontend
    └── script.js        # JavaScript for handling file uploads and streaming chat responses
```

## Features

- **PDF Processing**: Upload a PDF, extract text, and split it into chunks.
- **Embedding & Storage**: Compute embeddings using HuggingFaceEmbeddings and store them in Qdrant.
- **Context-Aware Chat**: Retrieve relevant context from Qdrant to enhance user queries.
- **Real-Time Streaming**: Stream LLM responses directly to the chat interface.
- **Dockerized Setup**: Run the entire stack (Flask app and Qdrant) via Docker Compose.

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system.
- Internet connection for pulling Docker images.

### Installation and Setup

1. **Clone the Repository**:

```bash
git clone https://github.com/Sanket-Ugale/langchain-pdf-chatbot.git
cd langchain-pdf-chatbot
```

2. **Build and Start the Containers**:

```bash
docker-compose up --build
```

3. **Access the Application**:

Open your browser and navigate to http://localhost:5000.

## Usage

### Upload a PDF:

- Use the upload form on the main page to select and upload a PDF document.
- The backend extracts text, splits it into chunks, computes embeddings, and stores them in Qdrant.

### Chat Interface:

- Enter your question in the chat box.
- The application retrieves context from Qdrant, combines it with your query, and streams a response from your local LLM API.
- The response is displayed in real time on the chat interface.

## Configuration

### Environment Variables:
- `QDRANT_URL`: URL of the Qdrant service (default is http://qdrant:6333 in the Docker Compose network).
- `FLASK_ENV`: Set to development for development mode.

## Dependencies

- **Python Packages**: Flask, requests, langchain, PyPDF2, qdrant-client.
- **Docker Images**: Python (3.10-slim) for the Flask app and qdrant/qdrant for the vector database.

## Troubleshooting

- **Qdrant Connectivity**:
  Ensure Qdrant is running and accessible at the URL specified by `QDRANT_URL`.
  
- **LLM API Streaming**:
  Verify that your local LLM API (e.g., mistral-7b) is running at http://localhost:8080 and supports streaming responses.


