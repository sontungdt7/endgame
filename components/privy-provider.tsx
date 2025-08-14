'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { base } from 'wagmi/chains';

interface PrivyProviderWrapperProps {
  children: React.ReactNode;
}

export function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!appId) {
    console.error('NEXT_PUBLIC_PRIVY_APP_ID is not set in environment variables');
    return (
      <div className="p-4 bg-red-900 text-white rounded">
        <h3 className="font-bold">Privy Configuration Error</h3>
        <p>NEXT_PUBLIC_PRIVY_APP_ID is not set</p>
        <p className="text-sm mt-2">Please check your .env file and restart the development server</p>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#22c55e'
        },
        supportedChains: [base]
      }}
    >
      {children}
    </PrivyProvider>
  );
}
