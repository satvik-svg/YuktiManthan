import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: No user session found' },
        { status: 401 }
      );
    }

    // Get user from our database
    const dbUser = await getUserByClerkId(userId);
    
    if (!dbUser) {
      return NextResponse.json({
        success: true,
        hasRole: false,
        role: null
      });
    }

    return NextResponse.json({
      success: true,
      hasRole: true,
      role: dbUser.role,
      userId,
      dbUserId: dbUser.id
    });

  } catch (error) {
    console.error('Get role error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to get user role'
      },
      { status: 500 }
    );
  }
}
