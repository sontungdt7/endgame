import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate required parameters
    const sellToken = searchParams.get('sellToken')
    const buyToken = searchParams.get('buyToken')
    const sellAmount = searchParams.get('sellAmount')
    const chainId = searchParams.get('chainId')
    
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

    // Fetch quote from 0x API
    const res = await fetch(
      `https://api.0x.org/swap/allowance-holder/quote?${params.toString()}`,
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
        { error: `0x API error: ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Quote API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
