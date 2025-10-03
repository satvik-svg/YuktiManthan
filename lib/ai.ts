/**
 * AI Service that connects to Python FastAPI backend
 */

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log('🤖 Generating embedding using Python FastAPI service...');
    console.log(`📝 Text length: ${text.length} characters`);
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty text provided for embedding');
    }

    const response = await fetch(`${PYTHON_AI_SERVICE_URL}/generate-text-embedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.trim() }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ FastAPI embedding error:', errorData);
      throw new Error(`FastAPI service error: ${response.status}`);
    }

    const result = await response.json();
    const embedding = result.embedding;
    
    console.log(`✅ Generated embedding with ${embedding.length} dimensions via FastAPI`);
    
    // Verify we have exactly 384 dimensions (matches database schema)
    if (embedding.length !== 384) {
      console.error(`❌ Dimension mismatch: got ${embedding.length}, expected 384`);
      throw new Error(`Expected 384 dimensions, got ${embedding.length}`);
    }
    
    return embedding;
  } catch (error) {
    console.error('❌ Error generating embedding with FastAPI:', error);
    console.log('🔄 Using fallback 384-dimensional embedding...');
    
    // Fallback: Create exactly 384 dimensions to match database
    return generateFallbackEmbedding(text, 384);
  }
}

export async function extractStructuredDataFromPDF(file: File): Promise<{
  parsed_text: string;
  skills: string[];
  education: string[];
  experience: string[];
}> {
  try {
    console.log('🤖 Extracting data from PDF using Python FastAPI service...');
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${PYTHON_AI_SERVICE_URL}/parse-resume`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ FastAPI PDF parsing error:', errorData);
      throw new Error(`FastAPI service error: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ PDF parsed successfully via FastAPI');
    console.log('📊 Full result:', result);
    
    // Handle nested response structure
    const data = result.data || result;
    
    if (!data.parsed_text) {
      console.error('❌ No parsed_text in response:', data);
      throw new Error('Invalid response format from FastAPI service');
    }
    
    console.log(`📄 Extracted ${data.parsed_text.length} characters`);
    console.log(`🎯 Found ${data.skills?.length || 0} skills`);
    
    return {
      parsed_text: data.parsed_text,
      skills: data.skills || [],
      education: data.education || [],
      experience: data.experience || []
    };
  } catch (error) {
    console.error('❌ Error extracting data from PDF with FastAPI:', error);
    throw error;
  }
}

// Fixed fallback function for 384 dimensions
function generateFallbackEmbedding(text: string, dimensions: number = 384): number[] {
  console.log(`🔄 Generating fallback embedding with ${dimensions} dimensions`);
  
  // Create a deterministic hash-based embedding
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(dimensions).fill(0);
  
  // Use word hashes to populate embedding
  words.forEach((word, wordIndex) => {
    if (word.length > 0) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        const char = word.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      // Distribute word influence across multiple dimensions
      for (let dim = 0; dim < 10; dim++) {
        const index = (Math.abs(hash) + dim * 37 + wordIndex * 7) % dimensions;
        embedding[index] += Math.sin(hash + dim) * 0.1;
      }
    }
  });
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = embedding[i] / magnitude;
    }
  }
  
  console.log(`✅ Generated fallback embedding with exactly ${embedding.length} dimensions`);
  return embedding;
}

export async function extractStructuredData(text: string): Promise<{
  skills: string[];
  education: any[];
  experience: any[];
}> {
  try {
    console.log('🔍 Extracting structured data from resume...');
    console.log(`📝 Processing ${text.length} characters`);
    
    const skills = extractSkillsImproved(text);
    const education = extractEducationImproved(text);
    const experience = extractExperienceImproved(text);
    
    console.log(`✅ Extracted: ${skills.length} skills, ${education.length} education entries, ${experience.length} experience entries`);
    
    return { skills, education, experience };

  } catch (error) {
    console.error('❌ Error extracting structured data:', error);
    return {
      skills: [],
      education: [],
      experience: []
    };
  }
}

// Improved extraction functions
function extractSkillsImproved(text: string): string[] {
  const skillPatterns = [
    // Programming Languages
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Rust|PHP|Ruby|Swift|Kotlin|Scala)\b/gi,
    // Frameworks & Libraries  
    /\b(React|Angular|Vue|Next\.js|Express|Django|Flask|Spring|Laravel|Rails)\b/gi,
    // Databases
    /\b(MongoDB|PostgreSQL|MySQL|Redis|Cassandra|DynamoDB|Elasticsearch)\b/gi,
    // Cloud & DevOps
    /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|GitLab|GitHub|Terraform)\b/gi,
    // Tools & Technologies
    /\b(Git|Linux|Node\.js|REST|GraphQL|API|JSON|XML|HTML|CSS|SASS|Bootstrap|Tailwind)\b/gi
  ];
  
  const skills = new Set<string>();
  
  skillPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => skills.add(match));
    }
  });
  
  // Look for skills in dedicated skills section
  const skillsSection = text.match(/(?:skills?|technologies?|technical skills?)[:\s]+(.*?)(?:\n\n|\n[A-Z]|$)/i);
  if (skillsSection) {
    const skillsText = skillsSection[1];
    skillPatterns.forEach(pattern => {
      const matches = skillsText.match(pattern);
      if (matches) {
        matches.forEach(match => skills.add(match));
      }
    });
  }
  
  return Array.from(skills);
}

function extractEducationImproved(text: string): any[] {
  const education: any[] = [];
  
  // Degree patterns
  const degreePatterns = [
    /\b(Bachelor|Master|PhD|Doctorate|B\.?[A-Z]+|M\.?[A-Z]+|BS|MS|MBA|B\.Tech|M\.Tech)\b.*?(?:\n|$)/gi
  ];
  
  degreePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        education.push({
          degree: match.trim(),
          institution: extractInstitution(match),
          year: extractYear(match)
        });
      });
    }
  });
  
  return education;
}

function extractExperienceImproved(text: string): any[] {
  const experience: any[] = [];
  
  // Job title patterns
  const jobPatterns = [
    /\b(Software Engineer|Developer|Data Scientist|Product Manager|Designer|Analyst|Intern|Lead|Senior|Junior)\b.*?(?:\n|$)/gi
  ];
  
  jobPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        experience.push({
          role: match.trim(),
          company: extractCompany(match),
          duration: extractDuration(match)
        });
      });
    }
  });
  
  return experience;
}

function extractInstitution(text: string): string {
  const match = text.match(/(?:at|from)\s+([^,\n]+)/i);
  return match ? match[1].trim() : '';
}

function extractCompany(text: string): string {
  const match = text.match(/(?:at|@)\s+([^,\n]+)/i);
  return match ? match[1].trim() : '';
}

function extractYear(text: string): string {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : '';
}

function extractDuration(text: string): string {
  const match = text.match(/\b\d+\s+(?:years?|months?)\b/i);
  return match ? match[0] : '';
}
