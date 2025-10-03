'use client'

import { useState, useEffect } from 'react'
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import CandidateDashboard from '@/components/candidate-dashboard'
import CompanyJobPostingDashboard from '@/components/company-job-posting-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Building, Target, Award } from 'lucide-react'

function DashboardContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [userRole, setUserRole] = useState<'candidate' | 'company' | null>(null)
  const [isSelectingRole, setIsSelectingRole] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingProfile, setIsCheckingProfile] = useState(false)
  const [hasCheckedRole, setHasCheckedRole] = useState(false)

  useEffect(() => {
    if (isLoaded && user && !hasCheckedRole && !isCheckingProfile) {
      console.log('🎯 Dashboard: Triggering fetchUserRole');
      fetchUserRole();
    }
  }, [isLoaded, user, hasCheckedRole, isCheckingProfile])

  const fetchUserRole = async () => {
    if (hasCheckedRole || isCheckingProfile) {
      console.log('🔄 Already checking role or role already checked, skipping...');
      return;
    }
    
    setIsCheckingProfile(true);
    
    try {
      console.log('🔍 Fetching user role for:', user?.id);
      const response = await fetch('/api/get-role');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Role data:', data);
        if (data.hasRole) {
          const role = data.role;
          console.log('✅ User has role:', role);
          
          // If user is a company, check if profile is complete
          if (role === 'company') {
            console.log('🏢 User is company, checking profile completion...');
            // Check if company profile is complete
            try {
              if (!user?.id) {
                throw new Error('User ID not available');
              }
              
              console.log('🔍 Checking company profile for user:', user.id);
              const profileResponse = await fetch(`/api/company-profile-check?clerkUserId=${user.id}`);
              
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log('📋 Profile data received:', profileData);
                
                if (!profileData.profileComplete) {
                  console.log('❌ Profile incomplete, redirecting to completion page');
                  // Set flags to prevent further checks
                  setIsCheckingProfile(false);
                  setHasCheckedRole(true);
                  // Use Next.js router and return to prevent further execution
                  router.replace('/company-profile-completion');
                  return;
                } else {
                  console.log('✅ Profile complete, proceeding to dashboard');
                }
              } else {
                console.error('Profile check response not ok:', profileResponse.status, await profileResponse.text());
                // On error, allow user to proceed to dashboard
              }
            } catch (profileError) {
              console.error('Error checking company profile:', profileError);
              // On error, allow user to proceed to dashboard instead of redirecting
              console.log('🚨 Error checking profile, proceeding to dashboard');
            }
          }
          
          setUserRole(role);
          setIsSelectingRole(false);
          setHasCheckedRole(true);
        } else {
          // Check localStorage for role selected during signup
          const storedRole = localStorage.getItem('selectedRole') as 'candidate' | 'company';
          if (storedRole) {
            // Automatically set the role from localStorage
            selectRole(storedRole);
          } else {
            // If no stored role, check user metadata
            const userRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role;
            if (userRole === 'candidate' || userRole === 'company') {
              setUserRole(userRole as 'candidate' | 'company');
              setIsSelectingRole(false);
              setHasCheckedRole(true);
            } else {
              setIsSelectingRole(true);
              setHasCheckedRole(true);
            }
          }
        }
      } else {
        // Check user metadata as fallback
        const userRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role;
        if (userRole === 'candidate' || userRole === 'company') {
          setUserRole(userRole as 'candidate' | 'company');
          setIsSelectingRole(false);
          setHasCheckedRole(true);
        } else {
          setIsSelectingRole(true);
          setHasCheckedRole(true);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Check user metadata as fallback
      const userRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role;
      if (userRole === 'candidate' || userRole === 'company') {
        setUserRole(userRole as 'candidate' | 'company');
        setIsSelectingRole(false);
        setHasCheckedRole(true);
      } else {
        setIsSelectingRole(true);
        setHasCheckedRole(true);
      }
    } finally {
      setIsCheckingProfile(false);
    }
  }

  const selectRole = async (role: 'candidate' | 'company') => {
    if (!user) return
    setIsLoading(true)
    
    try {
      // Call our API to set the role in the database
      const response = await fetch('/api/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to set role');
      }

      // If company role selected, redirect to profile completion
      if (role === 'company') {
        localStorage.removeItem('selectedRole');
        router.push('/company-profile-completion');
        return;
      }

      setUserRole(role)
      setIsSelectingRole(false)
      setHasCheckedRole(true)
      localStorage.removeItem('selectedRole') // Clear it once set in database
      
    } catch (error) {
      console.error('Error setting role:', error)
    }
    setIsLoading(false)
  }

  // Show loading spinner while authentication is loading
  if (!isLoaded || isCheckingProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#FF7500] border-t-transparent rounded-full"
        />
        {isCheckingProfile && (
          <p className="ml-4 text-gray-600">Checking company profile...</p>
        )}
      </div>
    )
  }

  if (isSelectingRole) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl w-full"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to AI Job Matching!</h1>
            <p className="text-gray-600">Select your role to get started with our AI-powered platform</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Candidate Role */}
            <Card className="border-2 border-gray-200 hover:border-[#FF7500] transition-colors cursor-pointer group">
              <CardHeader className="text-center">
                <div className="bg-[#FF7500] bg-opacity-10 rounded-full p-4 w-20 h-20 mx-auto mb-4 group-hover:bg-opacity-20 transition-colors">
                  <Users className="h-12 w-12 text-[#FF7500] mx-auto" />
                </div>
                <CardTitle className="text-xl text-gray-900">I&apos;m a Job Seeker</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  Upload your resume and let AI find the perfect job matches for you
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Target className="h-4 w-4" />
                    AI Resume Analysis
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Award className="h-4 w-4" />
                    Smart Company Matching
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Building className="h-4 w-4" />
                    Direct Applications
                  </div>
                </div>
                <Button 
                  onClick={() => selectRole('candidate')}
                  className="w-full bg-[#FF7500] hover:bg-[#e6690a] text-white"
                >
                  Continue as Job Seeker
                </Button>
              </CardContent>
            </Card>

            {/* Company Role */}
            <Card className="border-2 border-gray-200 hover:border-[#FF7500] transition-colors cursor-pointer group">
              <CardHeader className="text-center">
                <div className="bg-[#FF7500] bg-opacity-10 rounded-full p-4 w-20 h-20 mx-auto mb-4 group-hover:bg-opacity-20 transition-colors">
                  <Building className="h-12 w-12 text-[#FF7500] mx-auto" />
                </div>
                <CardTitle className="text-xl text-gray-900">I&apos;m a Recruiter</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  Upload job requirements and discover the best candidates with AI
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Target className="h-4 w-4" />
                    AI Requirement Analysis
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    Smart Candidate Matching
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Award className="h-4 w-4" />
                    Talent Shortlisting
                  </div>
                </div>
                <Button 
                  onClick={() => selectRole('company')}
                  className="w-full bg-[#FF7500] hover:bg-[#e6690a] text-white"
                >
                  Continue as Recruiter
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Powered by advanced AI vector embeddings and similarity matching
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Render appropriate dashboard based on role
  if (userRole === 'candidate') {
    return <CandidateDashboard />
  } else if (userRole === 'company') {
    return <CompanyJobPostingDashboard />
  }

  return null
}

export default function Dashboard() {
  return (
    <>
      <SignedIn>
        <DashboardContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
