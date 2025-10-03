'use client'

import { useState, useEffect } from 'react'
import { useCompanyAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Briefcase, MapPin, Clock, Building, CheckCircle, AlertCircle, Trash2, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Job {
  id: string
  title: string
  location: string
  work_mode: 'remote' | 'onsite' | 'hybrid'
  duration_months: number
  job_type: string
  description: string
  requirements: string
  stipend_amount?: number
  stipend_currency?: string
  stipend_type?: string
  created_at: string
  hasEmbedding: boolean
}

interface JobFormData {
  title: string
  location: string
  work_mode: 'remote' | 'onsite' | 'hybrid'
  duration_months: number
  job_type: string
  description: string
  requirements: string
  stipend_amount: number
  stipend_currency: string
  stipend_type: string
}

// Helper function to format stipend
const formatStipend = (amount?: number, currency?: string, type?: string) => {
  if (!amount || !currency) return null
  const formattedAmount = new Intl.NumberFormat('en-IN').format(amount)
  return `${currency} ${formattedAmount}${type ? ` (${type})` : ''}`
}

export default function CompanyJobPostingDashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    location: '',
    work_mode: 'remote',
    duration_months: 3,
    job_type: 'internship',
    description: '',
    requirements: '',
    stipend_amount: 0,
    stipend_currency: 'INR',
    stipend_type: 'monthly'
  })

  const companies = useCompanyAPI()

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setIsLoading(true)
    try {
      const result = await companies.getJobs()
      if (result.data && result.data.success && Array.isArray(result.data.data)) {
        setJobs(result.data.data)
      } else if (result.error) {
        console.error('API Error:', result.error)
        setJobs([]) // Ensure jobs is always an array
      } else {
        console.error('Unexpected response format:', result.data)
        setJobs([]) // Ensure jobs is always an array
      }
    } catch (error) {
      console.error('Failed to load jobs:', error)
      setJobs([]) // Ensure jobs is always an array on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log('📤 Submitting job data:', formData);
      const result = await companies.createJob(formData)
      console.log('📥 API response:', result);
      
      if (result.data && result.data.success) {
        // Reset form and reload jobs
        setFormData({
          title: '',
          location: '',
          work_mode: 'remote',
          duration_months: 3,
          job_type: 'internship',
          description: '',
          requirements: '',
          stipend_amount: 0,
          stipend_currency: 'INR',
          stipend_type: 'monthly'
        })
        setShowForm(false)
        await loadJobs()
      } else {
        console.error('❌ Job creation failed:', result);
        alert(result.error || result.data?.message || 'Failed to create job posting')
      }
    } catch (error) {
      console.error('Failed to create job:', error)
      alert('Failed to create job posting')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof JobFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your job postings and find the best candidates</p>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-[#FF7500] hover:bg-[#e6690a] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Briefcase className="w-8 h-8 text-[#FF7500]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{Array.isArray(jobs) ? jobs.length : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">AI Processed</p>
                  <p className="text-2xl font-bold text-gray-900">{Array.isArray(jobs) ? jobs.filter(j => j.hasEmbedding).length : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Array.isArray(jobs) && jobs.length > 0 ? Math.round(jobs.reduce((acc, job) => acc + job.duration_months, 0) / jobs.length) : 0} months
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MapPin className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Remote Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{Array.isArray(jobs) ? jobs.filter(j => j.work_mode === 'remote').length : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Posting Form Modal */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Job Posting</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g. Frontend Developer Intern"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g. Mumbai, India"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                    <select
                      value={formData.work_mode} 
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('work_mode', e.target.value as 'remote' | 'onsite' | 'hybrid')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="remote">Remote</option>
                      <option value="onsite">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Months)</label>
                    <Input
                      type="number"
                      value={formData.duration_months}
                      onChange={(e) => handleInputChange('duration_months', parseInt(e.target.value))}
                      min="1"
                      max="24"
                      required
                    />
                  </div>
                </div>
                
                {/* Stipend Section */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Stipend Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stipend Amount</label>
                      <Input
                        type="number"
                        value={formData.stipend_amount}
                        onChange={(e) => handleInputChange('stipend_amount', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        value={formData.stipend_currency}
                        onChange={(e) => handleInputChange('stipend_currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7500]"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                      <select
                        value={formData.stipend_type}
                        onChange={(e) => handleInputChange('stipend_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7500]"
                      >
                        <option value="monthly">Per Month</option>
                        <option value="weekly">Per Week</option>
                        <option value="hourly">Per Hour</option>
                        <option value="one-time">One-time</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formData.stipend_amount > 0 ? 
                      `Preview: ${formData.stipend_currency === 'INR' ? '₹' : formData.stipend_currency === 'USD' ? '$' : formData.stipend_currency === 'EUR' ? '€' : '£'}${formData.stipend_amount.toLocaleString()} ${formData.stipend_type}` 
                      : 'Enter stipend amount to see preview'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the role, responsibilities, and what the intern will learn..."
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                  <Textarea
                    value={formData.requirements}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('requirements', e.target.value)}
                    placeholder="List required skills, experience, qualifications..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-[#FF7500] hover:bg-[#e6690a] text-white"
                  >
                    {isSubmitting ? 'Creating...' : 'Post Job'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Job Postings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7500] mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading jobs...</p>
              </div>
            ) : (!Array.isArray(jobs) || jobs.length === 0) ? (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings yet</h3>
                <p className="text-gray-600 mb-6">Create your first job posting to start finding great candidates</p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-[#FF7500] hover:bg-[#e6690a] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(jobs) ? jobs.map((job) => (
                  <Card key={job.id} className="border-l-4 border-l-[#FF7500]">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            <Badge variant={job.hasEmbedding ? "default" : "secondary"} className="text-xs">
                              {job.hasEmbedding ? (
                                <><CheckCircle className="w-3 h-3 mr-1" />AI Processed</>
                              ) : (
                                <><AlertCircle className="w-3 h-3 mr-1" />Processing</>
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {job.work_mode}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.duration_months} months
                            </span>
                            {job.stipend_amount && (
                              <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                💰 {formatStipend(job.stipend_amount, job.stipend_currency, job.stipend_type)}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{job.description.substring(0, 150)}...</p>
                          <p className="text-xs text-gray-500">Posted on {new Date(job.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
