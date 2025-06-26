import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Palette, 
  Wifi, 
  Shield, 
  Bell,
  Trash2,
  Plus,
  X,
  Check,
  Globe,
  Server,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { useNetwork } from '@/contexts/NetworkContext';
import { useIndexer } from '@/contexts/IndexerContext';
import { useRelay } from '@/hooks/useRelay';
import { useSettings } from '@/hooks/useSettings';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { network } = useNetwork();
  const { 
    indexers, 
    addIndexer, 
    removeIndexer, 
    setPrimaryIndexer, 
    resetToDefaults,
    testIndexerConnection 
  } = useIndexer();
  
  const {
    relays,
    addRelay: addRelayToContext,
    removeRelay: removeRelayFromContext,
    toggleRelayPermission: toggleRelayPermissionInContext,
    connectToRelay,
    disconnectFromRelay,
    resetToDefaults: resetRelaysToDefaults,
    testRelayConnection
  } = useRelay();
  
  const { settings, updateSetting } = useSettings();
  
  const [newRelay, setNewRelay] = useState('');
  const [newIndexer, setNewIndexer] = useState('');
  const [testingIndexers, setTestingIndexers] = useState<Set<string>>(new Set());
  const [testingRelays, setTestingRelays] = useState<Set<string>>(new Set());
  const [resettingRelays, setResettingRelays] = useState(false);

  const addNewRelay = async () => {
    if (!newRelay.trim()) return;
    
    try {
      const success = addRelayToContext(newRelay.trim(), network);
      if (success) {
        setNewRelay('');
        toast({
          title: "Relay added",
          description: "New relay has been added to your list",
        });
      } else {
        toast({
          title: "Failed to add relay",
          description: "This relay already exists in your list",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Failed to add relay:', err);
      toast({
        title: "Failed to add relay",
        description: "Unable to add relay",
        variant: "destructive"
      });
    }
  };

  const removeRelayHandler = (url: string) => {
    removeRelayFromContext(url, network);
    toast({
      title: "Relay removed",
      description: "Relay has been removed from your list",
    });
  };

  const toggleRelayPermissionHandler = (url: string, type: 'read' | 'write') => {
    toggleRelayPermissionInContext(url, network, type);
    toast({
      title: "Permission updated",
      description: `${type} permission has been toggled for this relay`,
    });
  };

  const testRelay = async (url: string) => {
    setTestingRelays(prev => new Set([...prev, url]));
    
    try {
      const isOnline = await testRelayConnection(url);
      toast({
        title: isOnline ? "Connection successful" : "Connection failed",
        description: isOnline 
          ? "Relay is online and responding" 
          : "Relay is not responding",
        variant: isOnline ? "default" : "destructive"
      });
    } catch (err) {
      console.error('Test relay error:', err);
      toast({
        title: "Connection test failed",
        description: "Unable to test relay connection",
        variant: "destructive"
      });
    } finally {
      setTestingRelays(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  const connectRelayHandler = async (url: string) => {
    try {
      await connectToRelay(url, network);
      toast({
        title: "Relay connected",
        description: "Successfully connected to relay",
      });
    } catch (err) {
      console.error('Connect relay error:', err);
      toast({
        title: "Connection failed",
        description: "Unable to connect to relay",
        variant: "destructive"
      });
    }
  };

  const disconnectRelayHandler = async (url: string) => {
    try {
      disconnectFromRelay(url, network);
      toast({
        title: "Relay disconnected",
        description: "Successfully disconnected from relay",
      });
    } catch (err) {
      console.error('Disconnect relay error:', err);
      toast({
        title: "Disconnection failed",
        description: "Unable to disconnect from relay",
        variant: "destructive"
      });
    }
  };

  const resetRelaysToDefaultsHandler = async () => {
    setResettingRelays(true);
    try {
      await resetRelaysToDefaults();
      toast({
        title: "Relays reset",
        description: "All relays have been reset to default values and reconnected",
      });
    } catch (error) {
      console.error('Reset relays error:', error);
      toast({
        title: "Reset failed",
        description: "Unable to reset relays to defaults",
        variant: "destructive"
      });
    } finally {
      setResettingRelays(false);
    }
  };

  const addNewIndexer = async () => {
    if (!newIndexer.trim()) return;
    
    const success = addIndexer(newIndexer.trim(), network);
    if (success) {
      setNewIndexer('');
      toast({
        title: "Indexer added",
        description: "New indexer has been added to your list",
      });
    } else {
      toast({
        title: "Failed to add indexer",
        description: "This indexer already exists in your list",
        variant: "destructive"
      });
    }
  };

  const removeIndexerHandler = (url: string) => {
    removeIndexer(url, network);
    toast({
      title: "Indexer removed",
      description: "Indexer has been removed from your list",
    });
  };

  const setPrimaryIndexerHandler = (url: string) => {
    setPrimaryIndexer(url, network);
    toast({
      title: "Primary indexer changed",
      description: "Primary indexer has been updated",
    });
  };

  const testIndexer = async (url: string) => {
    setTestingIndexers(prev => new Set([...prev, url]));
    
    try {
      const isOnline = await testIndexerConnection(url);
      toast({
        title: isOnline ? "Connection successful" : "Connection failed",
        description: isOnline 
          ? "Indexer is online and responding" 
          : "Indexer is not responding",
        variant: isOnline ? "default" : "destructive"
      });
    } catch (err) {
      console.error('Test indexer error:', err);
      toast({
        title: "Connection test failed",
        description: "Unable to test indexer connection",
        variant: "destructive"
      });
    } finally {
      setTestingIndexers(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  const resetIndexersToDefaults = () => {
    resetToDefaults();
    toast({
      title: "Indexers reset",
      description: "All indexers have been reset to default values",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Customize your Grants Platform experience</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="indexers">Indexers</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="relays">Relays</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Platform Preferences
                </CardTitle>
                <CardDescription>
                  Configure default platform settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Default Currency Display</Label>
                    <p className="text-sm text-muted-foreground">
                      How Bitcoin amounts are displayed
                    </p>
                  </div>
                  <Select 
                    value={settings.defaultCurrency} 
                    onValueChange={(value: 'sats' | 'btc') => updateSetting('defaultCurrency', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sats">Sats</SelectItem>
                      <SelectItem value="btc">BTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Language</Label>
                    <p className="text-sm text-muted-foreground">
                      Interface language
                    </p>
                  </div>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value) => updateSetting('language', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-connect to Relays</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically connect to relays when app starts
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoConnect}
                    onCheckedChange={(checked) => updateSetting('autoConnect', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Indexers Settings */}
          <TabsContent value="indexers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Bitcoin Indexers - {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                </CardTitle>
                <CardDescription>
                  Manage Bitcoin indexer endpoints for {network} network. These indexers provide project data and statistics.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Indexer */}
                <div className="flex gap-2">
                  <Input
                    placeholder="https://indexer.example.com/"
                    value={newIndexer}
                    onChange={(e) => setNewIndexer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addNewIndexer()}
                  />
                  <Button onClick={addNewIndexer} disabled={!newIndexer.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button onClick={resetIndexersToDefaults} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                <Separator />

                {/* Indexer List */}
                <div className="space-y-3">
                  {indexers[network].map((indexer) => (
                    <div
                      key={indexer.url}
                      className={`flex items-center gap-3 p-4 border rounded-lg ${
                        indexer.isPrimary ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{indexer.url}</p>
                          {indexer.isPrimary && (
                            <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {indexer.isPrimary ? 'Active indexer for data queries' : 'Backup indexer'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testIndexer(indexer.url)}
                          disabled={testingIndexers.has(indexer.url)}
                        >
                          {testingIndexers.has(indexer.url) ? (
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          Test
                        </Button>
                        
                        {!indexer.isPrimary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPrimaryIndexerHandler(indexer.url)}
                          >
                            Set Primary
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeIndexerHandler(indexer.url)}
                          className="text-red-600 hover:text-red-700"
                          disabled={indexers[network].length === 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {indexers[network].length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No Indexers Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Add at least one indexer to fetch project data.
                    </p>
                    <Button onClick={resetIndexersToDefaults}>
                      Reset to Defaults
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how you receive updates about projects and funding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Project Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when projects you backed post updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.projectUpdates}
                    onCheckedChange={(checked) => updateSetting('projectUpdates', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Funding Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications when funding goals are reached
                    </p>
                  </div>
                  <Switch
                    checked={settings.fundingAlerts}
                    onCheckedChange={(checked) => updateSetting('fundingAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Projects</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new projects in categories you follow
                    </p>
                  </div>
                  <Switch
                    checked={settings.newProjects}
                    onCheckedChange={(checked) => updateSetting('newProjects', checked)}
                  />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Relays Settings */}
          <TabsContent value="relays" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Nostr Relays
                </CardTitle>
                <CardDescription>
                  Manage your Nostr relay connections for publishing and receiving events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Relay */}
                <div className="flex gap-2">
                  <Input
                    placeholder="wss://relay.example.com"
                    value={newRelay}
                    onChange={(e) => setNewRelay(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addNewRelay()}
                  />
                  <Button onClick={addNewRelay} disabled={!newRelay}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Separator />

                {/* Current Network Display */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>Managing relays for: <strong className="capitalize">{network}</strong></span>
                </div>

                {/* Relay List */}
                <div className="space-y-3">
                  {relays[network].map((relay) => (
                    <div
                      key={relay.url}
                      className="flex items-center gap-3 p-4 border rounded-lg"
                    >
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(relay.status)}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{relay.url}</p>
                          {relay.isDefault && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{relay.status}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Connection Controls */}
                        {relay.status === 'disconnected' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => connectRelayHandler(relay.url)}
                            disabled={testingRelays.has(relay.url)}
                          >
                            {testingRelays.has(relay.url) ? (
                              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Wifi className="w-3 h-3 mr-1" />
                            )}
                            Connect
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => disconnectRelayHandler(relay.url)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Disconnect
                          </Button>
                        )}

                        {/* Test Connection */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testRelay(relay.url)}
                          disabled={testingRelays.has(relay.url)}
                        >
                          {testingRelays.has(relay.url) ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                        </Button>

                        {/* Read Permission */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRelayPermissionHandler(relay.url, 'read')}
                          className={relay.read ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        >
                          {relay.read ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                          Read
                        </Button>
                        
                        {/* Write Permission */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRelayPermissionHandler(relay.url, 'write')}
                          className={relay.write ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        >
                          {relay.write ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                          Write
                        </Button>
                        
                        {/* Remove Relay */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRelayHandler(relay.url)}
                          className="text-red-600 hover:text-red-700"
                          disabled={relay.isDefault || relays[network].length === 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reset to Defaults */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="font-medium">Reset to Defaults</p>
                    <p className="text-sm text-muted-foreground">
                      Restore the default relay configuration for {network}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={resetRelaysToDefaultsHandler}
                    disabled={resettingRelays}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${resettingRelays ? 'animate-spin' : ''}`} />
                    {resettingRelays ? 'Resetting...' : 'Reset'}
                  </Button>
                </div>

                {relays[network].length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No Relays Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Add at least one relay to connect to the Nostr network.
                    </p>
                    <Button 
                      onClick={resetRelaysToDefaultsHandler}
                      disabled={resettingRelays}
                    >
                      {resettingRelays ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        'Reset to Defaults'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Control your privacy and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Make your profile and projects visible to others
                    </p>
                  </div>
                  <Switch
                    checked={settings.publicProfile}
                    onCheckedChange={(checked) => updateSetting('publicProfile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Funding Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your funding contributions on your profile
                    </p>
                  </div>
                  <Switch
                    checked={settings.showFundingActivity}
                    onCheckedChange={(checked) => updateSetting('showFundingActivity', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Let other users send you direct messages via Nostr
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowDirectMessages}
                    onCheckedChange={(checked) => updateSetting('allowDirectMessages', checked)}
                  />
                </div>

                <Separator />

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Data Protection</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your data is stored on the decentralized Nostr network. You have full control over your information.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Your private keys never leave your device</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>No centralized data collection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Full ownership of your content</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default SettingsPage;
