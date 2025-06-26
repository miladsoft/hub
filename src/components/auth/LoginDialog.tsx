// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import React, { useRef, useState } from 'react';
import { Shield, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useLoginActions } from '@/hooks/useLoginActions';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup?: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose, onLogin, onSignup }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [nsec, setNsec] = useState('');
  const [bunkerUri, setBunkerUri] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const login = useLoginActions();

  const handleExtensionLogin = () => {
    setIsLoading(true);
    try {
      if (!('nostr' in window)) {
        throw new Error('Nostr extension not found. Please install a NIP-07 extension.');
      }
      login.extension();
      onLogin();
      onClose();
    } catch (error) {
      console.error('Extension login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyLogin = () => {
    if (!nsec.trim()) return;
    setIsLoading(true);
    
    try {
      login.nsec(nsec);
      onLogin();
      onClose();
    } catch (error) {
      console.error('Nsec login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBunkerLogin = () => {
    if (!bunkerUri.trim() || !bunkerUri.startsWith('bunker://')) return;
    setIsLoading(true);
    
    try {
      login.bunker(bunkerUri);
      onLogin();
      onClose();
    } catch (error) {
      console.error('Bunker login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setNsec(content.trim());
    };
    reader.readAsText(file);
  };

  const handleSignupClick = () => {
    onClose();
    if (onSignup) {
      onSignup();
    }
  };
  return (    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-[90vw] max-w-sm mx-auto p-0 overflow-hidden rounded-xl border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800'>
        <DialogHeader className='px-4 pt-4 pb-2 relative'>
          <div className="w-10 h-10 bg-[#086c81] rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <DialogTitle className='text-lg font-bold text-center text-[#086c81]'>
            Welcome to Grants Platform
          </DialogTitle>
          <DialogDescription className='text-center text-muted-foreground mt-1 text-xs'>
            Connect with your Nostr identity
          </DialogDescription>
        </DialogHeader>

        <div className='px-4 py-3 space-y-3'>          <Tabs defaultValue={'nostr' in window ? 'extension' : 'key'} className='w-full'>
            <TabsList className='grid w-full grid-cols-3 mb-3 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg h-8'>
              <TabsTrigger 
                value='extension' 
                className='rounded-md text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#086c81] transition-all duration-200'
              >
                Extension
              </TabsTrigger>
              <TabsTrigger 
                value='key' 
                className='rounded-md text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#086c81] transition-all duration-200'
              >
                Private Key
              </TabsTrigger>
              <TabsTrigger 
                value='bunker' 
                className='rounded-md text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#086c81] transition-all duration-200'
              >
                Bunker
              </TabsTrigger>
            </TabsList>            <TabsContent value='extension' className='space-y-3'>
              <div className='text-center p-3 rounded-lg bg-gradient-to-br from-[#cbdde1]/50 to-[#cbdde1]/30 dark:from-[#022229]/20 dark:to-[#086c81]/10 border border-[#cbdde1] dark:border-[#086c81]'>
                <div className="w-10 h-10 bg-[#086c81] rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Shield className='w-5 h-5 text-white' />
                </div>
                <h3 className="font-semibold text-sm mb-1 text-gray-900 dark:text-white">Browser Extension</h3>
                <p className='text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed'>
                  Secure one-click authentication using your Nostr browser extension.
                </p>
                <Button
                  className='w-full rounded-lg py-2 h-9 bg-[#086c81] hover:bg-[#054e5a] text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm'
                  onClick={handleExtensionLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </div>
                  ) : (
                    'Connect with Extension'
                  )}
                </Button>
                {!('nostr' in window) && (
                  <p className='text-xs text-amber-600 dark:text-amber-400 mt-2'>
                    No extension detected. Please install a Nostr extension like nos2x or Alby.
                  </p>
                )}
              </div>
            </TabsContent>            <TabsContent value='key' className='space-y-4 mt-4'>
              <div className='space-y-4 p-4 rounded-lg bg-gradient-to-br from-[#cbdde1]/50 to-[#cbdde1]/30 dark:from-[#022229]/20 dark:to-[#086c81]/10 border border-[#cbdde1] dark:border-[#086c81]'>
                <div className="text-center mb-3">
                  <div className="w-12 h-12 bg-[#086c81] rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Shield className='w-6 h-6 text-white' />
                  </div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-white">Private Key Login</h3>
                  <p className='text-xs text-gray-600 dark:text-gray-300 mt-1'>
                    Enter your nsec private key to securely access your account
                  </p>
                </div>

                <div className='space-y-3'>
                  <div className='space-y-1'>
                    <label htmlFor='nsec' className='text-xs font-medium text-gray-700 dark:text-gray-300'>
                      Nostr Private Key (nsec)
                    </label>
                    <Input
                      id='nsec'
                      type="password"
                      value={nsec}
                      onChange={(e) => setNsec(e.target.value)}
                      className='rounded-lg border-gray-300 dark:border-gray-600 focus-visible:ring-[#086c81] focus-visible:border-[#086c81] h-9 bg-white/50 dark:bg-gray-900/50 text-sm'
                      placeholder='nsec1...'
                    />
                  </div>

                  <div className='relative'>
                    <div className='absolute inset-0 flex items-center'>
                      <span className='w-full border-t border-gray-300 dark:border-gray-600' />
                    </div>
                    <div className='relative flex justify-center text-xs uppercase'>
                      <span className='bg-white dark:bg-gray-800 px-2 text-gray-500'>Or</span>
                    </div>
                  </div>

                  <div className='text-center'>
                    <input
                      type='file'
                      accept='.txt,.json'
                      className='hidden'
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant='outline'
                      className='w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-900/50 hover:bg-[#cbdde1]/20 dark:hover:bg-[#086c81]/10 h-9 transition-all duration-200 text-sm'
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className='w-3 h-3 mr-2' />
                      Upload Key File
                    </Button>
                  </div>

                  <Button
                    className='w-full rounded-lg py-2 h-9 bg-[#086c81] hover:bg-[#054e5a] text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm'
                    onClick={handleKeyLogin}
                    disabled={isLoading || !nsec.trim()}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      'Access Account'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>            <TabsContent value='bunker' className='space-y-4 mt-4'>
              <div className='space-y-4 p-4 rounded-lg bg-gradient-to-br from-[#cbdde1]/50 to-[#cbdde1]/30 dark:from-[#022229]/20 dark:to-[#086c81]/10 border border-[#cbdde1] dark:border-[#086c81]'>
                <div className="text-center mb-3">
                  <div className="w-12 h-12 bg-[#086c81] rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Shield className='w-6 h-6 text-white' />
                  </div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-white">Remote Signer</h3>
                  <p className='text-xs text-gray-600 dark:text-gray-300 mt-1'>
                    Connect using a remote signing service for enhanced security
                  </p>
                </div>

                <div className='space-y-3'>
                  <div className='space-y-1'>
                    <label htmlFor='bunkerUri' className='text-xs font-medium text-gray-700 dark:text-gray-300'>
                      Bunker Connection URI
                    </label>
                    <Input
                      id='bunkerUri'
                      value={bunkerUri}
                      onChange={(e) => setBunkerUri(e.target.value)}
                      className='rounded-lg border-gray-300 dark:border-gray-600 focus-visible:ring-[#086c81] focus-visible:border-[#086c81] h-9 bg-white/50 dark:bg-gray-900/50 text-sm'
                      placeholder='bunker://...'
                    />
                    {bunkerUri && !bunkerUri.startsWith('bunker://') && (
                      <div className='flex items-center gap-2 text-red-500 text-xs mt-1'>
                        <div className="w-1 h-1 bg-red-500 rounded-full" />
                        URI must start with "bunker://"
                      </div>
                    )}
                  </div>

                  <Button
                    className='w-full rounded-lg py-2 h-9 bg-[#086c81] hover:bg-[#054e5a] text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm'
                    onClick={handleBunkerLogin}
                    disabled={isLoading || !bunkerUri.trim() || !bunkerUri.startsWith('bunker://')}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </div>
                    ) : (
                      'Connect to Remote Signer'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent></Tabs>          <div className='text-center pt-4 border-t border-gray-200 dark:border-gray-700'>
            <div className="space-y-2">
              <p className='text-xs text-gray-600 dark:text-gray-400'>
                New to Nostr?{' '}
                <button
                  onClick={handleSignupClick}
                  className='text-[#086c81] hover:text-[#022229] dark:text-[#086c81] dark:hover:text-[#cbdde1] font-semibold hover:underline transition-colors duration-200'
                >
                  Create your identity
                </button>
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-500 leading-relaxed'>
                Your keys, your identity, your data. Welcome to the decentralized future.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
