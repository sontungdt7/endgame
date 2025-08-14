# Quick Fix: Zora API Key Setup

## The Problem
Your coin descriptions are showing mock data instead of real data from Zora because the `NEXT_PUBLIC_ZORA_API_KEY` environment variable is not configured.

## Quick Solution

### 1. Create Environment File
Create a `.env.local` file in your project root:

```bash
touch .env.local
```

### 2. Add Your Zora API Key
Add this line to `.env.local`:

```env
NEXT_PUBLIC_ZORA_API_KEY=your_actual_zora_api_key_here
```

### 3. Get Your API Key
1. Go to [Zora Developer Settings](https://zora.co/developer)
2. Create a new API key
3. Copy the key and replace `your_actual_zora_api_key_here` in your `.env.local` file

### 4. Restart Your Development Server
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

## What This Fixes
- ✅ Real coin descriptions from Zora API
- ✅ Real coin names and symbols
- ✅ Real coin images and metadata
- ✅ No more mock data fallbacks

## Verification
After setting up the API key, you should see:
- Console log: "✅ Zora service initialized successfully with API key"
- Real coin descriptions instead of "Description not available..."
- Real coin names and metadata

## Troubleshooting
If you still see issues:
1. Check that `.env.local` is in your project root (same level as `package.json`)
2. Verify the API key is correct
3. Restart your dev server
4. Check browser console for any error messages

## More Details
See `docs/ZORA_COINS_SETUP.md` for comprehensive setup instructions.
