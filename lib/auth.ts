import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import { createOrUpdateUser, getUserByClerkId } from './supabase';

export async function validateUserAndRole(requiredRole?: 'candidate' | 'company') {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized: No user session found');
  }

  // Get full user data from Clerk
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  
  // Extract email and name from Clerk user data
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
  
  // Get user from our database to check role
  let dbUser = await getUserByClerkId(userId);
  
  if (!dbUser) {
    // User doesn't exist in our database yet - check their Clerk metadata for role
    const metadataRole = clerkUser.publicMetadata?.role || clerkUser.unsafeMetadata?.role;
    
    // Use metadata role if available, otherwise default to candidate
    const roleToUse = (metadataRole === 'candidate' || metadataRole === 'company') 
      ? metadataRole 
      : 'candidate';
    
    console.log('Creating new user with role:', { 
      userId,
      metadataRole, 
      roleToUse,
      publicMetadata: clerkUser.publicMetadata,
      unsafeMetadata: clerkUser.unsafeMetadata 
    });
    
    dbUser = await createOrUpdateUser(
      userId,
      email,
      name,
      roleToUse as 'candidate' | 'company'
    );
  } else {
    // User exists but email/name might be empty - update them
    if (!dbUser.email || !dbUser.name) {
      dbUser = await createOrUpdateUser(
        userId,
        email,
        name,
        dbUser.role
      );
    }
  }

  const role = dbUser.role;

  console.log('Debug auth role:', { 
    userId, 
    role,
    email,
    name,
    dbUser: { id: dbUser.id, role: dbUser.role, email: dbUser.email, name: dbUser.name }
  });

  if (requiredRole && role !== requiredRole) {
    throw new Error(`Unauthorized: Required role '${requiredRole}' but user has role '${role}'`);
  }

  return {
    userId,
    dbUserId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: role as 'candidate' | 'company'
  };
}
