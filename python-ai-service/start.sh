#!/bin/bash

# SIH AI Service Startup Script
echo "🚀 Starting SIH AI Service..."

# Navigate to the Python service directory
cd "$(dirname "$0")"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade requirements
echo "📚 Installing/updating dependencies..."
pip install -r requirements.txt

# Download the SentenceTransformer model if not already cached
echo "🤖 Ensuring AI model is downloaded..."
python3 -c "
from sentence_transformers import SentenceTransformer
print('Loading model...')
model = SentenceTransformer('all-MiniLM-L6-v2')
print('Model loaded successfully!')
"

# Check if model loading was successful
if [ $? -eq 0 ]; then
    echo "✅ AI model ready!"
else
    echo "❌ Failed to load AI model. Please check your internet connection and try again."
    exit 1
fi

# Start the FastAPI server
echo "🌟 Starting FastAPI server on http://localhost:8000"
echo "📝 API documentation will be available at http://localhost:8000/docs"
echo "🔍 Health check available at http://localhost:8000/health"
echo ""
echo "To stop the server, press Ctrl+C"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
