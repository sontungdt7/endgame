# ViralPost Mini App Setup Guide for Base App

This guide will help you complete the setup of your ViralPost project as a Mini App on Base App.

## 🎯 What We've Accomplished

✅ Installed OnchainKit (includes MiniKit)  
✅ Created MiniKit provider wrapper  
✅ Updated app layout with MiniKit integration  
✅ Added MiniKit initialization to home page  
✅ Created Farcaster manifest route  
✅ Updated metadata for Farcaster frame support  
✅ Created required image placeholders  
✅ Updated environment variables  
✅ Created webhook API endpoint  

## 🚀 Next Steps to Complete Setup

### 1. Test Locally with ngrok (Recommended First Step)

Before deploying, test your Mini App locally using ngrok:

```bash
# Copy the local environment file
cp env.local.example .env.local

# Edit .env.local with your API keys
# - NEXT_PUBLIC_CDP_CLIENT_API_KEY (from Coinbase Developer Platform)
# - NEXT_PUBLIC_ZORA_API_KEY (from Zora)

# Start local testing
./scripts/simple-test.sh
```

**In a new terminal, start ngrok:**
```bash
ngrok http 3000
```

**Copy the ngrok URL and update .env.local:**
```env
NEXT_PUBLIC_URL=https://your-ngrok-url.ngrok.io
```

**Test your Mini App locally:**
- App: Your ngrok URL
- Manifest: `https://your-ngrok-url.ngrok.io/.well-known/farcaster.json`
- Webhook: `https://your-ngrok-url.ngrok.io/api/webhook`

### 2. Get Your Coinbase Developer Platform API Key

1. Go to [Coinbase Developer Platform](https://developer.coinbase.com/)
2. Sign up or sign in to your account
3. Create a new project
4. Get your API key from the project dashboard

### 2. Deploy Your App

Your app must be deployed to a public HTTPS domain. You can use:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- Any other hosting platform with HTTPS

### 3. Generate Farcaster Account Association

After testing locally or deploying, run this command:

```bash
npx create-onchain --manifest
```

**Important Steps:**
1. Connect your **Farcaster custody wallet** (not your regular wallet)
2. Add your URL (ngrok URL for local testing, or deployed URL)
3. Sign the manifest to generate association credentials
4. The CLI will update your local `.env` file

**To get your Farcaster custody wallet:**
- Open Farcaster
- Go to Settings → Advanced → Farcaster recovery phrase
- Import this wallet into MetaMask or another wallet

### 4. Update Environment Variables

Copy the generated values from the manifest command to your `.env.local` file (for local testing) or deployment platform:

```env
FARCASTER_HEADER=your_generated_header
FARCASTER_PAYLOAD=your_generated_payload  
FARCASTER_SIGNATURE=your_generated_signature
```

Also set these required variables:
```env
NEXT_PUBLIC_URL=https://your-ngrok-url.ngrok.io  # For local testing
# NEXT_PUBLIC_URL=https://your-deployed-domain.com  # For production
NEXT_PUBLIC_CDP_CLIENT_API_KEY=your_cdp_api_key
```

### 5. Replace Image Placeholders

Replace the placeholder files with actual images:

- **`/public/splash.png`** - 200x200px PNG (loading screen)
- **`/public/hero.png`** - 1200x628px PNG (featured placement)
- **`/public/og-image.png`** - 1200x630px PNG (social sharing)

### 6. Test Your Mini App

1. **Local Testing**: Test with ngrok before deploying
2. **Browser Testing**: Visit your deployed app in a regular browser
3. **Farcaster Testing**: Share your app URL in Farcaster
4. **Base App Testing**: Test in Base App when available

## 🔧 Configuration Details

### Mini App Category
Your app is configured as a **"games"** category app, which is perfect for your "Last Buyer Wins" gaming platform.

### Tags
Your app includes these tags for better discovery:
- `gaming`
- `defi` 
- `social`
- `viral`

### Frame Metadata
The Farcaster frame metadata enables your app to be launched directly from Farcaster posts and Base App.

## 🐛 Troubleshooting

### Common Issues

**"MiniKit not working"**
- Ensure `NEXT_PUBLIC_CDP_CLIENT_API_KEY` is set
- Check that your app is deployed with HTTPS

**"Manifest not found"**
- Verify `.well-known/farcaster.json` route is working
- Test by visiting `https://your-domain.com/.well-known/farcaster.json`

**"Images not loading"**
- Ensure all image files exist in `/public/`
- Check image URLs are accessible via HTTPS

### Debug Tools

Use these tools to validate your Mini App:
- [Farcaster Frame Validator](https://warpcast.com/~/developers/frames)
- [Base App Debug Tools](https://docs.base.org/base-app/miniapps/common-issues-debugging)

## 📱 Mini App Features

Once set up, your ViralPost Mini App will have:

- **Native Base App Integration**: Runs seamlessly within Base App
- **Wallet Integration**: Automatic wallet connectivity via MiniKit
- **Social Discovery**: Users can find your app in Base App
- **Viral Sharing**: Easy sharing and discovery in Farcaster
- **Mobile Optimization**: Automatically optimized for mobile devices

## 🎉 What Happens Next

After completing this setup:

1. **Your app becomes discoverable** in Base App
2. **Users can launch it directly** from Farcaster posts
3. **Automatic wallet integration** via MiniKit
4. **Mobile-optimized experience** in Base App
5. **Social sharing capabilities** for viral growth

## 📚 Additional Resources

- [Base App Mini Apps Documentation](https://docs.base.org/base-app/introduction/getting-started)
- [MiniKit Hooks Reference](https://docs.base.org/base-app/miniapps/minikit-overview)
- [OnchainKit Documentation](https://docs.onchainkit.com/)
- [Farcaster Mini Apps Guide](https://docs.farcaster.xyz/mini-apps)

## 🆘 Need Help?

If you encounter issues:
1. Check the [Base App debugging guide](https://docs.base.org/base-app/miniapps/common-issues-debugging)
2. Review your environment variables
3. Ensure all required images are uploaded
4. Verify your deployment is accessible via HTTPS

---

**Your ViralPost "Last Buyer Wins" gaming platform is now ready to become a viral Mini App on Base App! 🎮🚀**
