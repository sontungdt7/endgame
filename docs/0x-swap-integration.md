# 0x Swap API Integration

This project integrates with the 0x Swap API to provide real-time token swap pricing and quotes for the game detail page.

## Overview

The 0x Swap API integration allows users to see live pricing information when they enter buy or sell amounts in the game detail page. This provides transparency about the expected token amounts they'll receive and helps users make informed decisions.

## Features

- **Real-time Price Quotes**: Fetches live pricing from 0x API when users input amounts
- **Buy/Sell Support**: Shows pricing for both buying PostCoin with USDC and selling PostCoin for USDC
- **Price Impact Analysis**: Displays price impact percentage to help users understand slippage
- **Liquidity Source Information**: Shows which DEXs and aggregators are providing liquidity
- **Gas Estimation**: Provides estimated gas costs for transactions
- **USD Value Display**: Shows total transaction value in USD

## API Endpoints

### Price API (`/api/swap/price`)
- **Purpose**: Get indicative pricing for token swaps
- **Method**: GET
- **Parameters**:
  - `sellToken`: Address of token being sold
  - `buyToken`: Address of token being bought
  - `sellAmount`: Amount of tokens to sell (in wei)
  - `chainId`: Blockchain network ID (8453 for Base)
  - `taker`: (Optional) User's wallet address for affiliate tracking

### Quote API (`/api/swap/quote`)
- **Purpose**: Get firm quotes for token swaps (includes transaction data)
- **Method**: GET
- **Parameters**: Same as Price API
- **Returns**: Includes transaction data for execution

## Token Configuration

### Base Network (Chain ID: 8453)
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)
- **PostCoin**: Dynamic based on game (18 decimals)
- **WETH**: `0x4200000000000000000000000000000000000006` (18 decimals)

## Environment Setup

1. Get your 0x API key from [0x Dashboard](https://dashboard.0x.org/)
2. Add to your `.env` file:
   ```bash
   ZEROX_API_KEY=your_actual_api_key_here
   ```

## Usage in Components

### Hook Usage
```typescript
import { use0xSwapPrice } from '@/hooks/use-0x-swap'

const buySwapPrice = use0xSwapPrice({
  sellToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
  buyToken: game?.postCoin || "",
  sellAmount: buyAmount ? parseUnits(buyAmount, 6).toString() : "",
  chainId: "8453",
  enabled: !!buyAmount && parseFloat(buyAmount) > 0 && !!game?.postCoin,
})
```

### Component Usage
```typescript
import { SwapPriceDisplay } from '@/components/swap-price-display'

<SwapPriceDisplay
  price={buySwapPrice.price}
  loading={buySwapPrice.loading}
  error={buySwapPrice.error}
  sellTokenSymbol="USDC"
  buyTokenSymbol={game.symbol || "POST"}
  sellAmount={buyAmount}
/>
```

## Price Display Information

The `SwapPriceDisplay` component shows:

1. **Swap Rate**: 1 USDC = X PostCoin
2. **You'll Receive**: Expected PostCoin amount
3. **Price Impact**: Slippage percentage (color-coded)
4. **Total Value (USD)**: Transaction value in USD
5. **Estimated Gas**: Gas cost estimation
6. **Liquidity Sources**: DEXs providing liquidity

## Error Handling

- **API Key Missing**: Shows error if `ZEROX_API_KEY` is not configured
- **Invalid Parameters**: Validates required parameters before API calls
- **Network Errors**: Handles 0x API errors gracefully
- **User Feedback**: Loading states and error messages for better UX

## Rate Limiting

The 0x API has rate limits based on your plan:
- **Free Tier**: 100 requests/minute
- **Paid Plans**: Higher limits based on subscription

## Security Considerations

- API key is stored server-side only
- User wallet addresses are included for affiliate tracking
- No sensitive data is exposed to the client
- Input validation prevents parameter injection

## Future Enhancements

- **Quote Execution**: Integrate with 0x Swap API for actual token swaps
- **Price History**: Show price charts over time
- **Multi-token Support**: Support for additional tokens beyond USDC/PostCoin
- **Advanced Routing**: Optimize for best execution paths
- **MEV Protection**: Integrate with MEV protection services

## Troubleshooting

### Common Issues

1. **"0x API key not configured"**
   - Ensure `ZEROX_API_KEY` is set in your `.env` file
   - Restart your development server

2. **"Missing required parameters"**
   - Check that all required parameters are being passed
   - Verify token addresses are correct for Base network

3. **"0x API error: 429"**
   - You've hit the rate limit
   - Wait before making more requests or upgrade your plan

4. **Price not updating**
   - Check that the `enabled` flag is set correctly
   - Verify the amount input is valid and greater than 0

### Debug Mode

Enable debug logging by checking the browser console for:
- API request/response details
- Error messages from 0x API
- Hook state changes

## Support

For issues with the 0x API integration:
1. Check the [0x API Documentation](https://docs.0x.org/)
2. Verify your API key is valid and has sufficient permissions
3. Check the [0x Status Page](https://status.0x.org/) for service issues
4. Review the browser console for detailed error messages
