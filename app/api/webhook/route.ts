import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log webhook data for debugging
    console.log('Webhook received:', body);
    
    // Handle different webhook events here
    // For now, just acknowledge receipt
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid webhook data' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
