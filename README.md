# ViralPost - Last Buyer Wins Gaming Platform

A viral gaming platform where sponsors can attach USDC prize pools to social posts, creating "Last Buyer Wins" competitions that drive engagement and viral growth.

## Features

- **Game Discovery**: Browse active and ended games with real-time updates
- **Trading Interface**: Professional trading-style UI for game participation
- **Wallet Integration**: Connect Web3 wallets to participate in games
- **Game Creation**: Sponsors can create new games with USDC prize pools
- **Prize Claims**: Winners can claim USDC prizes directly

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Web3**: wagmi for wallet connectivity
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/viralpost-fun-redesign.git
cd viralpost-fun-redesign
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Add your environment variables here
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
\`\`\`

## Project Structure

\`\`\`
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
└── lib/                  # Utility functions
\`\`\`

## Key Pages

- **Home (`/`)**: Browse active and ended games
- **Game Detail (`/game/[id]`)**: View game details and participate
- **Create Game (`/create`)**: Create new games (sponsors only)

## Development

### Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

## Deployment

This project is automatically deployed on Vercel. Any changes pushed to the main branch will trigger a new deployment.

**Live Demo**: [https://vercel.com/sontungdt7s-projects/v0-viral-post-fun-redesign](https://vercel.com/sontungdt7s-projects/v0-viral-post-fun-redesign)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
