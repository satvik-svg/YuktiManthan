import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "YuktiManthan - AI-Powered Career Matching Platform",
  description: "Find your perfect career match with YuktiManthan's AI-powered platform. Upload your resume and get instantly matched with top companies looking for your skills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      afterSignInUrl="/auth-redirect"
      afterSignUpUrl="/auth-redirect" 
      signInUrl="/signin"
      signUpUrl="/signup"
      appearance={{
        variables: {
          colorPrimary: '#FF7500',
          colorBackground: '#FFFFFF',
          colorText: '#1F2937',
        },
        elements: {
          formButtonPrimary: 'bg-[#FF7500] hover:bg-[#E6690A] text-white',
          card: 'shadow-lg border border-orange-100',
          headerTitle: 'text-gray-900',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButton: 'border-orange-200 hover:border-orange-300',
          formFieldInput: 'border-gray-300 focus:border-[#FF7500] focus:ring-[#FF7500]',
          footerActionLink: 'text-[#FF7500] hover:text-[#E6690A]',
        }
      }}
    >
      <html lang="en">
        <body className={`${rubik.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}