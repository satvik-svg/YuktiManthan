import { generateEmbedding } from './ai';

/**
 * Embedding service with proper dimension handling (384D for all-MiniLM-L6-v2)
 * This ensures consistency with database schema
 */

// Export the main embedding function with the correct name
export const generateFullTextEmbedding = generateEmbedding;

/**
 * Prepare complete resume text for embedding generation
 * Combines all resume data into a comprehensive text for 384D vector embedding
 */
export function prepareCompleteResumeForEmbedding(resumeData: {
  parsed_text: string;
  skills: any;
  education: any;
  experience: any;
}): string {
  console.log('📝 Preparing complete resume text for 384D embedding...');
  
  const parts: string[] = [];
  
  // Add main parsed text
  if (resumeData.parsed_text) {
    parts.push(`Resume Content: ${resumeData.parsed_text}`);
  }
  
  // Add skills
  if (resumeData.skills) {
    const skillsArray = Array.isArray(resumeData.skills) ? resumeData.skills : 
                       typeof resumeData.skills === 'string' ? [resumeData.skills] :
                       Object.values(resumeData.skills || {});
    if (skillsArray.length > 0) {
      parts.push(`Skills: ${skillsArray.join(', ')}`);
    }
  }
  
  // Add education
  if (resumeData.education) {
    const educationArray = Array.isArray(resumeData.education) ? resumeData.education :
                          typeof resumeData.education === 'string' ? [resumeData.education] :
                          Object.values(resumeData.education || {});
    if (educationArray.length > 0) {
      parts.push(`Education: ${educationArray.join(', ')}`);
    }
  }
  
  // Add experience
  if (resumeData.experience) {
    const experienceArray = Array.isArray(resumeData.experience) ? resumeData.experience :
                           typeof resumeData.experience === 'string' ? [resumeData.experience] :
                           Object.values(resumeData.experience || {});
    if (experienceArray.length > 0) {
      parts.push(`Experience: ${experienceArray.join(', ')}`);
    }
  }
  
  const completeText = parts.join('\n\n');
  console.log(`📊 Complete resume text prepared: ${completeText.length} characters`);
  
  return completeText;
}

/**
 * Prepare complete job posting text for embedding generation
 * Combines all job data into comprehensive text for 384D vector embedding
 */
export function prepareCompleteJobForEmbedding(jobData: {
  role: string;
  location?: string;
  work_mode?: string;
  duration_months?: number;
  job_type?: string;
  description: string;
  requirements: string;
}): string {
  console.log('📝 Preparing complete job text for 384D embedding...');
  
  const parts: string[] = [];
  
  // Add job title/role
  parts.push(`Job Role: ${jobData.role}`);
  
  // Add location and work details
  if (jobData.location) {
    parts.push(`Location: ${jobData.location}`);
  }
  
  if (jobData.work_mode) {
    parts.push(`Work Mode: ${jobData.work_mode}`);
  }
  
  if (jobData.job_type) {
    parts.push(`Job Type: ${jobData.job_type}`);
  }
  
  if (jobData.duration_months) {
    parts.push(`Duration: ${jobData.duration_months} months`);
  }
  
  // Add description
  if (jobData.description) {
    parts.push(`Job Description: ${jobData.description}`);
  }
  
  // Add requirements
  if (jobData.requirements) {
    parts.push(`Requirements: ${jobData.requirements}`);
  }
  
  const completeText = parts.join('\n\n');
  console.log(`📊 Complete job text prepared: ${completeText.length} characters`);
  
  return completeText;
}

/**
 * Calculate cosine similarity between two 384D vectors
 * Used for comparing resume and job embeddings
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error(`Vector dimension mismatch: ${vectorA.length} vs ${vectorB.length}`);
  }
  
  // Ensure we're working with 384D vectors (all-MiniLM-L6-v2)
  if (vectorA.length !== 384) {
    console.warn(`⚠️ Unexpected vector dimension: ${vectorA.length}, expected 384`);
  }
  
  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }
  
  // Calculate magnitudes
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vectorA.length; i++) {
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  // Avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  // Return cosine similarity
  const similarity = dotProduct / (magnitudeA * magnitudeB);
  
  console.log(`🔍 Cosine similarity calculated: ${similarity.toFixed(4)} (384D vectors)`);
  
  return similarity;
}

/**
 * Validate that embedding has correct dimensions for our schema
 */
export function validateEmbeddingDimensions(embedding: number[]): boolean {
  const expectedDimensions = 384; // all-MiniLM-L6-v2 model
  
  if (embedding.length !== expectedDimensions) {
    console.error(`❌ Embedding dimension mismatch: 
      Expected: ${expectedDimensions} (all-MiniLM-L6-v2)
      Received: ${embedding.length}
      This will cause database schema conflicts!`);
    return false;
  }
  
  console.log(`✅ Embedding dimensions valid: ${embedding.length}D`);
  return true;
}

/**
 * Format embedding for pgvector storage
 */
export function formatEmbeddingForDatabase(embedding: number[]): string {
  if (!validateEmbeddingDimensions(embedding)) {
    throw new Error(`Invalid embedding dimensions: ${embedding.length}, expected 384`);
  }
  
  return `[${embedding.join(',')}]`;
}
