import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Helper function to parse embedding from Supabase vector format
const parseEmbedding = (embedding: any): number[] => {
  if (Array.isArray(embedding)) {
    return embedding;
  }
  if (typeof embedding === 'string') {
    // Remove brackets and split by comma, then convert to numbers
    const cleaned = embedding.replace(/^\[|\]$/g, '');
    return cleaned.split(',').map((val: string) => parseFloat(val.trim()));
  }
  throw new Error('Invalid embedding format');
};

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting enhanced job recommendations with Python AI...');
    
    // Validate user authentication and role
    const user = await validateUserAndRole('candidate');
    console.log('✅ User validated:', { userId: user.userId, dbUserId: user.dbUserId, role: user.role });

    const { searchParams } = new URL(request.url);
    const topN = parseInt(searchParams.get('top_n') || '10');
    const minSimilarity = parseFloat(searchParams.get('min_similarity') || '0.3');

    console.log('🔍 Finding job recommendations using Python AI vector similarity for user:', user.dbUserId);

    // Get the user's latest resume data with embedding
    const { data: candidateResumes, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.dbUserId)
      .not('embedding', 'is', null) // Only get resumes with embeddings
      .order('created_at', { ascending: false })
      .limit(1);

    if (resumeError) {
      console.error('Error fetching candidate resume:', resumeError);
      return NextResponse.json({ error: 'Failed to fetch resume data' }, { status: 500 });
    }

    if (!candidateResumes || candidateResumes.length === 0) {
      console.log('📭 No resume with embedding found for user');
      return NextResponse.json({ 
        success: true,
        recommendations: [],
        message: 'Please upload your resume first to get AI-powered job recommendations',
        total: 0,
        processingInfo: {
          aiEnabled: true,
          embeddingModel: 'all-MiniLM-L6-v2'
        }
      });
    }

    const userResume = candidateResumes[0];
    console.log('📄 Found resume:', {
      id: userResume.id,
      hasEmbedding: !!userResume.embedding,
      embeddingLength: Array.isArray(userResume.embedding) ? userResume.embedding.length : 'unknown'
    });

    // Get all jobs with embeddings
    console.log('💼 Fetching all jobs with embeddings...');
    const { data: allJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .not('embedding', 'is', null) // Only get jobs with embeddings
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs data' }, { status: 500 });
    }

    if (!allJobs || allJobs.length === 0) {
      console.log('📭 No jobs with embeddings found');
      return NextResponse.json({ 
        success: true,
        recommendations: [],
        message: 'No jobs available for matching at the moment',
        total: 0,
        processingInfo: {
          aiEnabled: true,
          embeddingModel: 'all-MiniLM-L6-v2'
        }
      });
    }

    console.log(`💼 Found ${allJobs.length} jobs with embeddings`);

    // Get company information for jobs
    const companyIds = [...new Set(allJobs.map(job => job.company_id).filter(Boolean))];
    let companiesMap = new Map();
    
    if (companyIds.length > 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('user_id, company_name, logo_url, industry, location, website')
        .in('user_id', companyIds);
        
      if (companies) {
        companies.forEach(company => {
          companiesMap.set(company.user_id, company);
        });
      }
    }

    // Prepare data for Python AI service
    const jobEmbeddings = allJobs.map(job => ({
      job_id: job.id,
      role: job.role,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      work_mode: job.work_mode,
      job_type: job.job_type,
      duration_months: job.duration_months,
      stipend_amount: job.stipend_amount,
      stipend_currency: job.stipend_currency,
      stipend_type: job.stipend_type,
      created_at: job.created_at,
      company: companiesMap.get(job.company_id) || { company_name: job.company_name || 'Company' },
      embedding: parseEmbedding(job.embedding)
    }));

    const requestData = {
      resume_embedding: parseEmbedding(userResume.embedding),
      job_embeddings: jobEmbeddings
    };

    console.log('🤖 Sending data to Python AI service for similarity matching...');
    
    // Call Python AI service for similarity matching
    const aiResponse = await fetch(`${PYTHON_AI_SERVICE_URL}/find-matching-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Python AI service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process job matching with AI service' },
        { status: 500 }
      );
    }

    const aiResult = await aiResponse.json();
    console.log(`✅ AI matching completed. Found ${aiResult.total_jobs} job matches`);

    // Filter matches by minimum similarity threshold
    const filteredMatches = aiResult.matches.filter(
      (match: any) => match.similarity_score >= minSimilarity
    );

    // Limit results to top N
    const topMatches = filteredMatches.slice(0, topN);

    console.log(`📊 Returning ${topMatches.length} matches (filtered by similarity >= ${minSimilarity})`);

    // Format the response
    const recommendations = topMatches.map((match: any, index: number) => ({
      rank: index + 1,
      job: {
        id: match.job_id,
        role: match.role,
        description: match.description,
        requirements: match.requirements,
        location: match.location,
        work_mode: match.work_mode,
        job_type: match.job_type,
        duration_months: match.duration_months,
        stipend: {
          amount: match.stipend_amount,
          currency: match.stipend_currency,
          type: match.stipend_type
        },
        created_at: match.created_at
      },
      company: match.company,
      matching: {
        similarity_score: match.similarity_score,
        similarity_percentage: match.similarity_percentage,
        match_quality: match.match_quality,
        confidence: match.similarity_score >= 0.7 ? 'High' : 
                   match.similarity_score >= 0.5 ? 'Medium' : 'Low'
      }
    }));

    return NextResponse.json({
      success: true,
      recommendations,
      total: recommendations.length,
      metadata: {
        total_jobs_analyzed: aiResult.total_jobs,
        min_similarity_threshold: minSimilarity,
        top_n_requested: topN,
        resume_id: userResume.id,
        processing_info: {
          ai_enabled: true,
          embedding_model: 'all-MiniLM-L6-v2',
          similarity_algorithm: 'cosine_similarity',
          embedding_dimensions: 384
        }
      }
    });

  } catch (error) {
    console.error('❌ Enhanced job recommendations failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Additional endpoint to get detailed match explanation
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Getting detailed match explanation...');
    
    const user = await validateUserAndRole('candidate');
    const body = await request.json();
    const { job_id } = body;

    if (!job_id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get user's resume
    const { data: userResume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.dbUserId)
      .not('embedding', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (resumeError || !userResume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Get specific job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .not('embedding', 'is', null)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get company information for the job
    let company = null;
    if (job.company_id) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', job.company_id)
        .single();
      company = companyData;
    }

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Calculate similarity using Python AI service
    const requestData = {
      resume_embedding: parseEmbedding(userResume.embedding),
      job_embeddings: [{
        job_id: job.id,
        role: job.role,
        description: job.description,
        requirements: job.requirements,
        embedding: parseEmbedding(job.embedding),
        ...job
      }]
    };

    const aiResponse = await fetch(`${PYTHON_AI_SERVICE_URL}/find-matching-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!aiResponse.ok) {
      throw new Error('AI service error');
    }

    const aiResult = await aiResponse.json();
    const match = aiResult.matches[0];

    // Extract matching factors
    const resumeSkills = userResume.skills || [];
    const jobRequirements = job.requirements.toLowerCase();
    
    const matchingSkills = resumeSkills.filter((skill: string) => 
      jobRequirements.includes(skill.toLowerCase())
    );

    return NextResponse.json({
      success: true,
      match: {
        similarity_score: match.similarity_score,
        similarity_percentage: match.similarity_percentage,
        match_quality: match.match_quality,
        job: {
          id: job.id,
          role: job.role,
          company: company?.company_name || job.company_name || 'Company'
        },
        explanation: {
          matching_skills: matchingSkills,
          skill_match_percentage: resumeSkills.length > 0 ? 
            Math.round((matchingSkills.length / resumeSkills.length) * 100) : 0,
          key_factors: [
            `Skills alignment: ${matchingSkills.length}/${resumeSkills.length} skills match`,
            `Overall compatibility: ${match.similarity_percentage.toFixed(1)}%`,
            `Match quality: ${match.match_quality}`
          ]
        }
      }
    });

  } catch (error) {
    console.error('❌ Match explanation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
