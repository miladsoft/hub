import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Settings,
  LogOut,
  User,
  Shield,
  Menu,
  X
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import LoginDialog from '@/components/auth/LoginDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NetworkSelector } from '@/components/NetworkSelector';
import { useToast } from '@/hooks/useToast';
import { useAppContext } from '@/hooks/useAppContext';
import { Sidebar } from '@/components/Sidebar';
import { ThemeLoadingOverlay } from '@/components/ThemeLoading';

interface AngorLayoutProps {
  children: React.ReactNode;
}

export function AngorLayout({ children }: AngorLayoutProps) {
  const { user, metadata } = useCurrentUser();
  const { logout } = useLoginActions();
  const { toast } = useToast();
  const { loading } = useAppContext();
  
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
    } catch (err) {
      toast({
        title: "Error signing out",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
      console.error('Logout error:', err);
    }
  };

  const userDisplayName = metadata?.name || `User ${user?.pubkey.slice(0, 8)}`;
  const userPicture = metadata?.picture;
  const userNip05 = metadata?.nip05;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block w-64 h-full">
          <Sidebar className="h-full" />
        </div>        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 w-64 bg-background flex flex-col" 
                 style={{ 
                   height: '100vh'
                 }}>
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>              <div className="flex-1 overflow-hidden">
                <Sidebar 
                  className="border-0 h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar - Desktop */}
          <div className="hidden lg:flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Grants Platform</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <NetworkSelector />
              <ThemeToggle />
             
            </div>
          </div>

          {/* Top Bar - Mobile */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <h1 className="text-lg font-semibold">Grants Platform</h1>
            
            <div className="flex items-center gap-2">
              <NetworkSelector />
              <ThemeToggle />
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Avatar className="w-6 h-6">
                        {userPicture && <AvatarImage src={userPicture} />}
                        <AvatarFallback className="text-xs">
                          {userDisplayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{userDisplayName}</p>
                        {userNip05 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {userNip05}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogin(true)}
                >
                  Sign in
                </Button>
              )}
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>

      {/* Login Dialog */}
      <LoginDialog 
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={() => {
          setShowLogin(false);
          toast({
            title: "Welcome to Grants Platform!",
            description: "You have successfully signed in with Nostr",
          });
        }}
      />
      
      {/* Global Loading Overlay with fade-out support */}
      <ThemeLoadingOverlay 
        text={loading.message || 'Loading...'} 
        isVisible={loading.isLoading}
      />
    </div>
  );
}

export default AngorLayout;
