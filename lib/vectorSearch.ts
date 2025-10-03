import { supabase } from './supabase';

/**
 * Vector similarity search utilities for Supabase with pgvector
 */

/**
 * Insert resume with full-text embedding
 */
export async function insertResumeWithEmbedding(resumeData: {
  user_id: string;
  file_url: string;
  parsed_text: string;
  skills: any;
  education: any;
  experience: any;
  embedding: number[];
}) {
  try {
    console.log('📝 Inserting resume with full-text embedding');
    console.log(`📊 Embedding dimensions: ${resumeData.embedding.length}`);

    // Validate embedding dimensions
    if (resumeData.embedding.length !== 384) {
      console.warn(`⚠️ Unexpected embedding dimension: ${resumeData.embedding.length}`);
    }

    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: resumeData.user_id,
        file_url: resumeData.file_url,
        parsed_text: resumeData.parsed_text,
        skills: JSON.stringify(resumeData.skills),
        education: JSON.stringify(resumeData.education),
        experience: JSON.stringify(resumeData.experience),
        embedding: resumeData.embedding // Direct array format for pgvector
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting resume:', error);
      throw error;
    }

    console.log(`✅ Resume inserted with ID: ${data.id}`);
    return data;

  } catch (error) {
    console.error('❌ Resume insertion failed:', error);
    throw error;
  }
}

/**
 * Insert job posting with full-text embedding
 */
export async function insertJobWithEmbedding(jobData: {
  company_id: string;
  company_name?: string;
  role: string;
  location?: string;
  work_mode?: string;
  duration_months?: number;
  job_type?: string;
  description?: string;
  requirements?: string;
  stipend_amount?: number;
  stipend_currency?: string;
  stipend_type?: string;
  embedding: number[];
}) {
  try {
    console.log('💼 Inserting job with full-text embedding');
    console.log(`📊 Embedding dimensions: ${jobData.embedding.length}`);

    // Validate embedding dimensions
    if (jobData.embedding.length !== 384) {
      console.warn(`⚠️ Unexpected embedding dimension: ${jobData.embedding.length}`);
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        company_id: jobData.company_id,
        company_name: jobData.company_name,
        role: jobData.role,
        location: jobData.location,
        work_mode: jobData.work_mode,
        duration_months: jobData.duration_months,
        job_type: jobData.job_type,
        description: jobData.description,
        requirements: jobData.requirements,
        stipend_amount: jobData.stipend_amount,
        stipend_currency: jobData.stipend_currency,
        stipend_type: jobData.stipend_type,
        embedding: jobData.embedding, // Direct array format for pgvector
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting job with embedding:', error);
      throw error;
    }

    console.log('✅ Successfully inserted job with embedding');
    return data;

  } catch (error) {
    console.error('💥 Failed to insert job with embedding:', error);
    throw error;
  }
}

/**
 * Find similar jobs using vector similarity search
 * Uses pgvector's cosine distance operator for efficient similarity search
 */
export async function findSimilarJobs(
  userEmbedding: number[],
  limit: number = 10,
  threshold: number = 0.5
) {
  try {
    console.log('🔍 Searching for similar jobs using vector similarity');
    console.log(`📊 Query embedding dimensions: ${userEmbedding.length}`);

    // Validate input
    if (!Array.isArray(userEmbedding)) {
      throw new Error(`Invalid embedding type: expected array, got ${typeof userEmbedding}`);
    }
    
    if (userEmbedding.length !== 384) {
      throw new Error(`Invalid embedding dimensions: expected 384, got ${userEmbedding.length}`);
    }

    // Format embedding for pgvector
    const embeddingVector = `[${userEmbedding.join(',')}]`;
    console.log(`📝 Formatted embedding vector (first 50 chars): ${embeddingVector.substring(0, 50)}...`);

    // First try using RPC function if it exists
    try {
      const { data, error } = await supabase.rpc('match_jobs', {
        query_embedding: userEmbedding,
        match_threshold: 0.1,
        match_count: limit
      });

      if (!error && data && data.length > 0) {
        console.log(`✅ Found ${data.length} similar jobs using RPC`);
        return data;
      }
    } catch (rpcError) {
      console.log('📝 RPC function not available, using direct query');
    }

    // Fallback to direct SQL query without JOIN to avoid relationship issues
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order(`embedding <=> '[${userEmbedding.join(',')}]'`)
      .limit(limit);

    if (error) {
      console.error('❌ Vector search error:', error);
      
      // Fallback to regular query if vector search fails
      console.log('🔄 Falling back to regular job query');
      return await fallbackJobSearch(limit);
    }

    console.log(`✅ Found ${data?.length || 0} similar jobs`);
    return data || [];

  } catch (error) {
    console.error('❌ Job similarity search failed:', error);
    return await fallbackJobSearch(limit);
  }
}

/**
 * Find similar resumes using vector similarity search
 */
export async function findSimilarResumes(
  jobEmbedding: number[],
  limit: number = 10,
  threshold: number = 0.5
) {
  try {
    console.log('🔍 Searching for similar resumes using vector similarity');
    console.log(`📊 Query embedding dimensions: ${jobEmbedding.length}`);

    const embeddingVector = jobEmbedding;

    const { data, error } = await supabase.rpc('match_resumes', {
      query_embedding: embeddingVector, // Pass array directly
      match_threshold: threshold,
      match_count: limit
    });

    if (error) {
      console.error('❌ Vector search error:', error);
      
      // Fallback to regular query
      console.log('🔄 Falling back to regular resume query');
      return await fallbackResumeSearch(limit);
    }

    console.log(`✅ Found ${data?.length || 0} similar resumes`);
    return data || [];

  } catch (error) {
    console.error('❌ Resume similarity search failed:', error);
    return await fallbackResumeSearch(limit);
  }
}

/**
 * Fallback job search when vector search is not available
 * Returns empty results to avoid false matches
 */
async function fallbackJobSearch(limit: number) {
  console.log('❌ Vector search failed - returning empty results to avoid false matches');
  
  // Don't return jobs with fake similarity scores
  // This prevents random PDFs from getting matched to companies
  return [];
}

/**
 * Fallback resume search when vector search is not available
 * Returns empty results to avoid false matches
 */
async function fallbackResumeSearch(limit: number) {
  console.log('❌ Vector search failed - returning empty results to avoid false matches');
  
  // Don't return resumes with fake similarity scores
  // This prevents inappropriate matches
  return [];
}

/**
 * Update existing resume with new embedding
 */
export async function updateResumeEmbedding(
  resumeId: string,
  embedding: number[]
) {
  try {
    console.log(`🔄 Updating embedding for resume ${resumeId}`);

    const { data, error } = await supabase
      .from('resumes')
      .update({
        embedding: embedding // Direct array format
      })
      .eq('id', resumeId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating resume embedding:', error);
      throw error;
    }

    console.log(`✅ Updated embedding for resume ${resumeId}`);
    return data;

  } catch (error) {
    console.error('❌ Resume embedding update failed:', error);
    throw error;
  }
}

/**
 * Update existing job with new embedding
 */
export async function updateJobEmbedding(
  jobId: string,
  embedding: number[]
) {
  try {
    console.log(`🔄 Updating embedding for job ${jobId}`);

    const { data, error } = await supabase
      .from('jobs')
      .update({
        embedding: embedding // Direct array format
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating job embedding:', error);
      throw error;
    }

    console.log(`✅ Updated embedding for job ${jobId}`);
    return data;

  } catch (error) {
    console.error('❌ Job embedding update failed:', error);
    throw error;
  }
}

/**
 * Get all resumes without embeddings for batch processing
 */
export async function getResumesWithoutEmbeddings(limit: number = 50) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .is('embedding', null)
    .limit(limit);

  if (error) {
    console.error('❌ Error fetching resumes without embeddings:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all jobs without embeddings for batch processing
 */
export async function getJobsWithoutEmbeddings(limit: number = 50) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .is('embedding', null)
    .limit(limit);

  if (error) {
    console.error('❌ Error fetching jobs without embeddings:', error);
    return [];
  }

  return data || [];
}
