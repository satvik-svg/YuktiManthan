'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Building, Loader2, Upload } from 'lucide-react';

export default function CompanyProfileCompletion() {
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    description: '',
    industry: '',
    companySize: '',
    website: '',
    location: '',
    logo: null as File | null
  });

  React.useEffect(() => {
    if (!pageLoaded) {
      console.log('📄 Company profile completion page first load');
      setPageLoaded(true);
    }
  }, [pageLoaded]);

  // Redirect if not authorized
  React.useEffect(() => {
    console.log('🔍 Company profile completion page loaded');
    console.log('👤 User data:', { 
      userId: user?.id,
      publicMetadata: user?.publicMetadata,
      unsafeMetadata: user?.unsafeMetadata
    });
    
    if (user) {
      const role = user.publicMetadata?.role || user.unsafeMetadata?.role;
      const storedRole = localStorage.getItem('selectedRole');
      
      console.log('🔍 Role check:', { role, storedRole });
      
      // Only redirect if we're sure they're not a company
      if (role && role !== 'company') {
        console.log('❌ User is not a company, redirecting to dashboard');
        router.push('/dashboard'); // Redirect users to dashboard instead of signup
      } else if (!role && !storedRole) {
        console.log('❌ No role found, redirecting to signup');
        // No role at all and no stored selection - redirect to signup
        router.push('/signup');
      } else {
        console.log('✅ User is company or has company role stored, staying on profile completion page');
      }
      // If role is 'company' or storedRole is 'company', stay on this page
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF7500]" />
      </div>
    );
  }

  // Show loading if role is being determined
  const role = user.publicMetadata?.role || user.unsafeMetadata?.role;
  const storedRole = localStorage.getItem('selectedRole');
  
  console.log('🔍 Current state check:', { 
    hasUser: !!user, 
    role, 
    storedRole,
    shouldShowLoading: !role && !storedRole 
  });
  
  if (!role && !storedRole) {
    console.log('⏳ Showing loading because no role determined yet');
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF7500] mx-auto mb-4" />
          <p className="text-gray-600">Determining user role...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, logo: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('clerkUserId', user.id);
      submitData.append('companyName', formData.companyName);
      submitData.append('description', formData.description);
      submitData.append('industry', formData.industry);
      submitData.append('companySize', formData.companySize);
      submitData.append('website', formData.website);
      submitData.append('location', formData.location);
      
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }

      const response = await fetch('/api/complete-company-profile', {
        method: 'POST',
        body: submitData,
      });

      const responseData = await response.json();
      console.log('Profile completion response:', responseData);

      if (response.ok) {
        console.log('✅ Profile saved successfully, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.error('❌ Profile save failed:', responseData);
        throw new Error(responseData.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] text-white px-4 py-2 rounded-lg font-bold text-xl shadow-md inline-block mb-4">
            PM
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome! Let&apos;s complete your company profile</h1>
          <p className="text-gray-600">Help us understand your company better to match you with the right candidates</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7500] focus:border-[#FF7500] transition-colors"
                  placeholder="Enter your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7500] focus:border-[#FF7500] transition-colors"
                >
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7500] focus:border-[#FF7500] transition-colors"
                placeholder="Tell us about your company..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size *
                </label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7500] focus:border-[#FF7500] transition-colors"
                >
                  <option value="">Select company size</option>
                  <option value="1-10 employees">1-10 employees</option>
                  <option value="11-50 employees">11-50 employees</option>
                  <option value="51-200 employees">51-200 employees</option>
                  <option value="201-500 employees">201-500 employees</option>
                  <option value="500+ employees">500+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7500] focus:border-[#FF7500] transition-colors"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7500] focus:border-[#FF7500] transition-colors"
                placeholder="https://yourcompany.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg border border-gray-300 transition-colors">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formData.logo ? formData.logo.name : 'Choose file'}
                  </span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-gray-500">Max 2MB (PNG, JPG)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Building className="w-5 h-5" />
                  <span>Complete Profile</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
