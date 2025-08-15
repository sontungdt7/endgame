function withValidProperties(
  properties: Record<string, undefined | string | string[]>
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    })
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL;

  // Ensure URL doesn't end with a slash to prevent double slashes
  const baseUrl = URL?.endsWith('/') ? URL.slice(0, -1) : URL;

  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: withValidProperties({
      version: '1',
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'ViralPost',
      subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || 'Last Buyer Wins',
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A viral gaming platform where sponsors can attach USDC prize pools to social posts, creating "Last Buyer Wins" competitions that drive engagement and viral growth.',
      screenshotUrls: [],
      iconUrl: `${baseUrl}/icon.svg`,
      splashImageUrl: `${baseUrl}/splash.png`,
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#000000',
      homeUrl: baseUrl,
      webhookUrl: `${baseUrl}/api/webhook`,
      primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || 'games',
      tags: ['gaming', 'defi', 'social', 'viral'],
      heroImageUrl: `${baseUrl}/hero.png`,
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Gaming Platform',
      ogTitle: 'ViralPost',
      ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || 'A viral gaming platform where sponsors can attach USDC prize pools to social posts.',
      ogImageUrl: `${baseUrl}/og-image.png`,
      // use only while testing
      noindex: 'true',
    }),
  });
}
