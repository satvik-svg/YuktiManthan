from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
import re
from typing import List, Dict, Any, Optional
import logging
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SIH AI Processing Service", version="1.0.0")

# Configure CORS to allow requests from your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the embedding model (384 dimensions to match your database)
logger.info("Loading SentenceTransformer model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
logger.info("Model loaded successfully")

# Pydantic models for request/response
class TextInput(BaseModel):
    text: str

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dimensions: int
    text_length: int

class ParsedResumeData(BaseModel):
    text: str
    skills: List[str]
    education: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    contact_info: Dict[str, str]

class JobData(BaseModel):
    role: str
    description: str
    requirements: str
    location: Optional[str] = None
    work_mode: Optional[str] = None
    job_type: Optional[str] = None
    duration_months: Optional[int] = None
    company_name: Optional[str] = None

class SimilarityRequest(BaseModel):
    resume_embedding: List[float]
    job_embeddings: List[Dict[str, Any]]  # Each contains 'embedding' and job details

class SimilarityResponse(BaseModel):
    matches: List[Dict[str, Any]]
    total_jobs: int

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pypdf with enhanced error handling"""
    try:
        # Validate file bytes
        if not file_bytes or len(file_bytes) < 50:  # More lenient minimum size
            raise ValueError("Invalid or empty PDF file")
        
        # Create a file-like object from bytes
        pdf_file = io.BytesIO(file_bytes)
        
        # Create PDF reader with error handling
        try:
            reader = PdfReader(pdf_file)
        except Exception as pdf_error:
            # Try alternative parsing methods
            logger.warning(f"Standard PDF reading failed: {str(pdf_error)}")
            
            # Reset file pointer
            pdf_file.seek(0)
            
            # Try with strict=False for corrupted PDFs
            try:
                reader = PdfReader(pdf_file, strict=False)
            except Exception as alt_error:
                logger.error(f"Alternative PDF reading also failed: {str(alt_error)}")
                raise ValueError(f"Cannot parse PDF file: {str(alt_error)}")
        
        # Check if PDF is valid
        if len(reader.pages) == 0:
            raise ValueError("PDF file contains no pages")
        
        text = ""
        successful_pages = 0
        
        for page_num, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text += page_text + "\n"
                    successful_pages += 1
            except Exception as page_error:
                logger.warning(f"Error reading page {page_num}: {str(page_error)}")
                continue
        
        # Clean up the text
        text = re.sub(r'\s+', ' ', text).strip()
        
        # More lenient text validation
        if len(text) < 5:  # Reduced minimum length
            # If no text extracted, create a minimal response
            if successful_pages == 0:
                logger.warning("No text could be extracted from PDF")
                return "Document uploaded - content could not be extracted automatically. Please ensure this is a text-based PDF."
            else:
                raise ValueError("PDF appears to contain minimal readable text")
        
        logger.info(f"Successfully extracted {len(text)} characters from PDF ({successful_pages} pages)")
        return text
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as ve:
        logger.error(f"PDF validation error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error extracting text from PDF: {str(e)}")
        # More graceful fallback
        return "Document uploaded - automatic text extraction failed. Please try uploading a different PDF file."

def generate_embedding(text: str) -> List[float]:
    """Generate 384-dimensional embedding using SentenceTransformer"""
    try:
        if not text or len(text.strip()) == 0:
            raise ValueError("Empty text provided")
        
        # Clean text
        clean_text = re.sub(r'\s+', ' ', text.strip())
        
        # Generate embedding
        embedding = model.encode([clean_text])[0].tolist()
        
        logger.info(f"Generated embedding with {len(embedding)} dimensions for text of length {len(clean_text)}")
        return embedding
        
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")

def extract_skills_from_text(text: str) -> List[str]:
    """Extract skills from resume text using pattern matching"""
    skill_patterns = [
        # Programming Languages
        r'\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Rust|PHP|Ruby|Swift|Kotlin|Scala|HTML|CSS)\b',
        # Frameworks & Libraries
        r'\b(React|Angular|Vue|Next\.?js|Express|Django|Flask|Spring|Laravel|Rails|Bootstrap|Tailwind)\b',
        # Databases
        r'\b(MongoDB|PostgreSQL|MySQL|Redis|Cassandra|DynamoDB|Elasticsearch|SQLite)\b',
        # Cloud & DevOps
        r'\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|GitLab|GitHub|Terraform|CI/CD)\b',
        # Tools & Technologies
        r'\b(Git|Linux|Node\.?js|REST|GraphQL|API|JSON|XML|SASS|Webpack|npm|yarn)\b'
    ]
    
    skills = set()
    text_lower = text.lower()
    
    for pattern in skill_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        skills.update(matches)
    
    # Look for skills in dedicated skills section
    skills_section = re.search(r'(?:skills?|technologies?|technical skills?)[:\s]+(.*?)(?:\n\n|\n[A-Z]|$)', text, re.IGNORECASE)
    if skills_section:
        skills_text = skills_section.group(1)
        for pattern in skill_patterns:
            matches = re.findall(pattern, skills_text, re.IGNORECASE)
            skills.update(matches)
    
    return list(skills)

def extract_education_from_text(text: str) -> List[Dict[str, Any]]:
    """Extract education information from resume text"""
    education = []
    
    # Degree patterns
    degree_patterns = [
        r'(Bachelor|Master|PhD|Doctorate|B\.?[A-Z]+|M\.?[A-Z]+|BS|MS|MBA|B\.Tech|M\.Tech).*?(?=\n|$)',
        r'(University|College|Institute).*?(?=\n|$)'
    ]
    
    for pattern in degree_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            if isinstance(match, tuple):
                match = ' '.join(match)
            
            # Extract year
            year_match = re.search(r'\b(19|20)\d{2}\b', match)
            year = year_match.group(0) if year_match else None
            
            education.append({
                'degree': match.strip(),
                'year': year,
                'institution': 'Unknown'
            })
    
    return education

def extract_experience_from_text(text: str) -> List[Dict[str, Any]]:
    """Extract work experience from resume text"""
    experience = []
    
    # Job title patterns
    job_patterns = [
        r'(Software Engineer|Developer|Data Scientist|Product Manager|Designer|Analyst|Intern|Lead|Senior|Junior).*?(?=\n|$)',
        r'(Engineer|Manager|Specialist|Coordinator|Executive).*?(?=\n|$)'
    ]
    
    for pattern in job_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            # Extract duration
            duration_match = re.search(r'\b\d+\s+(?:years?|months?)\b', match, re.IGNORECASE)
            duration = duration_match.group(0) if duration_match else None
            
            experience.append({
                'role': match.strip(),
                'duration': duration,
                'company': 'Unknown'
            })
    
    return experience

def extract_contact_info(text: str) -> Dict[str, str]:
    """Extract contact information from resume text"""
    contact_info = {}
    
    # Email
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    if email_match:
        contact_info['email'] = email_match.group(0)
    
    # Phone
    phone_match = re.search(r'[\+]?[1-9][\d\s\-\(\)]{8,}', text)
    if phone_match:
        contact_info['phone'] = phone_match.group(0)
    
    # GitHub
    github_match = re.search(r'github\.com/[\w\-\.]+', text, re.IGNORECASE)
    if github_match:
        contact_info['github'] = github_match.group(0)
    
    # LinkedIn
    linkedin_match = re.search(r'linkedin\.com/in/[\w\-\.]+', text, re.IGNORECASE)
    if linkedin_match:
        contact_info['linkedin'] = linkedin_match.group(0)
    
    return contact_info

@app.post("/parse-resume", response_model=Dict[str, Any])
async def parse_resume(file: UploadFile = File(...)):
    """Parse PDF resume and extract structured data with embedding"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Read file bytes
        file_bytes = await file.read()
        
        # Extract text from PDF
        text = extract_text_from_pdf(file_bytes)
        
        if len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="PDF appears to be empty or contains insufficient text")
        
        # Extract structured data
        skills = extract_skills_from_text(text)
        education = extract_education_from_text(text)
        experience = extract_experience_from_text(text)
        contact_info = extract_contact_info(text)
        
        # Generate embedding for the complete resume
        complete_resume_text = f"""
        Resume Content: {text}
        Skills: {', '.join(skills)}
        Education: {', '.join([edu.get('degree', '') for edu in education])}
        Experience: {', '.join([exp.get('role', '') for exp in experience])}
        """
        
        embedding = generate_embedding(complete_resume_text.strip())
        
        return {
            "success": True,
            "data": {
                "parsed_text": text,
                "skills": skills,
                "education": education,
                "experience": experience,
                "contact_info": contact_info,
                "embedding": embedding,
                "embedding_dimensions": len(embedding),
                "text_length": len(text)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in parse_resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/generate-job-embedding", response_model=Dict[str, Any])
async def generate_job_embedding(job_data: JobData):
    """Generate embedding for job posting"""
    try:
        # Combine all job information into a comprehensive text
        job_text_parts = [
            f"Job Role: {job_data.role}",
            f"Description: {job_data.description}",
            f"Requirements: {job_data.requirements}"
        ]
        
        if job_data.location:
            job_text_parts.append(f"Location: {job_data.location}")
        if job_data.work_mode:
            job_text_parts.append(f"Work Mode: {job_data.work_mode}")
        if job_data.job_type:
            job_text_parts.append(f"Job Type: {job_data.job_type}")
        if job_data.duration_months:
            job_text_parts.append(f"Duration: {job_data.duration_months} months")
        if job_data.company_name:
            job_text_parts.append(f"Company: {job_data.company_name}")
        
        complete_job_text = "\n".join(job_text_parts)
        embedding = generate_embedding(complete_job_text)
        
        return {
            "success": True,
            "data": {
                "embedding": embedding,
                "embedding_dimensions": len(embedding),
                "job_text": complete_job_text,
                "text_length": len(complete_job_text)
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating job embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate job embedding: {str(e)}")

@app.post("/find-matching-jobs", response_model=SimilarityResponse)
async def find_matching_jobs(request: SimilarityRequest):
    """Find matching jobs using cosine similarity"""
    try:
        if len(request.resume_embedding) != 384:
            raise HTTPException(status_code=400, detail=f"Resume embedding must have 384 dimensions, got {len(request.resume_embedding)}")
        
        resume_embedding = np.array(request.resume_embedding).reshape(1, -1)
        matches = []
        
        for job_data in request.job_embeddings:
            job_embedding = job_data.get('embedding', [])
            
            if len(job_embedding) != 384:
                logger.warning(f"Skipping job with invalid embedding dimensions: {len(job_embedding)}")
                continue
            
            job_embedding_array = np.array(job_embedding).reshape(1, -1)
            
            # Calculate cosine similarity
            similarity_score = cosine_similarity(resume_embedding, job_embedding_array)[0][0]
            
            # Convert similarity to percentage (0-100%)
            similarity_percentage = float(similarity_score * 100)
            
            match_data = {
                **job_data,
                'similarity_score': float(similarity_score),
                'similarity_percentage': similarity_percentage,
                'match_quality': 'High' if similarity_percentage >= 70 else 'Medium' if similarity_percentage >= 50 else 'Low'
            }
            
            matches.append(match_data)
        
        # Sort by similarity score (highest first)
        matches.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return SimilarityResponse(
            matches=matches,
            total_jobs=len(matches)
        )
        
    except Exception as e:
        logger.error(f"Error finding matching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to find matching jobs: {str(e)}")

@app.post("/generate-text-embedding", response_model=EmbeddingResponse)
async def generate_text_embedding(request: TextInput):
    """Generate embedding for any text"""
    try:
        embedding = generate_embedding(request.text)
        
        return EmbeddingResponse(
            embedding=embedding,
            dimensions=len(embedding),
            text_length=len(request.text)
        )
        
    except Exception as e:
        logger.error(f"Error generating text embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate text embedding: {str(e)}")

@app.post("/extract-resume-data")
async def extract_resume_data(request: TextInput):
    """Extract structured data from resume text"""
    try:
        logger.info(f"Extracting structured data from text of length: {len(request.text)}")
        
        # Extract skills, education, and experience from text
        skills = extract_skills_from_text(request.text)
        education = extract_education_from_text(request.text)
        experience = extract_experience_from_text(request.text)
        
        logger.info(f"Extracted {len(skills)} skills, {len(education)} education entries, {len(experience)} experience entries")
        
        return {
            "skills": skills,
            "education": [edu.get('degree', str(edu)) if isinstance(edu, dict) else str(edu) for edu in education],
            "experience": [exp.get('title', str(exp)) if isinstance(exp, dict) else str(exp) for exp in experience],
            "text_length": len(request.text)
        }
        
    except Exception as e:
        logger.error(f"Error extracting resume data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract resume data: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "embedding_dimensions": 384
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
