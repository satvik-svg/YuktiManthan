import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndRole } from '@/lib/auth';
import { generateFullTextEmbedding, prepareCompleteJobForEmbedding } from '@/lib/embeddingService';
import { insertJobWithEmbedding } from '@/lib/vectorSearch';
import { getCompanyJobs, supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Validate user authentication and role
    const user = await validateUserAndRole('company');
    
    // Parse request body
    const body = await request.json();
    const {
      title,
      location,
      work_mode,
      duration_months,
      job_type,
      description,
      requirements,
      stipend_amount,
      stipend_currency,
      stipend_type
    } = body;

    // Validate required fields
    if (!title || !location || !work_mode || !description || !requirements) {
      return NextResponse.json(
        { error: 'Missing required fields: title, location, work_mode, description, requirements' },
        { status: 400 }
      );
    }

    // Validate work_mode
    if (!['remote', 'onsite', 'hybrid'].includes(work_mode)) {
      return NextResponse.json(
        { error: 'Invalid work_mode. Must be: remote, onsite, or hybrid' },
        { status: 400 }
      );
    }

    console.log(`🏢 Creating job posting for company ${user.userId}`);

    // Get company profile to fetch company name
    const { data: companyProfile, error: companyError } = await supabase
      .from('companies')
      .select('company_name')
      .eq('user_id', user.dbUserId)
      .single();

    let companyName = 'Company'; // fallback
    
    if (companyError) {
      console.warn('Could not fetch company profile:', companyError);
      // Try to get name from users table as fallback
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.dbUserId)
        .single();
      
      if (userData?.name) {
        companyName = userData.name;
      }
    } else if (companyProfile?.company_name) {
      companyName = companyProfile.company_name;
    }

    // Combine all job details into full text for embedding
    const fullTextForEmbedding = prepareCompleteJobForEmbedding({
      role: title,
      location,
      work_mode: work_mode as 'remote' | 'onsite' | 'hybrid',
      duration_months,
      job_type,
      description,
      requirements
    });
    
    // Generate full-text embedding for the complete job posting
    console.log('🧠 Generating full-text embedding for job posting...');
    const embedding = await generateFullTextEmbedding(fullTextForEmbedding);
    console.log(`✅ Generated ${embedding.length}-dimensional embedding for complete job details`);

    // Insert job into database using enhanced vector utilities
    const jobData = {
      company_id: user.dbUserId,
      company_name: companyName,
      role: title,
      location,
      work_mode: work_mode as 'remote' | 'onsite' | 'hybrid',
      duration_months: duration_months || 3,
      job_type: job_type || 'internship',
      description,
      requirements,
      stipend_amount: stipend_amount || 0,
      stipend_currency: stipend_currency || 'INR',
      stipend_type: stipend_type || 'monthly',
      embedding
    };

    const insertedJob = await insertJobWithEmbedding(jobData);
    console.log(`✅ Job posted successfully with ID: ${insertedJob.id}`);

    return NextResponse.json({
      success: true,
      message: 'Job posted successfully',
      data: {
        jobId: insertedJob.id,
        title,
        location,
        work_mode,
        company_name: companyName,
        embeddingDimensions: embedding.length
      }
    });

  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to create job posting'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate user authentication and role
    const user = await validateUserAndRole('company');
    
    console.log(`📋 Fetching jobs for company ${user.userId}`);

    // Get company's jobs from database
    const jobs = await getCompanyJobs(user.dbUserId);
    
    console.log(`✅ Found ${jobs.length} jobs for company`);

    // Format response data
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      location: job.location,
      work_mode: job.work_mode,
      duration_months: job.duration_months,
      job_type: job.job_type,
      description: job.description,
      requirements: job.requirements,
      created_at: job.created_at,
      hasEmbedding: !!job.embedding
    }));

    return NextResponse.json({
      success: true,
      data: formattedJobs,
      count: jobs.length
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to fetch jobs'
      },
      { status: 500 }
    );
  }
}
