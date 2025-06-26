import { useContext } from 'react';
import { RelayContext } from '@/contexts/RelayContext';

export function useRelay() {
  const context = useContext(RelayContext);
  
  if (context === undefined) {
    throw new Error('useRelay must be used within a RelayProvider');
  }
  
  return context;
}
