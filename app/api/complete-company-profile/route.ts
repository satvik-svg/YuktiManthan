import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🏢 Complete company profile API called');
    
    // Validate that the user is authenticated and has company role
    const user = await validateUserAndRole('company');
    
    console.log('✅ User validated with company role:', {
      userId: user.userId,
      dbUserId: user.dbUserId,
      role: user.role
    });
    
    const formData = await request.formData();
    
    // Extract form data
    const companyName = formData.get('companyName') as string;
    const description = formData.get('description') as string;
    const industry = formData.get('industry') as string;
    const companySize = formData.get('companySize') as string;
    const website = formData.get('website') as string;
    const location = formData.get('location') as string;
    const logoFile = formData.get('logo') as File | null;
    
    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    console.log('📝 Form data received:', {
      companyName,
      description: description ? 'provided' : 'missing',
      industry,
      companySize,
      website: website || 'not provided',
      location,
      hasLogo: !!logoFile
    });

    // Handle logo upload to Supabase Storage
    let logoUrl = null;
    if (logoFile && logoFile.size > 0) {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = logoFile.name.split('.').pop();
        const fileName = `${user.dbUserId}_${timestamp}.${fileExtension}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, logoFile, {
            contentType: logoFile.type,
            upsert: true
          });

        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          // Don't fail the whole request for logo upload issues
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('company-logos')
            .getPublicUrl(fileName);
          
          logoUrl = publicUrl;
          console.log('✅ Logo uploaded successfully:', logoUrl);
        }
      } catch (logoError) {
        console.error('Error processing logo:', logoError);
        // Continue without logo
      }
    }

    // Check if company profile already exists
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.dbUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing company profile:', checkError);
      return NextResponse.json({ error: 'Failed to check existing profile' }, { status: 500 });
    }

    let companyProfile;

    if (existingCompany) {
      // Update existing company profile
      console.log('📝 Updating existing company profile for user:', user.dbUserId);
      
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({
          company_name: companyName,
          description,
          industry,
          company_size: companySize,
          website,
          location,
          logo_url: logoUrl, // Include logo URL if uploaded
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.dbUserId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating company profile:', updateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      console.log('✅ Company profile updated successfully:', updatedCompany);
      companyProfile = updatedCompany;
    } else {
      // Create new company profile
      console.log('📝 Creating new company profile for user:', user.dbUserId);
      
      const newProfileData = {
        user_id: user.dbUserId,
        company_name: companyName,
        description,
        industry,
        company_size: companySize,
        website,
        location,
        logo_url: logoUrl // Include logo URL if uploaded
      };
      
      console.log('📊 New profile data:', newProfileData);
      
      const { data: newCompany, error: insertError } = await supabase
        .from('companies')
        .insert(newProfileData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating company profile:', insertError);
        return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
      }

      console.log('✅ New company profile created successfully:', newCompany);
      companyProfile = newCompany;
    }

    // Update the user record with company name for consistency
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ name: companyName })
      .eq('id', user.dbUserId);

    if (userUpdateError) {
      console.error('Warning: Failed to update user name:', userUpdateError);
      // Don't fail the request for this non-critical update
    }

    return NextResponse.json({ 
      success: true,
      message: 'Company profile completed successfully',
      profile: companyProfile
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save profile' 
    }, { status: 500 });
  }
}
