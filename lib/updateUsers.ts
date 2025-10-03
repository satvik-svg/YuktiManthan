import { clerkClient } from '@clerk/nextjs/server';
import { supabase } from './supabase';

/**
 * Updates existing users in the database with their email and name from Clerk
 * This fixes the issue where users created before the fix have empty email/name fields
 */
export async function updateUsersWithClerkData() {
  try {
    // Get all users with empty email or name
    const { data: usersWithEmptyData, error } = await supabase
      .from('users')
      .select('*')
      .or('email.is.null,name.is.null,email.eq.,name.eq.');

    if (error) {
      console.error('Error fetching users with empty data:', error);
      return { success: false, error: error.message };
    }

    if (!usersWithEmptyData || usersWithEmptyData.length === 0) {
      console.log('No users with empty email/name found');
      return { success: true, updated: 0, message: 'No users to update' };
    }

    const client = await clerkClient();
    let updatedCount = 0;
    const errors: string[] = [];

    for (const user of usersWithEmptyData) {
      try {
        // Get user data from Clerk
        const clerkUser = await client.users.getUser(user.clerk_user_id);
        
        // Extract email and name
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();

        // Only update if we have new data
        if (email || name) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              email: email || user.email,
              name: name || user.name,
            })
            .eq('id', user.id);

          if (updateError) {
            console.error(`Error updating user ${user.id}:`, updateError);
            errors.push(`User ${user.id}: ${updateError.message}`);
          } else {
            updatedCount++;
            console.log(`✅ Updated user ${user.id} with email: ${email}, name: ${name}`);
          }
        }
      } catch (clerkError) {
        console.error(`Error fetching Clerk data for user ${user.clerk_user_id}:`, clerkError);
        errors.push(`Clerk data for ${user.clerk_user_id}: ${clerkError}`);
      }
    }

    return {
      success: true,
      updated: updatedCount,
      total: usersWithEmptyData.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Updated ${updatedCount} out of ${usersWithEmptyData.length} users`
    };

  } catch (error) {
    console.error('Error in updateUsersWithClerkData:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * API endpoint function to manually trigger the update
 */
export async function updateExistingUsersAPI() {
  const result = await updateUsersWithClerkData();
  
  if (result.success) {
    return {
      success: true,
      data: result,
      message: result.message || 'Update completed successfully'
    };
  } else {
    return {
      success: false,
      error: result.error,
      message: 'Failed to update users'
    };
  }
}
