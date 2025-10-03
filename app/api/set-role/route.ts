import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createOrUpdateUser } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: No user session found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['candidate', 'company'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "candidate" or "company"' },
        { status: 400 }
      );
    }

    // Get full user data from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    // Extract email and name from Clerk user data
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();

    // Update user role in our database
    const dbUser = await createOrUpdateUser(
      userId,
      email,
      name,
      role as 'candidate' | 'company'
    );

    // Also update Clerk metadata to keep it in sync
    try {
      await client.users.updateUser(userId, {
        publicMetadata: {
          role: role
        }
      });
      console.log(`✅ Clerk metadata updated: ${userId} -> ${role}`);
    } catch (metadataError) {
      console.error('Warning: Failed to update Clerk metadata:', metadataError);
      // Don't fail the request for this
    }

    console.log(`✅ User role updated: ${userId} -> ${role}, email: ${email}, name: ${name}`);

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      userId,
      role,
      email,
      name,
      dbUserId: dbUser.id
    });

  } catch (error) {
    console.error('Set role error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to set user role'
      },
      { status: 500 }
    );
  }
}
