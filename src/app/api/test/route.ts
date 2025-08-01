// src/app/api/test/route.ts - Create this to test basic API functionality
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'POST request received',
      data: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to parse JSON',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}