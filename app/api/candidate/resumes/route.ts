import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndRole } from '@/lib/auth';
import { getUserResumes } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Validate user authentication and role
    const user = await validateUserAndRole('candidate');
    
    console.log(`📋 Fetching resumes for user ${user.userId}`);

    // Get user's resumes from database
    const resumes = await getUserResumes(user.dbUserId);
    
    console.log(`✅ Found ${resumes.length} resumes for user`);

    // Format response data
    const formattedResumes = resumes.map(resume => ({
      id: resume.id,
      fileName: resume.file_url.split('/').pop(),
      fileUrl: resume.file_url,
      uploadDate: resume.created_at,
      skillsCount: Array.isArray(resume.skills) ? resume.skills.length : 0,
      skills: resume.skills,
      education: resume.education,
      experience: resume.experience,
      hasEmbedding: !!resume.embedding
    }));

    return NextResponse.json({
      success: true,
      data: formattedResumes,
      count: resumes.length
    });

  } catch (error) {
    console.error('Get resumes error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to fetch resumes'
      },
      { status: 500 }
    );
  }
}
