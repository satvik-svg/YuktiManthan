'use client';

import React from 'react';
import { motion } from 'motion/react';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] text-white px-4 py-2 rounded-lg font-bold text-xl shadow-md inline-block mb-4">
            PM
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600 text-lg">Sign in to your PM Internship Portal account</p>
        </motion.div>

        {/* Clerk SignIn Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-sm mx-auto"
        >
          <SignIn
            path="/signin"
            routing="path"
            signUpUrl="/signup"
            afterSignInUrl="/dashboard"
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
