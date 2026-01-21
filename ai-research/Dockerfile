# Use official Python runtime as a parent image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for audio processing
# libsndfile1 -> for 'soundfile'
# ffmpeg -> for 'pydub' (handling m4a/mp3 conversion)
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
# No cache dir to keep image small
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5001

# Command to run the application using Gunicorn
# Timeout increased to 120s because AI inference can be slow
# Workers set to 1 to avoid running out of RAM with TensorFlow models
CMD ["gunicorn", "--workers", "1", "--timeout", "120", "--bind", "0.0.0.0:5001", "server:app"]
