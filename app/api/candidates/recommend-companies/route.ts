import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { findSimilarJobs } from '@/lib/vectorSearch';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting job recommendations request...');
    
    // Validate user authentication and role
    const user = await validateUserAndRole('candidate');
    console.log('✅ User validated:', { userId: user.userId, dbUserId: user.dbUserId, role: user.role });

    const { searchParams } = new URL(request.url);
    const topN = parseInt(searchParams.get('top_n') || '10');

    console.log('🔍 Finding job recommendations using vector similarity for user:', user.dbUserId);

    // Get the user's latest resume data with embedding (using database user ID)
    const { data: candidateResumes, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.dbUserId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (resumeError) {
      console.error('Error fetching candidate resume:', resumeError);
      return NextResponse.json({ error: 'Failed to fetch resume data' }, { status: 500 });
    }

    if (!candidateResumes || candidateResumes.length === 0) {
      console.log('📭 No resume found for user');
      return NextResponse.json({ 
        recommendations: [],
        message: 'Please upload your resume first to get job recommendations'
      });
    }

    const userResume = candidateResumes[0];
    
    // Check if resume has embedding for vector search
    if (userResume.embedding) {
      console.log('🎯 Using vector similarity search for job recommendations');
      
      try {
        // Parse the embedding from pgvector format
        let userEmbedding: number[];
        
        if (typeof userResume.embedding === 'string') {
          // Parse string format: "[0.1, 0.2, ...]" to array
          console.log('📝 Parsing embedding from string format');
          userEmbedding = JSON.parse(userResume.embedding);
        } else if (Array.isArray(userResume.embedding)) {
          // Already an array
          console.log('📊 Using embedding array directly');
          userEmbedding = userResume.embedding;
        } else {
          throw new Error('Invalid embedding format');
        }
        
        console.log(`📊 Parsed embedding dimensions: ${userEmbedding.length}`);
        
        // Validate dimensions
        if (userEmbedding.length !== 384) {
          console.warn(`⚠️ Unexpected embedding dimensions: ${userEmbedding.length}, expected 384`);
        }
        
        // Use vector similarity search
        const vectorRecommendations = await findSimilarJobs(userEmbedding, topN, 0.1);
        
        if (vectorRecommendations && vectorRecommendations.length > 0) {
          console.log(`✅ Found ${vectorRecommendations.length} jobs using vector similarity`);
          
          // Get company IDs to fetch logo URLs
          const companyIds = vectorRecommendations
            .map((item: any) => item.company_id)
            .filter(Boolean);
            
          // Fetch company information
          const { data: companyLogos } = await supabase
            .from('companies')
            .select('user_id, company_name, logo_url')
            .in('user_id', companyIds);
            
          const logoMap = new Map();
          if (companyLogos) {
            companyLogos.forEach(company => {
              logoMap.set(company.user_id, {
                logo_url: company.logo_url,
                company_name: company.company_name
              });
            });
          }
          
          const recommendations = vectorRecommendations.map((item: {
            id: string;
            role: string;
            company_id?: string;
            company_name?: string;
            location: string;
            work_mode: string;
            duration_months: number;
            job_type: string;
            requirements: string;
            description: string;
            stipend_amount?: number;
            stipend_currency?: string;
            stipend_type?: string;
            created_at: string;
            similarity?: number;
            company_email?: string;
          }) => ({
            id: item.id,
            role: item.role,
            company_name: logoMap.get(item.company_id)?.company_name || item.company_name || 'Company',
            company_logo: logoMap.get(item.company_id)?.logo_url || null,
            location: item.location,
            work_mode: item.work_mode,
            duration_months: item.duration_months,
            job_type: item.job_type,
            requirements: item.requirements,
            description: item.description,
            stipend_amount: item.stipend_amount,
            stipend_currency: item.stipend_currency,
            stipend_type: item.stipend_type,
            created_at: item.created_at,
            match_percentage: Math.round((item.similarity || 0) * 100),
            company_email: item.company_email || 'N/A'
          }));

          // Calculate enhanced match percentages with minimal artificial boosting
          const filteredRecommendations = recommendations
            .map((rec: any) => {
              // Only apply minimal enhancement based on actual similarity
              let enhancedScore = rec.match_percentage;
              
              // Only boost very low but legitimate matches slightly
              if (enhancedScore > 0 && enhancedScore < 20) {
                enhancedScore = enhancedScore * 1.5; // Minimal boost for very low scores
              } else if (enhancedScore >= 20 && enhancedScore < 40) {
                enhancedScore = enhancedScore * 1.2; // Small boost for low scores
              }
              // No artificial boosting for higher scores
              
              // Add minimal random variation for natural distribution
              const randomVariation = (Math.random() - 0.5) * 3; // ±1.5% variation
              enhancedScore += randomVariation;
              
              // Ensure reasonable bounds and don't artificially inflate scores
              enhancedScore = Math.min(Math.max(Math.round(enhancedScore), 0), 90); // Cap at 90% for realism
              
              return {
                ...rec,
                match_percentage: enhancedScore
              };
            })
            .filter((rec: any) => rec.match_percentage >= 70); // Increased threshold for vector search results too

          return NextResponse.json({
            recommendations: filteredRecommendations,
            user_skills: userResume.skills || [],
            total_jobs_analyzed: vectorRecommendations.length,
            search_method: 'vector_similarity'
          });
        }
      } catch (vectorError) {
        console.error('Vector search failed, falling back to keyword matching:', vectorError);
      }
    }

    // Fallback to keyword-based matching if vector search is not available
    console.log('🔄 Using keyword-based matching as fallback');
    
    // Get all available jobs without JOIN to avoid relationship issues
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*');

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 No jobs available for matching');
      return NextResponse.json({ 
        recommendations: [],
        message: 'No jobs are currently available. Companies need to post jobs first!'
      });
    }

    console.log(`📊 Found ${jobs.length} jobs to analyze for matching`);

    // Enhanced keyword-based matching for better fallback performance
    let userSkills = userResume.skills || [];
    
    // Ensure userSkills is an array
    if (typeof userSkills === 'string') {
      try {
        userSkills = JSON.parse(userSkills);
      } catch {
        userSkills = [];
      }
    }
    if (!Array.isArray(userSkills)) {
      userSkills = [];
    }
    
    const userText = (userResume.parsed_text || '').toLowerCase();

    const recommendations = jobs.map(job => {
      let score = 0;
      
      const jobRequirements = (job.requirements || '').toLowerCase();
      const jobDescription = (job.description || '').toLowerCase();
      const jobRole = (job.role || '').toLowerCase();
      
      // Enhanced scoring algorithm with higher base scores
      // 1. Direct skill matches (highest weight)
      userSkills.forEach((skill: string) => {
        const skillLower = skill.toLowerCase();
        if (jobRequirements.includes(skillLower)) score += 35; // Increased from 25
        if (jobDescription.includes(skillLower)) score += 30; // Increased from 20
        if (jobRole.includes(skillLower)) score += 25; // Increased from 15
      });

      // 2. Common technology keywords
      const techKeywords = [
        'javascript', 'python', 'java', 'react', 'node', 'sql', 'api', 'web', 
        'software', 'developer', 'engineer', 'frontend', 'backend', 'fullstack',
        'database', 'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'html', 'css',
        'typescript', 'mongodb', 'postgresql', 'mysql', 'git', 'linux', 'windows'
      ];
      
      techKeywords.forEach((keyword: string) => {
        if (userText.includes(keyword)) {
          if (jobRequirements.includes(keyword)) score += 15; // Increased from 10
          if (jobDescription.includes(keyword)) score += 12; // Increased from 8
          if (jobRole.includes(keyword)) score += 8; // Increased from 5
        }
      });

      // 3. Education level matching
      const educationKeywords = ['bachelor', 'master', 'phd', 'degree', 'graduate', 'university', 'college'];
      educationKeywords.forEach((keyword: string) => {
        if (userText.includes(keyword) && jobRequirements.includes(keyword)) {
          score += 10; // Increased from 5
        }
      });

      // 4. Experience level indicators
      const experienceKeywords = ['intern', 'junior', 'senior', 'lead', 'manager', 'entry', 'fresher'];
      experienceKeywords.forEach((keyword: string) => {
        if (userText.includes(keyword) && (jobRequirements.includes(keyword) || jobRole.includes(keyword))) {
          score += 15; // Increased from 8
        }
      });

      // 5. Industry/domain matching
      const domainKeywords = ['fintech', 'healthcare', 'ecommerce', 'startup', 'enterprise', 'technology', 'software'];
      domainKeywords.forEach((keyword: string) => {
        if (userText.includes(keyword) && jobDescription.includes(keyword)) {
          score += 12; // Increased from 7
        }
      });

      // 6. Add bonus for common job types suitable for students/interns
      const studentFriendlyKeywords = ['intern', 'trainee', 'junior', 'entry', 'graduate'];
      studentFriendlyKeywords.forEach((keyword: string) => {
        if (jobRole.includes(keyword) || jobDescription.includes(keyword)) {
          score += 20;
        }
      });

      // 7. Only add minimal base compatibility if there are actual matches
      // Remove excessive random scoring that causes false matches
      if (score > 0) {
        const smallRandomBonus = Math.random() * 5; // Reduced to 0-5 points
        score += smallRandomBonus;
      }
      // If no actual skill/keyword matches, score remains 0

      return {
        job,
        score,
        match_percentage: Math.min(Math.round(score), 95) // Cap at 95% for realism
      };
    })
    .sort((a, b) => b.score - a.score) // Sort by highest score first
    .filter(item => item.match_percentage >= 65) // Increased minimum to 65% for better quality matches
    .slice(0, topN)
    .map(item => ({
      id: item.job.id,
      role: item.job.role,
      company_name: item.job.company_name || 'Company',
      company_logo: null, // Will be fetched separately if needed
      location: item.job.location,
      work_mode: item.job.work_mode,
      duration_months: item.job.duration_months,
      job_type: item.job.job_type,
      requirements: item.job.requirements,
      description: item.job.description,
      stipend_amount: item.job.stipend_amount,
      stipend_currency: item.job.stipend_currency,
      stipend_type: item.job.stipend_type,
      created_at: item.job.created_at,
      match_percentage: item.match_percentage,
      company_email: 'N/A' // Email would need to be fetched from users table
    }));

    console.log(`✅ Generated ${recommendations.length} job recommendations using keyword matching`);

    return NextResponse.json({
      recommendations,
      user_skills: userSkills,
      total_jobs_analyzed: jobs.length,
      search_method: 'keyword_matching'
    });

  } catch (error) {
    console.error('Job recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
