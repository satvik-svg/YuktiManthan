import { useAuth } from '@clerk/nextjs'

const API_BASE_URL = ''

interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

// Interfaces for API responses
interface JobRecommendation {
  id: string
  role: string
  company_name: string
  location: string
  work_mode: string
  job_type: string
  requirements: string
  description: string
  match_percentage: number
  company_email: string
  created_at: string
}

interface Candidate {
  candidate_id: string
  name: string
  email: string
  score: number
}

// Custom hook for API calls with authentication
export const useApiClient = () => {
  const { getToken } = useAuth()

  const apiCall = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      // Get Clerk token
      const token = await getToken()
      console.log('API Call Debug:', { 
        endpoint, 
        method: options.method || 'GET',
        hasToken: !!token, 
        tokenStart: token?.substring(0, 20) + '...',
        headers: options.headers
      })
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers,
        },
      })

      let data
      try {
        data = await response.json()
      } catch (e) {
        data = { message: 'Invalid JSON response' }
      }

      console.log('API Response Debug:', { 
        endpoint,
        method: options.method || 'GET',
        status: response.status, 
        ok: response.ok, 
        data 
      })
      
      return {
        data: response.ok ? data : undefined,
        error: !response.ok ? data.detail || data.message || `HTTP ${response.status}: ${response.statusText}` : undefined,
        status: response.status,
      }
    } catch (error) {
      console.error('API Call Error:', error)
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 500,
      }
    }
  }

  const uploadFile = async <T>(
    endpoint: string,
    file: File
  ): Promise<ApiResponse<T>> => {
    try {
      const token = await getToken()
      console.log('File Upload Debug:', { 
        endpoint, 
        fileName: file.name,
        fileSize: file.size,
        hasToken: !!token,
        tokenStart: token?.substring(0, 20) + '...'
      })
      
      const formData = new FormData()
      formData.append('resume', file)
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      })

      let data
      try {
        data = await response.json()
      } catch (e) {
        data = { message: 'Invalid JSON response' }
      }

      console.log('Upload Response Debug:', { 
        status: response.status, 
        ok: response.ok, 
        data 
      })
      
      return {
        data: response.ok ? data : undefined,
        error: !response.ok ? data.detail || data.message || `HTTP ${response.status}: ${response.statusText}` : undefined,
        status: response.status,
      }
    } catch (error) {
      console.error('Upload Error:', error)
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 500,
      }
    }
  }

  return { apiCall, uploadFile }
}

// Candidate API functions (matching FastAPI routes/candidates.py)
export const useCandidateAPI = () => {
  const { apiCall, uploadFile } = useApiClient()

  return {
    // Upload resume with AI parsing and vector embedding generation (using Python FastAPI)
    uploadResume: async (file: File) => {
      return await uploadFile<{ status: string; message: string }>('/api/candidate/upload-resume-enhanced', file)
    },

    // Get AI-powered company recommendations based on resume embedding similarity (using Python FastAPI)
    getCompanyRecommendations: async (topN: number = 5) => {
      return await apiCall<{
        recommendations: JobRecommendation[]
        user_skills: string[]
        total_jobs_analyzed: number
        search_method: string
      }>(`/api/candidates/recommend-companies-enhanced?top_n=${topN}`)
    },
  }
}

// Company API functions (matching Next.js API routes)
export const useCompanyAPI = () => {
  const { apiCall, uploadFile } = useApiClient()

  return {
    // Create a new job posting with AI embedding generation (using Python FastAPI)
    createJob: async (jobData: {
      title: string;
      location: string;
      work_mode: 'remote' | 'onsite' | 'hybrid';
      duration_months?: number;
      job_type?: string;
      description: string;
      requirements: string;
      stipend_amount?: number;
      stipend_currency?: string;
      stipend_type?: string;
    }) => {
      // Transform title to role for backend compatibility
      const apiData = {
        ...jobData,
        role: jobData.title, // Backend expects 'role' but frontend sends 'title'
      };
      
      console.log('🔄 Transforming job data for API:', {
        original: jobData,
        transformed: apiData
      });
      
      return await apiCall<{ success: boolean; message: string; data: any }>('/api/company/jobs-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })
    },

    // Get all jobs posted by the company
    getJobs: async () => {
      return await apiCall<{ success: boolean; data: any[]; count: number }>('/api/company/jobs')
    },

    // Legacy: Upload job requirement file (if we implement file upload later)
    uploadRequirement: async (file: File) => {
      return await uploadFile<{ status: string; message: string }>('/api/company/upload-requirement', file)
    },

    // Get AI-powered candidate recommendations based on requirement embedding similarity
    getCandidateRecommendations: async (topN: number = 5) => {
      return await apiCall<Candidate[]>(`/api/company/recommend-candidates?top_n=${topN}`)
    },
  }
}

// Applications API functions (matching FastAPI routes/applications.py)
export const useApplicationAPI = () => {
  const { apiCall } = useApiClient()

  return {
    // Apply to a company
    applyToCompany: async (companyId: number) => {
      return await apiCall<{ status: string; message: string }>(`/api/applications/apply/${companyId}`, {
        method: 'POST',
      })
    },

    // Shortlist a candidate (company action)
    shortlistCandidate: async (candidateId: string) => {
      return await apiCall<{ status: string; message: string }>(`/api/applications/shortlist/${candidateId}`, {
        method: 'POST',
      })
    },
  }
}

// Combined API hook for easy access to all endpoints
export const useAPI = () => {
  const candidateAPI = useCandidateAPI()
  const companyAPI = useCompanyAPI()
  const applicationAPI = useApplicationAPI()

  return {
    candidates: candidateAPI,
    companies: companyAPI,
    applications: applicationAPI,
  }
}