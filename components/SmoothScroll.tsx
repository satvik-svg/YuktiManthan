'use client'

import { useLenis } from '@/lib/useLenis'

interface SmoothScrollButtonProps {
  targetId: string
  children: React.ReactNode
  className?: string
  offset?: number
}

export const SmoothScrollButton: React.FC<SmoothScrollButtonProps> = ({
  targetId,
  children,
  className = '',
  offset = 0
}) => {
  const lenis = useLenis()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    const target = document.getElementById(targetId)
    if (target && lenis) {
      lenis.scrollTo(target, {
        offset: offset,
        duration: 1.2,
      })
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}

interface SmoothScrollLinkProps {
  targetId: string
  children: React.ReactNode
  className?: string
  offset?: number
}

export const SmoothScrollLink: React.FC<SmoothScrollLinkProps> = ({
  targetId,
  children,
  className = '',
  offset = 0
}) => {
  const lenis = useLenis()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    const target = document.getElementById(targetId)
    if (target && lenis) {
      lenis.scrollTo(target, {
        offset: offset,
        duration: 1.2,
      })
    }
  }

  return (
    <a href={`#${targetId}`} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
