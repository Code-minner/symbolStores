// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Safely extracts error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, action } = body;

    // Check for your revalidation secret
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    // Clear different paths based on action
    switch (action) {
      case 'products':
        // Clear main shop page
        revalidatePath('/shop');
        // Clear category pages if you have them
        revalidatePath('/shop/[category]', 'page');
        // Clear any other product-related pages
        revalidatePath('/');
        break;
      case 'all':
        // Clear everything
        revalidatePath('/', 'layout');
        break;
      default:
        revalidatePath('/shop');
    }

    return NextResponse.json({ 
      revalidated: true, 
      action,
      timestamp: new Date().toISOString(),
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    const errorMessage = getErrorMessage(error);
    return NextResponse.json(
      { message: 'Revalidation failed', error: errorMessage }, 
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const action = request.nextUrl.searchParams.get('action') || 'products';

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    revalidatePath('/shop');
    revalidatePath('/shop/[category]', 'page');
    revalidatePath('/');

    return NextResponse.json({ 
      revalidated: true, 
      action,
      timestamp: new Date().toISOString(),
      message: 'Cache cleared via GET'
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    return NextResponse.json(
      { message: 'Revalidation failed', error: errorMessage }, 
      { status: 500 }
    );
  }
}