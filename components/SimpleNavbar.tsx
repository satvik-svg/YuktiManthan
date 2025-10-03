'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { GoArrowUpRight } from 'react-icons/go';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

export interface SimpleNavbarProps {
  className?: string;
}

const SimpleNavbar: React.FC<SimpleNavbarProps> = ({
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const items = [
    {
      label: 'Features',
      bgColor: '#FFF3E6',
      textColor: '#FF7500',
      links: [
        { label: 'AI Matching', href: '#features', ariaLabel: 'Learn about AI matching' },
        { label: 'Resume Analysis', href: '#features', ariaLabel: 'Learn about resume analysis' }
      ]
    },
    {
      label: 'Companies',
      bgColor: '#FF7500',
      textColor: '#FFFFFF',
      links: [
        { label: 'Top Partners', href: '#companies', ariaLabel: 'View partner companies' },
        { label: 'Success Stories', href: '#testimonials', ariaLabel: 'Read success stories' }
      ]
    },
    {
      label: 'Get Started',
      bgColor: '#4D1D00',
      textColor: '#FFFFFF',
      links: [
        { label: 'Sign Up', href: '/signup', ariaLabel: 'Create new account' },
        { label: 'Sign In', href: '/signin', ariaLabel: 'Sign in to account' }
      ]
    }
  ];

  const toggleMenu = () => {
    if (isAnimating) return; // Prevent multiple clicks during animation
    
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    
    // Reset animation lock after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 400);
  };

  return (
    <div
      className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[99] top-[1.2em] md:top-[2em] ${className}`}
    >
      <nav
        className={`card-nav bg-white rounded-xl shadow-lg relative overflow-hidden transition-[height] duration-300 ease-out ${
          isExpanded ? 'h-[280px] md:h-[200px]' : 'h-[60px]'
        }`}
      >
        <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-[1.1rem] z-[2] bg-white rounded-xl">
          <div
            className={`hamburger-menu group h-full flex flex-col items-center justify-center cursor-pointer gap-[4px] order-2 md:order-none p-2`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
          >
            <div
              className={`hamburger-line w-[24px] h-[2px] bg-orange-500 transition-all duration-200 ease-out origin-center ${
                isExpanded ? 'rotate-45 translate-y-[6px]' : ''
              }`}
            />
            <div
              className={`hamburger-line w-[24px] h-[2px] bg-orange-500 transition-all duration-200 ease-out origin-center ${
                isExpanded ? '-rotate-45 -translate-y-[6px]' : ''
              }`}
            />
          </div>

          <div className="logo-container flex items-center justify-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/YuktiManthan_logo_clean.svg" 
                alt="YuktiManthan Logo" 
                className="w-8 h-8 transition-transform duration-300 hover:scale-110"
              />
              <span className="font-bold text-xl tracking-wide">
                <span className="text-black">Yukti</span>
                <span className="text-[#FF7500]">Manthan</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="hidden md:inline-flex border border-orange-500 text-orange-500 rounded-lg px-4 py-2 font-medium cursor-pointer transition-colors duration-300 hover:bg-orange-50 text-sm">
                  Sign In
                </button>
              </SignInButton>
              <Link href="/signup">
                <button className="hidden md:inline-flex bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg px-4 py-2 font-medium cursor-pointer transition-colors duration-300 hover:from-orange-600 hover:to-red-700 text-sm">
                  Sign Up
                </button>
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>

        <div
          className={`card-nav-content absolute left-0 right-0 top-[60px] p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${
            isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible'
          } md:flex-row md:items-end md:gap-[12px] transition-all duration-200 delay-75`}
        >
          {items.map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className={`nav-card select-none relative flex flex-col gap-2 p-[12px_16px] rounded-lg min-w-0 flex-[1_1_auto] h-auto min-h-[60px] md:h-full md:min-h-0 md:flex-[1_1_0%] transform transition-all duration-200 ${
                isExpanded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'
              }`}
              style={{ 
                backgroundColor: item.bgColor, 
                color: item.textColor,
                transitionDelay: isExpanded ? `${100 + (idx * 50)}ms` : '0ms'
              }}
            >
              <div className="nav-card-label font-normal tracking-[-0.5px] text-[18px] md:text-[22px]">
                {item.label}
              </div>
              <div className="nav-card-links mt-auto flex flex-col gap-[2px]">
                {item.links?.map((lnk, i) => {
                  // Handle authentication links differently
                  if (lnk.href === '/signin' || lnk.href === '/signup') {
                    if (lnk.href === '/signin') {
                      return (
                        <SignedOut key={`${lnk.label}-${i}`}>
                          <SignInButton mode="modal">
                            <button className="nav-card-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-opacity duration-300 hover:opacity-75 text-[15px] md:text-[16px]">
                              <GoArrowUpRight className="nav-card-link-icon shrink-0" aria-hidden="true" />
                              Sign In
                            </button>
                          </SignInButton>
                        </SignedOut>
                      );
                    } else {
                      return (
                        <SignedOut key={`${lnk.label}-${i}`}>
                          <Link
                            href="/signup"
                            className="nav-card-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-opacity duration-300 hover:opacity-75 text-[15px] md:text-[16px]"
                            aria-label={lnk.ariaLabel}
                          >
                            <GoArrowUpRight className="nav-card-link-icon shrink-0" aria-hidden="true" />
                            Sign Up
                          </Link>
                        </SignedOut>
                      );
                    }
                  }
                  
                  return (
                    <Link
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-opacity duration-300 hover:opacity-75 text-[15px] md:text-[16px]"
                      href={lnk.href}
                      aria-label={lnk.ariaLabel}
                    >
                      <GoArrowUpRight className="nav-card-link-icon shrink-0" aria-hidden="true" />
                      {lnk.label}
                    </Link>
                  );
                })}
                {/* Add dashboard link for signed-in users */}
                {item.label === 'Get Started' && (
                  <SignedIn>
                    <Link
                      href="/dashboard"
                      className="nav-card-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-opacity duration-300 hover:opacity-75 text-[15px] md:text-[16px]"
                    >
                      <GoArrowUpRight className="nav-card-link-icon shrink-0" aria-hidden="true" />
                      Dashboard
                    </Link>
                  </SignedIn>
                )}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default SimpleNavbar;
