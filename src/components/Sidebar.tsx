import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Home, 
  Search, 
  Settings,
  User,
  TrendingUp,
  Bitcoin,
  LogOut
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LoginDialog from '@/components/auth/LoginDialog';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, metadata } = useCurrentUser();
  const { logout } = useLoginActions();  const [showLogin, setShowLogin] = useState(false);  const navigation = [
    { name: 'Home', href: '/', icon: Home, description: 'Discover projects' },
    { name: 'Explore', href: '/explore', icon: Search, description: 'Find projects' },
    { name: 'Settings', href: '/settings', icon: Settings, description: 'App settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const userDisplayName = metadata?.name || `User ${user?.pubkey.slice(0, 8)}`;
  const userPicture = metadata?.picture;  return (
    <div className={`flex flex-col bg-gradient-to-b from-muted/40 to-muted/20 border-r border-border/50 ${className}`} style={{ height: '100%' }}>      {/* Header - Fixed at top */}
      <div className="p-6 border-b border-border/30" style={{ flexShrink: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Angor Hub
              </h1>
              <p className="text-xs text-muted-foreground">Bitcoin Crowdfunding</p>
            </div>
          </div>          <ThemeToggle />
        </div>
      </div>

      {/* Scrollable Content - Takes remaining space but leaves room for profile */}
      <div style={{ flex: '1', overflow: 'hidden' }}>
        <ScrollArea className="px-4" style={{ height: '100%' }}>
          <div className="space-y-6 py-4">
          {/* Main Navigation */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
              Platform
            </h2>
            <div className="space-y-1">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-12 px-3 rounded-xl transition-all duration-200 ${
                    isActive(item.href) 
                      ? 'bg-gradient-to-r from-primary/10 to-accent/10 text-foreground font-medium border border-primary/20 shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-primary' : ''}`} />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
        </ScrollArea>
      </div>      {/* Bottom Section - Fixed at bottom */}
      <div className="p-3 border-t border-border/30 bg-background/50 backdrop-blur-sm" style={{ flexShrink: 0 }}>
        {user ? (
          <div className="w-full">
            {/* User Profile Section */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/70 border border-border/30 w-full">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20 flex-shrink-0">
                {userPicture && <AvatarImage src={userPicture} />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-medium">
                  {userDisplayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate flex-1">{userDisplayName}</p>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gradient-to-r from-accent/20 to-primary/20 text-primary border-primary/30 flex-shrink-0">
                    <Bitcoin className="w-3 h-3 mr-1" />
                    Creator
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Verified Creator
                </p>
              </div>
              
              {/* User Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{userDisplayName}</p>
                        <Badge variant="secondary" className="text-xs bg-gradient-to-r from-accent/20 to-primary/20 text-primary border-primary/30">
                          <Bitcoin className="w-3 h-3 mr-1" />
                          Creator
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {user.pubkey.slice(0, 16)}...
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/creator')}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Creator Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Login Section */}
            <Button 
              onClick={() => setShowLogin(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium h-11"
            >
              <User className="w-4 h-4 mr-2" />
              Sign in with Nostr
            </Button>
            <p className="text-xs text-muted-foreground text-center px-2">
              Connect your Nostr identity to access all features
            </p>
          </div>
        )}
      </div>{/* Login Dialog */}
      <LoginDialog 
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={() => setShowLogin(false)}
      />
    </div>
  );
}