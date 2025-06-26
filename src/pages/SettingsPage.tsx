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
  Globe
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    // Notification Settings
    projectUpdates: true,
    fundingAlerts: true,
    newProjects: false,
    emailNotifications: false,
    
    // Privacy Settings
    publicProfile: true,
    showFundingActivity: true,
    allowDirectMessages: true,
    
    // Platform Settings
    defaultCurrency: 'sats',
    language: 'en',
    autoConnect: true
  });

  const [relays, setRelays] = useState([
    { url: 'wss://relay.damus.io', status: 'connected', read: true, write: true },
    { url: 'wss://nos.lol', status: 'connected', read: true, write: false },
    { url: 'wss://relay.nostr.band', status: 'disconnected', read: true, write: true }
  ]);

  const [newRelay, setNewRelay] = useState('');

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Setting updated",
      description: "Your preferences have been saved",
    });
  };

  const addRelay = () => {
    if (newRelay && !relays.some(r => r.url === newRelay)) {
      setRelays(prev => [...prev, {
        url: newRelay,
        status: 'connecting',
        read: true,
        write: true
      }]);
      setNewRelay('');
      toast({
        title: "Relay added",
        description: "New relay has been added to your list",
      });
    }
  };

  const removeRelay = (url: string) => {
    setRelays(prev => prev.filter(r => r.url !== url));
    toast({
      title: "Relay removed",
      description: "Relay has been removed from your list",
    });
  };

  const toggleRelayPermission = (url: string, type: 'read' | 'write') => {
    setRelays(prev => prev.map(relay => 
      relay.url === url 
        ? { ...relay, [type]: !relay[type] }
        : relay
    ));
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
            <p className="text-muted-foreground">Customize your Angor Hub experience</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
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
                    onValueChange={(value) => updateSetting('defaultCurrency', value)}
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

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email (requires email setup)
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
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
                    onKeyPress={(e) => e.key === 'Enter' && addRelay()}
                  />
                  <Button onClick={addRelay} disabled={!newRelay}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Separator />

                {/* Relay List */}
                <div className="space-y-3">
                  {relays.map((relay) => (
                    <div
                      key={relay.url}
                      className="flex items-center gap-3 p-4 border rounded-lg"
                    >
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(relay.status)}`} />
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{relay.url}</p>
                        <p className="text-sm text-muted-foreground capitalize">{relay.status}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRelayPermission(relay.url, 'read')}
                          className={relay.read ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        >
                          {relay.read ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                          Read
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRelayPermission(relay.url, 'write')}
                          className={relay.write ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        >
                          {relay.write ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                          Write
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRelay(relay.url)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
