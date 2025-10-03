import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database operations for the new schema
export async function createOrUpdateUser(clerkUserId: string, email: string, name: string, role: 'candidate' | 'company') {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      clerk_user_id: clerkUserId,
      email,
      name,
      role
    }, {
      onConflict: 'clerk_user_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }

  return data;
}

export async function getUserByClerkId(clerkUserId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No user found - return null
      return null;
    }
    console.error('Error getting user by Clerk ID:', error);
    throw error;
  }

  return data;
}

export async function insertResume(resumeData: {
  user_id: string;
  file_url: string;
  parsed_text: string;
  skills: any;
  education: any;
  experience: any;
  embedding: number[];
}) {
  try {
    console.log('📝 Inserting resume with data:', {
      user_id: resumeData.user_id,
      file_url: resumeData.file_url,
      parsed_text_length: resumeData.parsed_text.length,
      skills_count: Array.isArray(resumeData.skills) ? resumeData.skills.length : 'not_array',
      education_count: Array.isArray(resumeData.education) ? resumeData.education.length : 'not_array',
      experience_count: Array.isArray(resumeData.experience) ? resumeData.experience.length : 'not_array',
      embedding_length: resumeData.embedding.length
    });

    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: resumeData.user_id,
        file_url: resumeData.file_url,
        parsed_text: resumeData.parsed_text,
        skills: JSON.stringify(resumeData.skills), // Ensure it's JSON
        education: JSON.stringify(resumeData.education), // Ensure it's JSON
        experience: JSON.stringify(resumeData.experience), // Ensure it's JSON
        embedding: `[${resumeData.embedding.join(',')}]` // Vector format
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting resume:', error);
      throw error;
    }

    console.log('✅ Resume inserted successfully:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Insert resume failed:', error);
    throw error;
  }
}

export async function getUserResumes(userId: string) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching resumes:', error);
    throw error;
  }

  return data;
}

export async function insertJob(jobData: {
  company_id: string;
  title: string;
  location: string;
  work_mode: 'remote' | 'onsite' | 'hybrid';
  duration_months: number;
  job_type: string;
  description: string;
  requirements: string;
  embedding: number[];
}) {
  console.log('🔍 Attempting to insert job with data:', {
    company_id: jobData.company_id,
    title: jobData.title,
    location: jobData.location,
    work_mode: jobData.work_mode,
    duration_months: jobData.duration_months,
    job_type: jobData.job_type,
    embeddingLength: jobData.embedding.length
  });

  // Map our frontend fields to database schema
  const dbData = {
    company_id: jobData.company_id,
    role: jobData.title,  // Database uses 'role' instead of 'title'
    location: jobData.location,
    work_mode: jobData.work_mode,
    duration_months: jobData.duration_months,
    job_type: jobData.job_type,
    description: jobData.description,
    requirements: jobData.requirements,
    embedding: `[${jobData.embedding.join(',')}]`  // Format for pgvector
  };

  console.log('🔄 Mapped data for database:', {
    ...dbData,
    embedding: `[first 3 values: ${jobData.embedding.slice(0, 3).join(',')}...]`
  });

  const { data, error } = await supabase
    .from('jobs')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error('Error inserting job:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('✅ Job inserted successfully:', data);
  return data;
}

export async function getCompanyJobs(companyId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }

  // Map database fields back to frontend expected format
  const mappedData = data.map(job => ({
    ...job,
    title: job.role,  // Map database 'role' back to frontend 'title'
  }));

  return mappedData;
}
