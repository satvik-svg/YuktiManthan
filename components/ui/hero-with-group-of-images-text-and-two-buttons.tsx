import { MoveRight, PhoneCall, Building, Users, Target, Star, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

function Hero() {
  return (
    <div className="w-full py-20 lg:py-40 bg-white ">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 items-center md:grid-cols-2">
          <div className="flex gap-6 flex-col">
            <div className="flex gap-4 flex-col">
              <h1 className="text-5xl md:text-7xl max-w-lg tracking-tighter text-left font-regular">
                <span className="text-black">Find Your Perfect </span>
                <span className="text-[#FF7500] font-bold">Career Match</span>
                <span className="text-black"> with </span>
                <span className="font-bold">
                  <span className="text-[#29292f]">Yukti</span>
                  <span className="text-[#FF7500]">Manthan!</span>
                </span>
              </h1>
              <p className="text-xl leading-relaxed tracking-tight text-gray-600 max-w-md text-left">
                A Government of India initiative connecting talented students with Prime Minister's 
                internship opportunities. Our AI-powered platform analyzes your skills and matches 
                you with prestigious government and private sector organizations across India.
              </p>
              
              {/* India-specific highlights */}
              <div className="bg-gradient-to-r from-orange-50 to-green-50 border border-orange-200 rounded-lg p-4 max-w-md">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🇮🇳</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Digital India Initiative</span>
                </div>
                <p className="text-sm text-gray-600">
                  Empowering youth through skill development and employment opportunities 
                  under the PM's vision for a self-reliant India (Atmanirbhar Bharat).
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-4">
              <Link href="/signin">
                <Button size="lg" className="gap-4" variant="outline">
                  Jump on a call <PhoneCall className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" className="gap-4 bg-[#FF7500] hover:bg-orange-600">
                  Sign up here <MoveRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {/* Stats - India-specific data */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-left">
                <div className="text-3xl font-bold text-[#FF7500]">2000+</div>
                <div className="text-sm text-gray-600">Government Organizations</div>
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-[#FF7500]">50K+</div>
                <div className="text-sm text-gray-600">Successful Placements</div>
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-[#FF7500]">28</div>
                <div className="text-sm text-gray-600">States & UTs Covered</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1 - Top Organizations */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 shadow-sm p-6 aspect-square flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center space-x-2 mb-4">
                <Building className="w-5 h-5 text-[#FF7500]" />
                <span className="text-[#FF7500] text-sm font-semibold">Top Organizations</span>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 p-1">
                    <Image 
                      src="/ISRO-Black.svg" 
                      alt="ISRO" 
                      width={20} 
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-gray-800 text-sm font-medium">ISRO</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 p-1">
                    <Image 
                      src="/drdo-official-seeklogo.svg" 
                      alt="DRDO" 
                      width={20} 
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-gray-800 text-sm font-medium">DRDO</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 p-1">
                    <Image 
                      src="/Oil_and_Natural_Gas_Corporation-Logo.wine.svg" 
                      alt="ONGC" 
                      width={20} 
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-gray-800 text-sm font-medium">ONGC</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 p-1">
                    <Image 
                      src="/jubilant-foodworks-seeklogo-2.svg" 
                      alt="Jubilant Foodworks" 
                      width={20} 
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-gray-800 text-sm font-medium">Jubilant Foodworks</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 p-1">
                    <Image 
                      src="/maruti-suzuki-logo.svg" 
                      alt="Maruti Suzuki" 
                      width={20} 
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-gray-800 text-sm font-medium">Maruti Suzuki</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">+ 1,997 more organizations</div>
            </div>
            
            {/* Card 2 - Government Features (Tall) */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm p-6 row-span-2 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <Zap className="w-5 h-5 text-[#FF7500]" />
                  <span className="text-[#FF7500] text-sm font-semibold">Government Verified</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Aadhaar Integrated Verification</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Skill India Certified</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Digital India Compliant</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Data Privacy Protected</span>
                  </div>
                      <div className="flex items-center space-x-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">CIN Verification </span>
                  </div>
                      <div className="flex items-center space-x-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Regional Language Support</span>
                  </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">NPTEL & SWAYAM Integration </span>
                  </div>
                 
                </div>
              </div>
              <div className="mt-6">
                <div className="text-3xl font-bold text-[#FF7500] mb-1">98%</div>
                <div className="text-xs text-gray-600 mb-3">Government Approval Rate</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#FF7500] to-orange-400 h-2 rounded-full transition-all duration-1000" style={{width: "98%"}}></div>
                </div>
              </div>
            </div>
            
            {/* Card 3 - Indian Youth Community */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 shadow-sm p-6 aspect-square flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-[#FF7500]" />
                <span className="text-[#FF7500] text-sm font-semibold">Yuva Shakti Network</span>
              </div>
              <div className="flex-1">
                <div className="text-3xl font-bold text-[#FF7500] mb-1">2,50,000+</div>
                <div className="text-xs text-gray-600 mb-4">Indian Students & Graduates</div>
                <div className="flex -space-x-2">
                  {[
                    { bg: 'bg-orange-500', initial: 'A' },
                    { bg: 'bg-green-500', initial: 'P' },
                    { bg: 'bg-blue-500', initial: 'S' },
                    { bg: 'bg-indigo-500', initial: 'R' },
                    { bg: 'bg-purple-500', initial: 'M' }
                  ].map((user, i) => (
                    <div key={i} className={`w-6 h-6 ${user.bg} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm`}>
                      {user.initial}
                    </div>
                  ))}
                  <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                    +
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">Join India's largest talent network</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
