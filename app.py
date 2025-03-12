from flask import Flask, request, Response, render_template, jsonify
import os
import json
import requests
from werkzeug.utils import secure_filename
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Qdrant
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
UPLOAD_FOLDER = './uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Qdrant configuration
FLASK_ENV = os.getenv("FLASK_ENV")
LLM_API_URL = os.getenv("LLM_API_URL")
QDRANT_URL = os.getenv("QDRANT_URL")
vectorstore = None  # Global variable to hold our Qdrant vector store

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_pdf():
    file = request.files.get('pdf')
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    # Load and process PDF
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    # Split PDF text into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.split_documents(documents)

    # Compute embeddings and store in Qdrant using HuggingFaceEmbeddings
    # (This avoids needing an API key.)
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    global vectorstore
    vectorstore = Qdrant.from_documents(docs, embeddings, url=QDRANT_URL, collection_name=COLLECTION_NAME)

    return jsonify({"message": "PDF processed and data stored in vector database"}), 200

def stream_llm_response(prompt):
    # Retrieve context from Qdrant if available
    context = ""
    if vectorstore is not None:
        results = vectorstore.similarity_search(prompt, k=3)
        context = "\n\n".join([doc.page_content for doc in results])
    pre_prompt = "Answer the following question based on the context provided dont answer any other quetion which are not in the context simply deny them"
    full_prompt = f"NOTE [follow this note to answer any question]: {pre_prompt} Context:\n{context}\n\nQuestion: {prompt}"
    payload = {
        "model": "mistral-7b-instruct-v0.3",
        "messages": [
            {"role": "user", "content": full_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": -1,
        "stream": True
    }

    # Call the local LLM API with streaming enabled
    response = requests.post(LLM_API_URL, json=payload, stream=True)

    # Process each streamed line: extract only the "content" field and yield it.
    for line in response.iter_lines(decode_unicode=True):
        if line:
            if line.startswith("data: "):
                line = line[6:]
            try:
                data_json = json.loads(line)
                choices = data_json.get("choices", [])
                if choices:
                    delta = choices[0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield content
            except Exception as e:
                continue

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    prompt = data.get("prompt", "")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    return Response(stream_llm_response(prompt), mimetype="text/event-stream")

if __name__ == '__main__':
    app.run(debug=os.getenv("DEBUG"), port=os.getenv("PORT"))
