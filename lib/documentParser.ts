/**
 * Document parser that uses Python FastAPI backend for PDF processing
 */

import { extractStructuredDataFromPDF } from './ai';

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';

export async function parseDocument(file: File): Promise<string> {
  console.log('📄 Parsing document using FastAPI backend...');
  
  try {
    if (file.type === 'application/pdf') {
      // Use FastAPI backend for PDF parsing
      const result = await extractStructuredDataFromPDF(file);
      return result.parsed_text;
    } else {
      // For other file types, throw error or handle locally
      throw new Error('Only PDF files are supported for now');
    }
  } catch (error) {
    console.error('❌ Error parsing document:', error);
    
    // Don't provide fallback - throw the error to be handled properly
    throw error;
  }
}

export async function extractDataWithAI(parsedText: string): Promise<{
  skills: string[];
  education: string[];
  experience: string[];
}> {
  try {
    console.log('🤖 Extracting structured data using FastAPI AI service...');
    
    const response = await fetch(`${PYTHON_AI_SERVICE_URL}/extract-resume-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: parsedText }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ FastAPI data extraction error:', errorData);
      throw new Error(`FastAPI service error: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Structured data extracted successfully via FastAPI');
    
    return {
      skills: result.skills || [],
      education: result.education || [],
      experience: result.experience || []
    };
  } catch (error) {
    console.error('❌ Error extracting structured data with FastAPI:', error);
    
    // Fallback to simple extraction
    console.log('🔄 Using fallback extraction...');
    return {
      skills: extractSkillsFallback(parsedText),
      education: extractEducationFallback(parsedText),
      experience: extractExperienceFallback(parsedText)
    };
  }
}

// File validation functions
export function validateFileType(file: File): boolean {
  const allowedTypes = ['application/pdf'];
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

// Fallback extraction functions
function extractSkillsFallback(text: string): string[] {
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css',
    'typescript', 'angular', 'vue', 'express', 'mongodb', 'postgresql',
    'docker', 'kubernetes', 'aws', 'azure', 'git', 'github'
  ];
  
  const lowerText = text.toLowerCase();
  return skillKeywords.filter(skill => lowerText.includes(skill));
}

function extractEducationFallback(text: string): string[] {
  const educationRegex = /(bachelor|master|phd|degree|university|college|school)/gi;
  const matches = text.match(educationRegex);
  return matches ? [...new Set(matches)] : [];
}

function extractExperienceFallback(text: string): string[] {
  const experienceRegex = /(developer|engineer|manager|analyst|intern|experience)/gi;
  const matches = text.match(experienceRegex);
  return matches ? [...new Set(matches)] : [];
}
