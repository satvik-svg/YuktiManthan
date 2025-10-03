import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clerkUserId = searchParams.get('clerkUserId');

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Missing clerkUserId' }, { status: 400 });
  }

  try {
    console.log('🔍 Company profile check called for:', clerkUserId);
    
    // First, ensure the user exists in our database
    try {
      console.log('🔄 Ensuring user exists in database...');
      const { createOrUpdateUser, getUserByClerkId } = await import('@/lib/supabase');
      const { clerkClient } = await import('@clerk/nextjs/server');
      
      // First check if user already exists
      let existingUser = await getUserByClerkId(clerkUserId);
      console.log('🔍 Existing user check:', existingUser);
      
      if (!existingUser) {
        // Get user data from Clerk
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(clerkUserId);
        
        // Extract user info
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
        const metadataRole = clerkUser.publicMetadata?.role || clerkUser.unsafeMetadata?.role;
        
        console.log('👤 Clerk user data:', { email, name, metadataRole });
        
        // Use metadata role if available, otherwise default to 'candidate'
        const roleToUse = (metadataRole === 'company' || metadataRole === 'candidate') ? metadataRole : 'candidate';
        
        // Create user in our database
        existingUser = await createOrUpdateUser(clerkUserId, email, name, roleToUse);
        console.log('✅ User created in database with role:', roleToUse);
      } else {
        console.log('✅ User already exists in database with role:', existingUser.role);
      }
      
    } catch (ensureUserError) {
      console.error('Error ensuring user exists:', ensureUserError);
      // Continue with the check even if user creation fails
    }
    
    // Check if user exists in our database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('clerk_user_id', clerkUserId)
      .single();

    console.log('📊 User lookup result:', { user, userError });

    if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ 
        profileComplete: false,
        error: 'User not found',
        debug: { userError }
      });
    }

    if (!user) {
      console.log('❌ No user found');
      return NextResponse.json({ 
        profileComplete: false,
        error: 'No user found'
      });
    }

    // Check if user has company role
    if (user.role !== 'company') {
      console.log('❌ User is not a company, role:', user.role);
      return NextResponse.json({ 
        profileComplete: false,
        error: 'User is not a company',
        actualRole: user.role
      });
    }

    // Check if company profile exists in companies table
    const { data: companyProfile, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('🏢 Company profile lookup:', { companyProfile, companyError });

    if (companyError && companyError.code !== 'PGRST116') {
      console.error('Error fetching company profile:', companyError);
    }

    // Consider profile complete if company profile exists with required fields
    const profileComplete = !!(
      companyProfile && 
      companyProfile.company_name && 
      companyProfile.company_name.trim() !== '' &&
      companyProfile.description &&
      companyProfile.industry &&
      companyProfile.location
    );

    console.log('✅ Profile check result:', {
      userId: user.id,
      hasCompanyProfile: !!companyProfile,
      profileComplete,
      missingFields: !companyProfile ? ['all'] : [
        !companyProfile.company_name ? 'company_name' : null,
        !companyProfile.description ? 'description' : null,
        !companyProfile.industry ? 'industry' : null,
        !companyProfile.location ? 'location' : null,
      ].filter(Boolean)
    });

    return NextResponse.json({ 
      profileComplete,
      profile: user,
      companyProfile: companyProfile || null,
      hasCompanyProfile: !!companyProfile,
      debug: {
        userId: user.id,
        companyProfileExists: !!companyProfile,
        requiredFieldsCheck: {
          company_name: companyProfile?.company_name || null,
          description: companyProfile?.description || null,
          industry: companyProfile?.industry || null,
          location: companyProfile?.location || null
        }
      }
    });

  } catch (error) {
    console.error('Profile check error:', error);
    // Return false if we can't check, so user goes to profile completion
    return NextResponse.json({ profileComplete: false });
  }
}
