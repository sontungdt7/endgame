#!/bin/bash

echo "🚀 ViralPost Mini App Local Testing Script"
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

# Start Next.js development server in background
echo "🌐 Starting Next.js development server..."
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Failed to start development server"
    kill $DEV_PID 2>/dev/null
    exit 1
fi

echo "✅ Development server running on http://localhost:3000"
echo ""

# Start ngrok tunnel
echo "🔗 Starting ngrok tunnel..."
ngrok http 3000 > /dev/null &
NGROK_PID=$!

# Wait for ngrok to start
echo "⏳ Waiting for ngrok to start..."
sleep 5

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)

if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" = "null" ]; then
    echo "❌ Failed to get ngrok URL"
    echo "Make sure ngrok is running and accessible"
    kill $DEV_PID $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ ngrok tunnel created: $NGROK_URL"
echo ""

# Update .env.local with ngrok URL
echo "📝 Updating .env.local with ngrok URL..."
sed -i "s|NEXT_PUBLIC_URL=.*|NEXT_PUBLIC_URL=$NGROK_URL|" .env.local

echo "✅ Environment updated with ngrok URL"
echo ""

echo "🎯 Next Steps:"
echo "1. Your app is now accessible at: $NGROK_URL"
echo "2. Test the Farcaster manifest: $NGROK_URL/.well-known/farcaster.json"
echo "3. Generate Farcaster credentials: npx create-onchain --manifest"
echo "4. Update .env.local with the generated credentials"
echo "5. Restart the development server to pick up changes"
echo ""
echo "🔍 Debug URLs:"
echo "- App: $NGROK_URL"
echo "- Manifest: $NGROK_URL/.well-known/farcaster.json"
echo "- Webhook: $NGROK_URL/api/webhook"
echo ""
echo "⏹️  To stop testing:"
echo "Press Ctrl+C to stop this script"
echo "Or run: kill $DEV_PID $NGROK_PID"

# Wait for user to stop
trap "echo ''; echo '🛑 Stopping services...'; kill $DEV_PID $NGROK_PID 2>/dev/null; echo '✅ Services stopped'; exit 0" INT

# Keep script running
wait
