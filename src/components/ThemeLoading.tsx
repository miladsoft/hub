import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';

interface ThemeLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function ThemeLoading({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: ThemeLoadingProps) {
  const { theme } = useTheme();
  
  // Use same logos as sidebar based on theme
  const logoSrc = theme === 'light' ? '/logo-name-dark.svg' : '/logo-name-light.svg';
  
  // Size configurations
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto', 
    lg: 'h-16 w-auto'
  };
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Logo with zoom animation */}
      <div className="relative">
        <img 
          src={logoSrc}
          alt="Loading"
          className={`${sizeClasses[size]} animate-zoom-pulse drop-shadow-lg`}
          onError={(e) => {
            // Fallback to simple icon if logo fails to load
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.classList.remove('hidden');
            }
          }}
        />
        
        {/* Fallback icon */}
        <div className={`hidden ${sizeClasses[size]} bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg animate-zoom-pulse drop-shadow-lg flex items-center justify-center text-white font-bold`}>
          <span className="text-xl">G</span>
        </div>
        
        {/* Glowing effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg blur-xl animate-glow-pulse -z-10" />
      </div>
      
      {/* Loading text */}
      {text && (
        <div className={`${textSizes[size]} text-muted-foreground font-medium animate-text-fade`}>
          {text}
        </div>
      )}
      
      {/* Animated dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-dot-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-dot-bounce" style={{ animationDelay: '200ms' }} />
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-dot-bounce" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );
}

// Full screen loading overlay with fade-out support
interface ThemeLoadingOverlayProps {
  text?: string;
  className?: string;
  isVisible?: boolean;
  onAnimationEnd?: () => void;
}

export function ThemeLoadingOverlay({ 
  text = 'Loading...', 
  className = '',
  isVisible = true,
  onAnimationEnd
}: ThemeLoadingOverlayProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [fadeClass, setFadeClass] = useState(isVisible ? 'animate-fade-in' : '');

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setFadeClass('animate-fade-in');
    } else {
      // Start fade-out animation
      setFadeClass('animate-fade-out');
      
      // Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        onAnimationEnd?.();
      }, 300); // Match the fade-out animation duration
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationEnd]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${fadeClass} ${className}`}>
      <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-xl p-8 shadow-2xl">
        <ThemeLoading size="lg" text={text} />
      </div>
    </div>
  );
}

// Small loading component for inline use
export function ThemeLoadingSmall({ 
  text = '', 
  className = '' 
}: { text?: string; className?: string }) {
  const { theme } = useTheme();
  const logoSrc = theme === 'light' ? '/logo-name-dark.svg' : '/logo-name-light.svg';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoSrc}
        alt="Loading"
        className="h-4 w-auto animate-spin-slow opacity-70"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.classList.remove('hidden');
          }
        }}
      />
      <div className="hidden h-4 w-4 bg-orange-500 rounded animate-spin-slow opacity-70" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}
