#!/bin/bash

echo "🚀 ViralPost Mini App Simple Local Testing"
echo "=========================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please copy env.local.example to .env.local and update with your values:"
    echo "cp env.local.example .env.local"
    echo ""
    echo "Required values:"
    echo "- NEXT_PUBLIC_CDP_CLIENT_API_KEY (from Coinbase Developer Platform)"
    echo "- NEXT_PUBLIC_ZORA_API_KEY (from Zora)"
    echo ""
    exit 1
fi

echo "✅ .env.local found"
echo ""

# Start Next.js development server
echo "🌐 Starting Next.js development server..."
echo "Your app will be available at http://localhost:3000"
echo ""

# Start ngrok in a new terminal
echo "🔗 To start ngrok tunnel, open a new terminal and run:"
echo "ngrok http 3000"
echo ""
echo "Then copy the ngrok URL and update your .env.local:"
echo "NEXT_PUBLIC_URL=https://your-ngrok-url.ngrok.io"
echo ""

# Start the dev server
npm run dev
