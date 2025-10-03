import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('💼 Starting enhanced job posting with Python AI processing...');
  
  try {
    // Validate user authentication and role
    console.log('🔐 Validating user authentication...');
    const user = await validateUserAndRole('company');
    console.log('✅ User validated:', { userId: user.userId, role: user.role });

    // Parse request body
    console.log('📦 Parsing request body...');
    const body = await request.json();
    
    console.log('📊 Received body data:', {
      ...body,
      description: body.description ? `${body.description.substring(0, 50)}...` : 'missing',
      requirements: body.requirements ? `${body.requirements.substring(0, 50)}...` : 'missing'
    });
    
    const {
      role,
      description,
      requirements,
      location,
      work_mode,
      job_type,
      duration_months,
      stipend_amount,
      stipend_currency = 'INR',
      stipend_type = 'monthly'
    } = body;

    console.log('🔍 Extracted fields:', {
      role: role || 'MISSING',
      description: description ? 'provided' : 'MISSING',
      requirements: requirements ? 'provided' : 'MISSING',
      location,
      work_mode,
      job_type,
      duration_months,
      stipend_amount,
      stipend_currency,
      stipend_type
    });

    // Validate required fields
    if (!role || !description || !requirements) {
      console.log('❌ Missing required fields:', {
        role: !role,
        description: !description,
        requirements: !requirements
      });
      return NextResponse.json(
        { error: 'Role, description, and requirements are required' },
        { status: 400 }
      );
    }

    // Get company information
    console.log('🏢 Fetching company information...');
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('company_name')
      .eq('user_id', user.dbUserId)
      .single();

    if (companyError) {
      console.error('❌ Error fetching company data:', companyError);
      return NextResponse.json(
        { error: 'Company profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ Company found:', companyData.company_name);

    // Prepare job data for AI processing
    const jobData = {
      role,
      description,
      requirements,
      location,
      work_mode,
      job_type,
      duration_months,
      company_name: companyData.company_name
    };

    console.log('🤖 Sending job data to Python AI service for embedding generation...');
    
    // Call Python AI service for embedding generation
    const aiResponse = await fetch(`${PYTHON_AI_SERVICE_URL}/generate-job-embedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Python AI service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate job embedding' },
        { status: 500 }
      );
    }

    const aiResult = await aiResponse.json();
    
    if (!aiResult.success) {
      console.error('❌ AI processing failed:', aiResult);
      return NextResponse.json(
        { error: 'AI processing failed' },
        { status: 500 }
      );
    }

    console.log('✅ AI embedding generation completed successfully');
    console.log('📊 Generated embedding:', {
      embeddingDimensions: aiResult.data.embedding_dimensions,
      textLength: aiResult.data.text_length
    });

    // Insert job data into database with embedding
    console.log('💾 Inserting job data into database...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('jobs')
      .insert({
        company_id: user.dbUserId,
        company_name: companyData.company_name,
        role,
        description,
        requirements,
        location,
        work_mode,
        job_type,
        duration_months,
        stipend_amount,
        stipend_currency,
        stipend_type,
        embedding: aiResult.data.embedding, // Store as array directly
        embedding_model: 'all-MiniLM-L6-v2',
        embedding_created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting job:', insertError);
      return NextResponse.json(
        { error: 'Failed to save job data' },
        { status: 500 }
      );
    }

    console.log('✅ Job data saved successfully:', insertData.id);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Job posted and processed successfully',
      data: {
        jobId: insertData.id,
        jobDetails: {
          role,
          company: companyData.company_name,
          location,
          work_mode,
          job_type,
          duration_months,
          stipend_amount,
          stipend_currency,
          stipend_type
        },
        aiProcessing: {
          embeddingGenerated: true,
          embeddingDimensions: aiResult.data.embedding_dimensions,
          model: 'all-MiniLM-L6-v2',
          processedText: aiResult.data.job_text
        }
      }
    });

  } catch (error) {
    console.error('❌ Job posting failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching jobs for company...');
    
    // Validate user authentication and role
    const user = await validateUserAndRole('company');
    
    // Get company's jobs
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', user.dbUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // Get company information
    const { data: company } = await supabase
      .from('companies')
      .select('company_name, logo_url')
      .eq('user_id', user.dbUserId)
      .single();

    // Add company info to jobs
    const jobsWithCompany = jobs.map(job => ({
      ...job,
      company_name: company?.company_name || job.company_name,
      company_logo: company?.logo_url
    }));

    console.log(`✅ Found ${jobsWithCompany?.length || 0} jobs for company`);

    return NextResponse.json({
      success: true,
      data: jobsWithCompany || [],
      count: jobsWithCompany?.length || 0
    });

  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
