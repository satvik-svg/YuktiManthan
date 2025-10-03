import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateExistingUsersAPI } from '@/lib/updateUsers';

/**
 * API endpoint to update existing users with empty email/name fields
 * This is a manual fix for users created before the Clerk integration was properly implemented
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (optional: add admin check here)
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    console.log('🔧 Starting bulk user data update...');
    
    const result = await updateExistingUsersAPI();
    
    if (result.success) {
      console.log('✅ Bulk user update completed:', result.data);
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      console.error('❌ Bulk user update failed:', result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          message: result.message
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Update users API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update existing users'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check how many users need updating
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    // Import supabase here to avoid circular imports
    const { supabase } = await import('@/lib/supabase');
    
    // Count users with empty email or name
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .or('email.is.null,name.is.null,email.eq.,name.eq.');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      usersNeedingUpdate: count || 0,
      message: count ? `${count} users need email/name updates` : 'All users have complete data'
    });

  } catch (error) {
    console.error('Check users API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
