'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      // Prevent multiple redirects
      if (!isLoaded || !user || isRedirecting || hasRedirected) {
        console.log('Auth redirect - Early return:', { 
          isLoaded, 
          hasUser: !!user, 
          isRedirecting, 
          hasRedirected 
        });
        return;
      }
      
      console.log('Auth redirect - Processing user:', {
        userId: user.id,
        publicMetadata: user.publicMetadata,
        unsafeMetadata: user.unsafeMetadata,
        currentPath: window.location.pathname,
        storedRole: localStorage.getItem('selectedRole')
      });
      
      setIsRedirecting(true);
      setHasRedirected(true);
      
      try {
        // First, check if user has a role in the database
        const roleResponse = await fetch('/api/get-role');
        let userRole = null;
        
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          if (roleData.hasRole) {
            userRole = roleData.role;
            console.log('Found role in database:', userRole);
            
            // Redirect based on database role
            if (userRole === 'candidate') {
              router.replace('/dashboard');
              return;
            } else if (userRole === 'company') {
              // For companies, check if profile is complete before redirecting
              try {
                const profileResponse = await fetch(`/api/company-profile-check?clerkUserId=${user.id}`);
                if (profileResponse.ok) {
                  const profileData = await profileResponse.json();
                  if (profileData.profileComplete) {
                    // Profile is complete, go to dashboard
                    router.replace('/dashboard');
                  } else {
                    // Profile needs completion
                    router.replace('/company-profile-completion');
                  }
                } else {
                  // Error checking profile, default to completion page
                  router.replace('/company-profile-completion');
                }
              } catch (profileError) {
                console.error('Error checking company profile:', profileError);
                // Default to completion page on error
                router.replace('/company-profile-completion');
              }
              return;
            }
          }
        }
        
        // If no role in database, check metadata
        let role = user.publicMetadata?.role as string;
        
        // If no role in publicMetadata, check unsafeMetadata
        if (!role) {
          role = user.unsafeMetadata?.role as string;
        }

        if (role === 'candidate') {
          console.log('Redirecting candidate to dashboard');
          router.replace('/dashboard');
        } else if (role === 'company') {
          console.log('Redirecting company - checking profile');
          // Check if company profile is complete
          try {
            const profileResponse = await fetch(`/api/company-profile-check?clerkUserId=${user.id}`);
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              if (profileData.profileComplete) {
                // Profile is complete, go to dashboard
                router.replace('/dashboard');
              } else {
                // Profile needs completion, but only redirect if not already there
                if (window.location.pathname !== '/company-profile-completion') {
                  router.replace('/company-profile-completion');
                }
              }
            } else {
              // Error checking profile, default to completion page
              if (window.location.pathname !== '/company-profile-completion') {
                router.replace('/company-profile-completion');
              }
            }
          } catch (profileError) {
            console.error('Error checking company profile:', profileError);
            // Default to completion page on error
            if (window.location.pathname !== '/company-profile-completion') {
              router.replace('/company-profile-completion');
            }
          }
        } else {
          // No role found - this is common for OAuth signins
          // Check if user came from signup (has selectedRole in localStorage)
          const storedRole = localStorage.getItem('selectedRole');
          
          if (storedRole && (storedRole === 'candidate' || storedRole === 'company')) {
            console.log('Setting role from localStorage:', storedRole);
            
            // Set role in database via API
            try {
              const setRoleResponse = await fetch('/api/set-role', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: storedRole }),
              });
              
              if (setRoleResponse.ok) {
                console.log('Role set in database successfully');
              }
            } catch (setRoleError) {
              console.error('Error setting role in database:', setRoleError);
            }
            
            // Update user metadata with the selected role
            try {
              await user.update({
                unsafeMetadata: {
                  ...user.unsafeMetadata,
                  role: storedRole
                }
              });
              
              // Clear localStorage
              localStorage.removeItem('selectedRole');
              
              // Redirect based on role
              if (storedRole === 'candidate') {
                router.replace('/dashboard');
              } else {
                router.replace('/company-profile-completion');
              }
              
              return;
            } catch (updateError) {
              console.error('Error updating user metadata:', updateError);
            }
          }
          
          console.log('No role found and no stored role, redirecting to signup');
          router.replace('/signup');
        }
      } catch (error) {
        console.error('Redirect error:', error);
        router.replace('/');
      }
    };

    // Add a small delay to prevent immediate redirects
    const timeoutId = setTimeout(handleRedirect, 1000); // Increased delay for OAuth
    
    return () => clearTimeout(timeoutId);
  }, [isLoaded, user, router, isRedirecting, hasRedirected]);

  // Don't render anything if user is not loaded yet
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] text-white px-4 py-2 rounded-lg font-bold text-xl shadow-md inline-block mb-6">
            PM
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-[#FF7500] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, return loading state while redirecting
  if (!user) {
    return null;
  }

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="bg-gradient-to-r from-[#FF7500] to-[#FF8A3D] text-white px-4 py-2 rounded-lg font-bold text-xl shadow-md inline-block mb-6">
          PM
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-[#FF7500] mx-auto mb-4" />
        <p className="text-gray-600">
          {isRedirecting ? 'Redirecting...' : 'Setting up your account...'}
        </p>
      </div>
    </div>
  );
}
