# 🧪 Local Testing Guide for ViralPost Mini App

Test your Mini App locally before deploying to production!

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy the local environment file
cp env.local.example .env.local

# Edit .env.local with your API keys
nano .env.local  # or use your preferred editor
```

**Required values in `.env.local`:**
- `NEXT_PUBLIC_CDP_CLIENT_API_KEY` - From [Coinbase Developer Platform](https://developer.coinbase.com/)
- `NEXT_PUBLIC_ZORA_API_KEY` - From [Zora Developer Settings](https://zora.co/developer-settings)

### 2. Start Local Development

```bash
# Option A: Use the simple test script
./scripts/simple-test.sh

# Option B: Start manually
npm run dev
```

### 3. Start ngrok Tunnel

**In a new terminal:**
```bash
ngrok http 3000
```

**Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

### 4. Update Environment with ngrok URL

Edit `.env.local`:
```env
NEXT_PUBLIC_URL=https://abc123.ngrok.io
```

### 5. Restart Development Server

Stop the dev server (Ctrl+C) and restart:
```bash
npm run dev
```

## 🔍 Test Your Mini App

### Test URLs
- **App**: `https://your-ngrok-url.ngrok.io`
- **Manifest**: `https://your-ngrok-url.ngrok.io/.well-known/farcaster.json`
- **Webhook**: `https://your-ngrok-url.ngrok.io/api/webhook`

### Expected Results
- **App**: Should load your ViralPost gaming platform
- **Manifest**: Should return JSON with your Mini App configuration
- **Webhook**: Should return a success message

## 🎯 Generate Farcaster Credentials

Once your local app is working:

```bash
npx create-onchain --manifest
```

**Steps:**
1. Connect your **Farcaster custody wallet**
2. Enter your ngrok URL
3. Sign the manifest
4. Copy generated credentials to `.env.local`

## 🐛 Troubleshooting

### "MiniKit not working"
- Check `NEXT_PUBLIC_CDP_CLIENT_API_KEY` is set
- Ensure ngrok URL is HTTPS

### "Manifest not found"
- Verify `.well-known/farcaster.json` route exists
- Check ngrok is running and accessible

### "Images not loading"
- Ensure image files exist in `/public/`
- Check image URLs are accessible via ngrok

### ngrok Issues
- Make sure ngrok is installed: `npm install -g ngrok`
- Check if port 3000 is available
- Try different ports if needed: `ngrok http 3001`

## 📱 Next Steps

After successful local testing:

1. **Deploy to production** (Vercel, Netlify, etc.)
2. **Update environment variables** with production URL
3. **Generate production Farcaster credentials**
4. **Test in Base App** when available

## 🎉 Success Indicators

✅ App loads at ngrok URL  
✅ Manifest returns valid JSON  
✅ Webhook endpoint responds  
✅ MiniKit initializes without errors  
✅ Farcaster credentials generated  

---

**Your Mini App is ready for Base App integration! 🚀**
