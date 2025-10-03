'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Hero } from '@/components/ui/hero-with-group-of-images-text-and-two-buttons'
import SimpleNavbar from '@/components/SimpleNavbar'
import { hiringCompanies } from '@/lib/companies'
import { useLenis } from '@/lib/useLenis'
import { 
  Menu, 
  X, 
  ChevronRight, 
  CheckCircle, 
  Users, 
  Building, 
  Target,
  Star,
  ArrowRight,
  Upload,
  Zap,
  Shield
} from 'lucide-react'
import { InfiniteMovingLogos } from '@/components/ui/infinite-moving-logos'

export default function YuktiManthan() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Initialize Lenis smooth scrolling
  useLenis()

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const features = [
    {
      icon: <Upload className="w-8 h-8 text-[#FF7500]" />,
      title: "Easy Resume Upload",
      description: "Simply upload your resume and let our AI analyze your skills and experience instantly."
    },
    {
      icon: <Target className="w-8 h-8 text-[#FF7500]" />,
      title: "Smart Matching",
      description: "Get matched with companies that perfectly align with your skills and career goals."
    },
    {
      icon: <Building className="w-8 h-8 text-[#FF7500]" />,
      title: "Company Connections",
      description: "Access opportunities from top-tier companies across various industries."
    },
    {
      icon: <Zap className="w-8 h-8 text-[#FF7500]" />,
      title: "Lightning Fast",
      description: "Get results in seconds, not days. Our AI processes your profile instantly."
    },
    {
      icon: <Shield className="w-8 h-8 text-[#FF7500]" />,
      title: "Secure & Private",
      description: "Your data is encrypted and protected. We respect your privacy completely."
    },
    {
      icon: <Star className="w-8 h-8 text-[#FF7500]" />,
      title: "Top Rated",
      description: "Receive customized recommendations based on your unique profile and preferences."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <SimpleNavbar />

      {/* Hero Section */}
      <div >
        <Hero />
      </div>
      

      {/* Companies Section */}
      <section id="companies" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeInUp}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-black">Companies Currently Hiring Through </span>
              <span className="text-[#FF7500]">YuktiManthan</span>
            </h2>
            <p className="text-lg text-gray-600">
              Join these leading companies and kickstart your career journey
            </p>
          </motion.div>
          
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <InfiniteMovingLogos
              companies={hiringCompanies}
              direction="left"
              speed="normal"
              pauseOnHover={true}
              className="py-4"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We&apos;ve built the most advanced internship matching platform to help you 
              find the perfect Product Management opportunity.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting matched with your dream internship is just three simple steps away.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white border-2 border-[#FF7500] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-[#FF7500]">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Resume</h3>
              <p className="text-gray-600">
                Upload your resume and our AI will analyze your skills, experience, and preferences.
              </p>
            </motion.div>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white border-2 border-[#FF7500] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-[#FF7500]">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Matched</h3>
              <p className="text-gray-600">
                Our algorithm matches you with companies that align with your profile and goals.
              </p>
            </motion.div>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white border-2 border-[#FF7500] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-[#FF7500]">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Apply & Connect</h3>
              <p className="text-gray-600">
                Apply directly to your matched companies and start your PM internship journey.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-16 bg-[#FF7500]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Find Your Dream Career?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of students who have found their perfect career opportunities through our platform.
            </p>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-[#FF7500] rounded-lg text-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2 mx-auto"
              >
                <span>Get Started Today</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center space-x-3 mb-4">
                <img 
                  src="/YuktiManthan_logo_clean.svg" 
                  alt="YuktiManthan Logo" 
                  className="w-10 h-10"
                />
                <h1 className="text-2xl font-bold">
                  <span className="text-white">Yukti</span>
                  <span className="text-[#FF7500]">Manthan</span>
                </h1>
              </Link>
              <p className="text-gray-400 mb-4 max-w-md">
                Connecting talented students with amazing career opportunities 
                through AI-powered matching and smart recommendations.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="#features" className="block text-gray-400 hover:text-white transition-colors">
                  Features
                </Link>
                <Link href="#about" className="block text-gray-400 hover:text-white transition-colors">
                  About
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                  Help Center
                </a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 YuktiManthan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
