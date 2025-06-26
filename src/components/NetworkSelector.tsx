import { useNetwork } from '@/contexts/NetworkContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bitcoin } from 'lucide-react';

export function NetworkSelector() {
  const { network, setNetwork } = useNetwork();

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        <Bitcoin className="h-4 w-4" />
        <span>Network:</span>
      </div>
      
      <Select value={network} onValueChange={setNetwork}>
        <SelectTrigger className="w-32 h-8">
          <SelectValue>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={network === 'mainnet' ? 'default' : 'secondary'}
                className={`text-xs ${
                  network === 'mainnet' 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mainnet">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-orange-500 text-xs">
                Mainnet
              </Badge>
              <span className="text-sm">Bitcoin Mainnet</span>
            </div>
          </SelectItem>
          <SelectItem value="testnet">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-500 text-xs">
                Testnet
              </Badge>
              <span className="text-sm">Bitcoin Testnet</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
