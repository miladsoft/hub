import { useQuery } from '@tanstack/react-query';

interface BitcoinPriceResponse {
  USD: number;
  EUR: number;
  GBP: number;
  CAD: number;
  CHF: number;
  AUD: number;
  JPY: number;
}

export function useBitcoinPrice() {
  return useQuery({
    queryKey: ['bitcoin-price'],
    queryFn: async (): Promise<BitcoinPriceResponse> => {
      const response = await fetch('https://mempool.space/api/v1/prices');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Bitcoin price: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refresh every 1 minute
    retry: 3,
    refetchOnWindowFocus: false,
  });
}
