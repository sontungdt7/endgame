# ViralPost - Last Buyer Wins Gaming Platform

A viral gaming platform where sponsors can attach USDC prize pools to social posts, creating "Last Buyer Wins" competitions that drive engagement and viral growth.

## Features

- **Game Discovery**: Browse active and ended games with real-time updates from The Graph
- **Real Post Data**: Uses Zora SDK to fetch actual post titles and images from postCoin addresses
- **Trading Interface**: Professional trading-style UI for game participation
- **Wallet Integration**: Connect Web3 wallets to participate in games
- **Game Creation**: Sponsors can create new games with USDC prize pools
- **Prize Claims**: Winners can claim USDC prizes directly

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Web3**: wagmi for wallet connectivity
- **Data**: The Graph for blockchain events, Zora SDK for post metadata
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Zora API key (for post data)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/viralpost-fun-redesign.git
cd viralpost-fun-redesign
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Configure environment variables:
   - Copy `env.example` to `.env.local`
   - Add your Zora API key (get it from [Zora Developer Settings](https://zora.co/developer-settings))

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Zora API Configuration (required for post data)
NEXT_PUBLIC_ZORA_API_KEY=your_actual_api_key_here

# Optional: Override GraphQL endpoint
# NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.studio.thegraph.com/query/88583/viralpost/0.0.1
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── create/            # Game creation page
│   ├── game/[id]/         # Game detail pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── bullrun-card.tsx  # Game card component
│   ├── header.tsx        # Navigation header
│   └── wallet-provider.tsx # Web3 wallet setup
├── hooks/                 # Custom React hooks
│   └── useGames.ts       # Hook for fetching game data
├── lib/                   # Utility functions and services
│   ├── graphql.ts        # GraphQL client and queries
│   ├── zora-service.ts   # Zora SDK integration (self-initializing)
│   └── utils.ts          # Utility functions
└── abis/                 # Smart contract ABIs
    └── BullRun.json      # BullRun contract ABI
```

## Data Sources

### The Graph Integration
- **Endpoint**: `https://api.studio.thegraph.com/query/88583/viralpost/0.0.1`
- **Events**: Fetches `gameCreateds` events to populate game cards
- **Real-time**: Updates automatically as new games are created

### Zora SDK Integration
- **Purpose**: Fetches real post titles and images from postCoin addresses
- **Self-initializing**: Automatically sets up when API key is available
- **Fallback**: Uses mock data if Zora data is unavailable
- **API Key**: Required for full functionality

## Key Pages

- **Home (`/`)**: Browse active and ended games with real blockchain data
- **Game Detail (`/game/[id]`)**: View game details and participate
- **Create Game (`/create`)**: Create new games (sponsors only)

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Data Flow

1. **GraphQL Query**: Fetches `gameCreateds` events from The Graph
2. **Zora Integration**: For each game, fetches post metadata using postCoin address
3. **Data Transformation**: Combines blockchain data with post metadata
4. **UI Rendering**: Displays real data in game cards with fallback mock data

### Troubleshooting

- **No games showing**: Check GraphQL endpoint and network connectivity
- **Missing post data**: Verify Zora API key configuration
- **Loading issues**: Check browser console for error messages

## How It Works

The integration is designed to be simple and self-contained:

1. **No manual initialization needed** - Zora service automatically sets up when the API key is available
2. **Graceful fallbacks** - If any service fails, the app continues to work with mock data
3. **Real-time updates** - Game data automatically refreshes from the blockchain
4. **Smart caching** - Zora data is fetched on-demand for each game
