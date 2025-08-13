import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate required parameters
    const sellToken = searchParams.get('sellToken')
    const buyToken = searchParams.get('buyToken')
    const sellAmount = searchParams.get('sellAmount')
    const chainId = searchParams.get('chainId')
    
    // Validate token addresses
    if (sellToken && !sellToken.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Invalid sellToken address format' },
        { status: 400 }
      )
    }
    
    if (buyToken && !buyToken.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Invalid buyToken address format' },
        { status: 400 }
      )
    }
    
    if (!sellToken || !buyToken || !sellAmount || !chainId) {
      return NextResponse.json(
        { error: 'Missing required parameters: sellToken, buyToken, sellAmount, chainId' },
        { status: 400 }
      )
    }

    // Check if ZEROX_API_KEY is configured
    const apiKey = process.env.ZEROX_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: '0x API key not configured' },
        { status: 500 }
      )
    }

    // Build query parameters for 0x API
    const params = new URLSearchParams({
      sellToken,
      buyToken,
      sellAmount,
      chainId,
      affiliateFee: '0.1', // 0.1% affiliate fee
      ...(searchParams.get('taker') && { taker: searchParams.get('taker')! }),
    })

    // Debug logging (can be removed in production)
    console.log('0x API request params:', Object.fromEntries(params.entries()))

    // Fetch price from 0x API
    const res = await fetch(
      `https://api.0x.org/swap/allowance-holder/price?${params.toString()}`,
      {
        headers: {
          "0x-api-key": apiKey,
          "0x-version": "v2",
        },
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      console.error('0x API error:', res.status, errorText)
      return NextResponse.json(
        { error: `0x API error: ${res.status}`, details: errorText },
        { status: res.status }
      )
    }

    const data = await res.json()
    
    // Debug logging to see the actual response structure
    console.log('0x API Response:', JSON.stringify(data, null, 2))
    
    // Check if the response indicates no liquidity or other issues
    if (data.code && data.code !== 0) {
      console.error('0x API returned error code:', data.code, data.reason)
      return NextResponse.json(
        { error: `0x API error: ${data.reason || 'Unknown error'}`, code: data.code },
        { status: 400 }
      )
    }
    
    // Check if the response is empty or doesn't contain expected data
    if (!data || Object.keys(data).length === 0) {
      console.error('0x API returned empty response')
      return NextResponse.json(
        { error: 'No liquidity available for this token pair' },
        { status: 400 }
      )
    }
    
    // Check if we have the minimum required fields
    if (!data.price && !data.buyAmount) {
      console.error('0x API response missing required fields:', Object.keys(data))
      return NextResponse.json(
        { error: 'Insufficient liquidity for this token pair', details: 'No price data available' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Price API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
