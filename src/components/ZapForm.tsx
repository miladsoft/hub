import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Zap, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import QRCode from 'qrcode';
import { bech32 } from 'bech32';

interface ZapFormProps {
  zapAddress: string;
  recipientName?: string;
  trigger?: React.ReactNode;
}

export function ZapForm({ 
  zapAddress, 
  recipientName = 'Project', 
  trigger 
}: ZapFormProps) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoice, setInvoice] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentRequested, setPaymentRequested] = useState(false);
  const { toast } = useToast();

  // Suggested amounts in sats
  const suggestedAmounts = [1000, 5000, 10000, 21000, 50000, 100000];

  useEffect(() => {
    if (!isOpen) {
      // Reset form when dialog closes
      setAmount('');
      setMessage('');
      setInvoice('');
      setQrCodeUrl('');
      setPaymentRequested(false);
      setIsGeneratingInvoice(false);
    }
  }, [isOpen]);

  const handleAmountSelect = (sats: number) => {
    setAmount(sats.toString());
  };

  const handleCopyInvoice = async () => {
    if (invoice) {
      try {
        await navigator.clipboard.writeText(invoice);
        toast({
          title: "Invoice Copied",
          description: "Lightning invoice copied to clipboard",
        });
      } catch (error) {
        console.error('Failed to copy invoice:', error);
        toast({
          title: "Copy Failed", 
          description: "Could not copy to clipboard",
          variant: "destructive"
        });
      }
    }
  };

  const decodeLnurl = (lnurl: string): string => {
    try {
      // LNURL is bech32 encoded with 'lnurl' as the human readable part
      const { words } = bech32.decode(lnurl, 2000);
      const data = bech32.fromWords(words);
      return new TextDecoder().decode(new Uint8Array(data));
    } catch {
      throw new Error('Invalid LNURL format');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!amount || parseInt(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount in sats",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingInvoice(true);
    
    try {
      let lnurlEndpoint: string;
      
      // Check if it's an LNURL string
      if (zapAddress.toLowerCase().startsWith('lnurl1')) {
        // Decode LNURL using bech32
        try {
          lnurlEndpoint = decodeLnurl(zapAddress);
        } catch {
          throw new Error('Invalid LNURL format');
        }
      } else {
        // Parse Lightning Address (user@domain.com format)
        const [username, domain] = zapAddress.split('@');
        if (!username || !domain) {
          throw new Error('Invalid Lightning Address format');
        }
        lnurlEndpoint = `https://${domain}/.well-known/lnurlp/${username}`;
      }

      // Fetch the LNURL endpoint
      const lnurlResponse = await fetch(lnurlEndpoint);
      if (!lnurlResponse.ok) {
        throw new Error('Failed to fetch Lightning Address/LNURL info');
      }

      const lnurlData = await lnurlResponse.json();
      
      // Check if the service supports the amount
      const amountMsat = parseInt(amount) * 1000; // Convert sats to millisats
      if (amountMsat < lnurlData.minSendable || amountMsat > lnurlData.maxSendable) {
        throw new Error(`Amount must be between ${lnurlData.minSendable / 1000} and ${lnurlData.maxSendable / 1000} sats`);
      }

      // Request the Lightning invoice
      const invoiceUrl = new URL(lnurlData.callback);
      invoiceUrl.searchParams.set('amount', amountMsat.toString());
      if (message) {
        invoiceUrl.searchParams.set('comment', message);
      }

      const invoiceResponse = await fetch(invoiceUrl.toString());
      if (!invoiceResponse.ok) {
        throw new Error('Failed to generate Lightning invoice');
      }

      const invoiceData = await invoiceResponse.json();
      
      if (invoiceData.status === 'ERROR') {
        throw new Error(invoiceData.reason || 'Invoice generation failed');
      }

      if (!invoiceData.pr) {
        throw new Error('No payment request received');
      }

      setInvoice(invoiceData.pr);
      setPaymentRequested(true);
      
      // Generate QR code for the invoice
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(invoiceData.pr.toUpperCase(), {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeUrl(qrCodeDataUrl);
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError);
        // QR code generation failure shouldn't stop the process
      }
      
      toast({
        title: "Invoice Generated",
        description: `Generated invoice for ${amount} sats`,
      });
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast({
        title: "Invoice Generation Failed",
        description: error instanceof Error ? error.message : "Could not generate Lightning invoice",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleOpenInWallet = async () => {
    if (!invoice) return;

    try {
      // First try WebLN if available (browser extension wallets like Alby)
      if (typeof window !== 'undefined' && (window as typeof window & { webln?: { enable: () => Promise<void>; sendPayment: (invoice: string) => Promise<void> } }).webln) {
        try {
          await (window as typeof window & { webln: { enable: () => Promise<void>; sendPayment: (invoice: string) => Promise<void> } }).webln.enable();
          await (window as typeof window & { webln: { enable: () => Promise<void>; sendPayment: (invoice: string) => Promise<void> } }).webln.sendPayment(invoice);
          toast({
            title: "Payment Initiated",
            description: "Payment request sent to your WebLN wallet",
          });
          return;
        } catch (weblnError) {
          console.log('WebLN failed, falling back to URL opening:', weblnError);
        }
      }

      // Fallback to opening Lightning URL
      const lightningUrl = `lightning:${invoice}`;
      window.open(lightningUrl, '_blank');
    } catch (error) {
      console.error('Failed to open in wallet:', error);
      toast({
        title: "Wallet Open Failed",
        description: "Could not open Lightning wallet. Try copying the invoice manually.",
        variant: "destructive"
      });
    }
  };

  const dialogContent = (
    <DialogContent className="max-w-md mx-4">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
          <span className="truncate">Send Zap to {recipientName}</span>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Zap Address Display */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Lightning Address</Label>
          <div className="flex items-start space-x-2 p-3 bg-muted rounded-md">
            <div className="text-xs sm:text-sm font-mono flex-1 break-all leading-relaxed">
              {zapAddress}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(zapAddress)}
              className="h-6 w-6 p-0 flex-shrink-0 mt-0.5"
              title="Copy Lightning Address"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {!paymentRequested ? (
          <>
            {/* Amount Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Amount (sats)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {suggestedAmounts.map((sats) => (
                  <Button
                    key={sats}
                    variant={amount === sats.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAmountSelect(sats)}
                    className="text-xs sm:text-sm"
                  >
                    <span className="truncate">{sats.toLocaleString()}</span>
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                className="text-sm"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Message (Optional)</Label>
              <Input
                placeholder="Thanks for the great project!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={280}
                className="text-sm"
              />
              <div className="text-xs text-muted-foreground text-right">
                {message.length}/280
              </div>
            </div>

            {/* Generate Invoice Button */}
            <Button 
              onClick={handleGenerateInvoice}
              disabled={isGeneratingInvoice || !amount}
              size="lg"
              className="w-full"
            >
              {isGeneratingInvoice ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 flex-shrink-0" />
                  <span className="truncate">Generating Invoice...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Generate Lightning Invoice</span>
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Payment Invoice */}
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto" />
                <div className="font-medium text-sm sm:text-base">Invoice Generated!</div>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {parseInt(amount).toLocaleString()} sats
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Lightning Invoice</Label>
                
                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="flex justify-center p-2 sm:p-4 bg-white rounded-lg border">
                    <img 
                      src={qrCodeUrl} 
                      alt="Lightning Invoice QR Code" 
                      className="w-40 h-40 sm:w-48 sm:h-48 max-w-full"
                    />
                  </div>
                )}
                
                {/* Invoice Text */}
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-xs font-mono break-all leading-relaxed">
                    {invoice}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyInvoice}
                  className="flex-1 text-xs sm:text-sm"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Copy</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleOpenInWallet}
                  className="flex-1 text-xs sm:text-sm"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Pay Now</span>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center space-y-1">
                <div>Scan QR code or copy invoice to your Lightning wallet</div>
                <div className="text-green-600">
                  ⚡ WebLN compatible wallets will open automatically
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  return dialogContent;
}
