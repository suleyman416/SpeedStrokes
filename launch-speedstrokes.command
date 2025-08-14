#!/bin/bash

# SpeedStrokes Launcher
echo "🚀 Launching SpeedStrokes..."

# Navigate to the SpeedStrokes directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Starting SpeedStrokes server..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Opening SpeedStrokes in your browser..."
npm run dev

echo "✅ SpeedStrokes is now running!"
