'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SignUp } from '@clerk/nextjs';
import { User, Building } from 'lucide-react';

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'company'>('candidate');

  // Store role selection in localStorage when it changes
  const handleRoleChange = (role: 'candidate' | 'company') => {
    setSelectedRole(role);
    localStorage.setItem('selectedRole', role);
  };

  const roleOptions = [
    {
      value: 'candidate' as const,
      label: "I'm looking for internships",
      icon: User,
    },
    {
      value: 'company' as const,
      label: "I'm hiring interns",
      icon: Building,
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] text-white px-4 py-2 rounded-lg font-bold text-xl shadow-md inline-block mb-4">
            PM
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Join PM Internship Portal</h1>
          <p className="text-gray-600 text-lg">Choose your account type to get started</p>
        </motion.div>

        {/* Role Selection - Now Side by Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {roleOptions.map((option) => {
            const Icon = option.icon;
            return (
              <motion.button
                key={option.value}
                onClick={() => handleRoleChange(option.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-300 relative overflow-hidden ${
                  selectedRole === option.value
                    ? 'border-[#FF7500] bg-gradient-to-br from-[#FF7500] to-[#FF8A3D] text-white shadow-xl'
                    : 'border-gray-200 bg-white hover:border-[#FF7500] hover:shadow-md hover:scale-105'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {selectedRole === option.value && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                )}
                <div className="flex items-center space-x-3 relative z-10">
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    selectedRole === option.value ? 'bg-white/20' : 'bg-orange-50'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      selectedRole === option.value ? 'text-white' : 'text-[#FF7500]'
                    }`} />
                  </div>
                  <h3 className={`font-semibold text-base ${
                    selectedRole === option.value ? 'text-white' : 'text-gray-800'
                  }`}>
                    {option.label}
                  </h3>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Clerk SignUp Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-sm mx-auto"
        >
          <SignUp
            path="/signup"
            routing="path"
            signInUrl="/signin"
            afterSignUpUrl="/dashboard"
            appearance={{
              elements: {
                card: "bg-white rounded-2xl shadow-xl p-6",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-gray-200 hover:border-[#FF7500] transition-colors duration-200 rounded-lg",
                formButtonPrimary: "bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] hover:from-[#E6690A] hover:to-[#E6690A] transition-all duration-200 rounded-lg font-medium",
                formFieldInput: "border-gray-300 focus:border-[#FF7500] focus:ring-2 focus:ring-[#FF7500]/20 rounded-lg",
                footerActionLink: "text-[#FF7500] hover:text-[#E6690A] font-medium",
                formFieldError: "text-red-500 text-sm",
                identityPreview: "border-gray-200 rounded-lg",
                formResendCodeLink: "text-[#FF7500] hover:text-[#E6690A]",
                formFieldLabel: "text-gray-700 font-medium",
                dividerText: "text-gray-500",
                dividerLine: "bg-gray-200",
                formFieldSuccessText: "text-green-600",
                formFieldWarningText: "text-yellow-600"
              },
              variables: {
                borderRadius: "0.75rem",
                spacingUnit: "1rem"
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
