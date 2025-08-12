# Zora Coins SDK Integration

This project has been integrated with the [Zora Coins SDK](https://docs.zora.co/coins/sdk) to enable interaction with Zora Creator Coins and Post Coins.

## Setup

### 1. Environment Variables

Add your Zora API key to your `.env` file:

```env
NEXT_PUBLIC_ZORA_API_KEY=your_actual_api_key_here
```

**To get your API key:**
1. Log in or create an account on [Zora](https://zora.co)
2. Navigate to Developer Settings
3. Create an API key
4. Copy the key to your `.env` file

### 2. Dependencies

The following packages are installed:
- `@zoralabs/coins-sdk` - Zora Coins SDK
- `viem` - Required peer dependency for on-chain operations

## Usage

### Basic Setup

The SDK is automatically initialized when your app starts via the `ZoraProvider` component.

### Using the Hook

```tsx
import { useZoraCoins } from '@/hooks/use-zora-coins';

function MyComponent() {
  const { isInitialized, fetchCoin, fetchCoins } = useZoraCoins();

  const handleFetchCoin = async () => {
    const coin = await fetchCoin('0x...');
    console.log(coin);
  };

  if (!isInitialized) {
    return <div>SDK not initialized</div>;
  }

  return <button onClick={handleFetchCoin}>Fetch Coin</button>;
}
```

### Available Functions

- `fetchCoin(coinAddress)` - Get details for a specific coin
- `fetchCoins(params)` - Get a list of coins with filters
- `fetchProfile(profileAddress)` - Get profile information
- `fetchProfiles(params)` - Get a list of profiles

### Example Component

See `components/zora-coins-example.tsx` for a working example of how to use the SDK.

## Integration with Your App

The Zora Coins SDK is now integrated into your "Last Buyer Wins" gaming platform and can be used to:

1. **Fetch Post Coin Information** - Get details about Zora Creator Coins
2. **Query Coin Data** - Access coin metadata, prices, and trading information
3. **Profile Management** - Access creator profiles and coin collections
4. **Real-time Data** - Get up-to-date coin information for your games

## Next Steps

1. **Get your API key** from Zora Developer Settings
2. **Update your .env file** with the real API key
3. **Test the integration** using the example component
4. **Integrate into your game logic** to fetch real coin data

## Documentation

For more information, see the [official Zora Coins SDK documentation](https://docs.zora.co/coins/sdk).
