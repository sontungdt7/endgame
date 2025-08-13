import { setApiKey } from "@zoralabs/coins-sdk";

// Set up your Zora API key before making any SDK requests
// Get your API key from: https://zora.co/developer-settings
export function initializeZoraCoins(apiKey: string) {
  setApiKey(apiKey);
}

// Export the SDK for use in components
export * from "@zoralabs/coins-sdk";


