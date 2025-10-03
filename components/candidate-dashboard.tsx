'use client'

import { useState } from 'react'
import { useAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/ui/file-upload'
import { Upload, FileText, Target, TrendingUp, Clock, DollarSign, MapPin, Briefcase } from 'lucide-react'

interface Job {
  id: string
  role: string
  description: string
  requirements: string
  location: string
  work_mode: string
  job_type: string
  duration_months?: number
  stipend?: {
    amount: number
    currency: string
    type: string
  }
  created_at: string
}

interface Company {
  company_name: string
  logo_url?: string | null
  industry?: string
  location?: string
  website?: string
}

interface Matching {
  similarity_score: number
  similarity_percentage: number
  match_quality: string
  confidence: string
}

interface Recommendation {
  rank: number
  job: Job
  company: Company
  matching: Matching
}

interface RecommendationResponse {
  success: boolean
  recommendations: Recommendation[]
  total: number
  metadata: {
    total_jobs_analyzed: number
    min_similarity_threshold: number
    top_n_requested: number
    resume_id: string
    processing_info: {
      ai_enabled: boolean
      embedding_model: string
      similarity_algorithm: string
      embedding_dimensions: number
    }
  }
}

export default function CandidateDashboard() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showErrorWarning, setShowErrorWarning] = useState(false)
  const { candidates, applications } = useAPI()

  const handleUploadComponentChange = (files: File[]) => {
    const selected = files?.[0]
    if (!selected) return
    if (selected.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }
    // Clear any previous errors
    setUploadError(null)
    setShowErrorWarning(false)
    setFile(selected)
  }

  const uploadResume = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadError(null)
    setShowErrorWarning(false)
    
    const result = await candidates.uploadResume(file)
    
    if (result.error) {
      // Set the error message and show warning
      setUploadError(result.error)
      setShowErrorWarning(true)
      console.error('❌ Upload failed:', result)
    } else {
      alert('Resume uploaded successfully! AI analysis completed.')
      // Automatically get recommendations after successful upload
      await getRecommendations()
    }
    setIsUploading(false)
  }

  const getRecommendations = async () => {
    setIsLoadingRecommendations(true)
    console.log('🔍 Getting company recommendations...')
    
    try {
      const result = await candidates.getCompanyRecommendations(10)
      console.log('📊 Recommendation API response:', result)
      
      if (result.error) {
        console.error('❌ Recommendation error:', result.error)
        alert(`Failed to get recommendations: ${result.error}`)
        setRecommendations([])
      } else if (result.data) {
        // Handle both possible response formats
        let recommendationsData: any[] = []
        
        if (Array.isArray(result.data)) {
          // If result.data is directly an array
          recommendationsData = result.data
        } else if (result.data.recommendations) {
          // If result.data has a recommendations property (new format)
          recommendationsData = result.data.recommendations
        }
        
        console.log('✅ Recommendations data:', recommendationsData)
        setRecommendations(recommendationsData)
      } else {
        console.warn('⚠️ No data in response')
        setRecommendations([])
      }
    } catch (error) {
      console.error('🚨 Exception in getRecommendations:', error)
      alert('Failed to get recommendations: Network error')
      setRecommendations([])
    }
    
    setIsLoadingRecommendations(false)
  }

  const applyToCompany = async (companyId: string, companyName: string) => {
    // For now, we'll use a placeholder since the application API might need the company's user ID
    // In a real implementation, you might need to convert the job ID to company ID
    const result = await applications.applyToCompany(parseInt(companyId, 10))
    
    if (result.error) {
      alert(`Application failed: ${result.error}`)
    } else {
      alert(`Successfully applied to ${companyName}!`)
    }
  }

  // Get similarity percentage with color coding
  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50'
    if (score >= 0.6) return 'text-[#FF7500] bg-orange-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent Match'
    if (score >= 0.6) return 'Good Match'
    return 'Fair Match'
  }

  // Format stipend display
  const formatStipend = (amount?: number, currency?: string, type?: string) => {
    if (!amount || amount === 0) return 'Stipend not disclosed'
    
    const currencySymbol = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    }[currency || 'INR'] || currency

    const typeLabel = {
      'monthly': '/month',
      'weekly': '/week',
      'hourly': '/hour',
      'one-time': 'one-time'
    }[type || 'monthly'] || ''

    return `${currencySymbol}${amount.toLocaleString()}${typeLabel}`
  }

  // Format duration display
  const formatDuration = (months?: number) => {
    if (!months) return 'Duration not specified'
    if (months === 1) return '1 month'
    if (months < 12) return `${months} months`
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) return years === 1 ? '1 year' : `${years} years`
    return `${years}y ${remainingMonths}m`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Title Section - Balanced Size */}
        <div className="mb-14 text-center relative py-12">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF7500]/5 to-transparent rounded-3xl blur-3xl"></div>
          <div className="relative">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-gray-900 via-[#FF7500] to-gray-900 bg-clip-text text-transparent mb-7 leading-tight">
              Candidate Dashboard
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-7">
              Discover your perfect career match with our AI-powered platform. 
              <span className="text-[#FF7500] font-medium"> Upload, analyze, and connect</span> seamlessly.
            </p>
            <div className="w-32 h-2 bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] mx-auto rounded-full shadow-lg"></div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Left Panel - Fixed Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-8 space-y-6">
              {/* Simple Upload Resume Card */}
              <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-[#FF7500]/10 flex items-center justify-center">
                      <Upload className="h-4 w-4 text-[#FF7500]" />
                    </div>
                    Upload Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg">
                      <FileUpload onChange={handleUploadComponentChange} />
                    </div>
                    <p className="text-xs text-gray-500 text-center">Only PDF files are supported. Max 5 MB.</p>
                    
                    {/* Error Warning Display */}
                    {showErrorWarning && uploadError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                              PDF Upload Failed
                            </h3>
                            <p className="mt-1 text-sm text-red-700">
                              {uploadError}
                            </p>
                            <p className="mt-2 text-sm text-red-600">
                              Please try uploading a different PDF file that contains readable text content.
                            </p>
                            <div className="mt-3">
                              <Button
                                onClick={() => {
                                  setShowErrorWarning(false)
                                  setUploadError(null)
                                  setFile(null)
                                }}
                                variant="outline"
                                className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                              >
                                Try Different File
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={uploadResume}
                        disabled={!file || isUploading}
                        className="bg-[#FF7500] hover:bg-[#e6690a] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        {isUploading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Uploading...
                          </div>
                        ) : (
                          'Upload Resume'
                        )}
                      </Button>
                      <Button
                        onClick={getRecommendations}
                        disabled={isLoadingRecommendations}
                        variant="outline"
                        className="border-[#FF7500] text-[#FF7500] hover:bg-[#FF7500] hover:text-white font-medium transition-all duration-200"
                      >
                        {isLoadingRecommendations ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-[#FF7500] border-t-transparent rounded-full animate-spin"></div>
                            Analyzing...
                          </div>
                        ) : (
                          'Analyze Resume'
                        )}
                      </Button>
                    </div>
                    {file && (
                      <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 text-center">
                        <span className="font-medium">Selected:</span> {file.name}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced How it works card */}
              <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-[#FF7500]/10 flex items-center justify-center">
                      <Target className="h-4 w-4 text-[#FF7500]" />
                    </div>
                    How it works
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] text-white text-sm flex items-center justify-center font-bold shadow-md flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-1">Upload your resume</div>
                        <div className="text-xs text-gray-600 leading-relaxed">PDF only. Your file stays private and secure.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] text-white text-sm flex items-center justify-center font-bold shadow-md flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-1">Analyze your resume</div>
                        <div className="text-xs text-gray-600 leading-relaxed">We extract skills and build embeddings for precise matching.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] text-white text-sm flex items-center justify-center font-bold shadow-md flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-1">Get matching companies</div>
                        <div className="text-xs text-gray-600 leading-relaxed">See a curated list ranked by AI match score. Apply in one click.</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Panel - Company Recommendations */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended Companies</h2>
                <p className="text-sm text-gray-600">Ranked by AI similarity</p>
              </div>
              <Button
                onClick={getRecommendations}
                disabled={isLoadingRecommendations}
                variant="outline"
                className="border-[#FF7500] text-[#FF7500] hover:bg-[#FF7500] hover:text-white font-semibold"
              >
                {isLoadingRecommendations ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {isLoadingRecommendations ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse h-48">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded mb-3 w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded mb-4 w-full"></div>
                          <div className="h-8 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-6">
                {recommendations.map((recommendation, index) => (
                  <Card key={recommendation.job?.id || index} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-[#FF7500] hover:border-l-[#FF8A3D] bg-white">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        {/* Company Logo */}
                        <div className="flex-shrink-0">
                          <div className="relative">
                            {recommendation.company?.logo_url ? (
                              <img 
                                src={recommendation.company.logo_url} 
                                alt={`${recommendation.company.company_name} logo`}
                                className="w-16 h-16 rounded-xl object-cover border-2 border-gray-100 shadow-md"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-16 h-16 rounded-xl bg-gradient-to-br from-[#FF7500] to-[#FF8A3D] text-white flex items-center justify-center font-bold text-xl shadow-lg ${recommendation.company?.logo_url ? 'hidden' : 'flex'}`}
                            >
                              {recommendation.company?.company_name?.charAt(0) || 'C'}
                            </div>
                          </div>
                        </div>

                        {/* Company Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{recommendation.company?.company_name || 'Unknown Company'}</h3>
                              <p className="text-lg text-[#FF7500] font-semibold">{recommendation.job?.role || 'Position not specified'}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md ${
                              Math.round(recommendation.matching?.similarity_percentage || 0) >= 80 ? 'bg-green-100 text-green-800' :
                              Math.round(recommendation.matching?.similarity_percentage || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {Math.round(recommendation.matching?.similarity_percentage || 0) >= 80 ? 'Excellent Match' : 
                               Math.round(recommendation.matching?.similarity_percentage || 0) >= 60 ? 'Good Match' : 'Good Match'}
                            </span>
                          </div>
                          
                          {/* Job Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-[#FF7500]" />
                              <span>{recommendation.job?.location || 'Location not specified'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Briefcase className="h-4 w-4 text-[#FF7500]" />
                              <span className="capitalize">{recommendation.job?.work_mode || 'Work mode not specified'}</span>
                            </div>
                            {recommendation.job?.duration_months && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4 text-[#FF7500]" />
                                <span>{recommendation.job.duration_months} months</span>
                              </div>
                            )}
                            {recommendation.job?.stipend?.amount && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="h-4 w-4 text-[#FF7500]" />
                                <span className="font-medium">{formatStipend(recommendation.job.stipend.amount, recommendation.job.stipend.currency, recommendation.job.stipend.type)}</span>
                              </div>
                            )}
                          </div>

                          {/* Job Type Badge */}
                          <div className="mb-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                              {recommendation.job?.job_type || 'Job type not specified'}
                            </span>
                          </div>

                          {/* Requirements */}
                          <div className="mb-6">
                            <div className="text-sm font-semibold text-gray-900 mb-2">Key Requirements:</div>
                            <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                              {recommendation.job?.requirements || 'Requirements not specified'}
                            </div>
                          </div>

                          {/* Match Score and Apply Button */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <TrendingUp className="h-5 w-5 text-[#FF7500]" />
                              <div>
                                <div className="text-sm text-gray-500 mb-1">AI Match Score</div>
                                <div className="flex items-center gap-3">
                                  <div className="w-24 bg-gray-200 rounded-full h-3">
                                    <div 
                                      className="bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] h-3 rounded-full shadow-sm" 
                                      style={{ width: `${Math.round(recommendation.matching?.similarity_percentage || 0)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-lg font-bold text-[#FF7500]">{Math.round(recommendation.matching?.similarity_percentage || 0)}%</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              className="bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] hover:from-[#e6690a] hover:to-[#e6790a] text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                              onClick={() => window.open(`mailto:contact@${recommendation.company?.company_name?.toLowerCase()?.replace(' ', '')}.com?subject=Application for ${recommendation.job?.role}&body=Hi, I found your job posting and I'm interested in applying for the ${recommendation.job?.role} position.`, '_blank')}
                            >
                              Apply to {recommendation.company?.company_name || 'Company'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-16 border-2 border-dashed border-gray-200">
                <CardContent>
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#FF7500] to-[#FF8A3D] rounded-full flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No recommendations yet</h3>
                  <p className="text-gray-600 text-lg">Upload and analyze your resume to see personalized company matches here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
