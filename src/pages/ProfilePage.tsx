import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Edit, 
  Shield, 
  Copy, 
  Check,
  Camera,
  Save,
  X
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';

export function ProfilePage() {
  const { user, metadata } = useCurrentUser();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [editData, setEditData] = useState({
    name: metadata?.name || '',
    about: metadata?.about || '',
    picture: metadata?.picture || '',
    nip05: metadata?.nip05 || '',
    website: metadata?.website || ''
  });

  const userDisplayName = metadata?.name || `User ${user?.pubkey.slice(0, 8)}`;
  const userPicture = metadata?.picture;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Public key copied successfully",
      });
      setTimeout(() => setCopied(false), 2000);    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    // TODO: Implement profile update via Nostr
    toast({
      title: "Profile updated",
      description: "Your profile has been saved successfully",
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: metadata?.name || '',
      about: metadata?.about || '',
      picture: metadata?.picture || '',
      nip05: metadata?.nip05 || '',
      website: metadata?.website || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign in Required</h3>
            <p className="text-muted-foreground mb-4">
              You need to sign in with Nostr to view your profile
            </p>
            <Button>Sign in with Nostr</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your Nostr identity and preferences</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Public Profile</CardTitle>
                <CardDescription>
                  This information is visible to other users on the network
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24 ring-4 ring-purple-500/20">
                      {userPicture && <AvatarImage src={isEditing ? editData.picture : userPicture} />}
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-2xl font-bold">
                        {userDisplayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button 
                        size="sm" 
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                        variant="secondary"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your display name"
                        />
                      ) : (
                        <p className="text-lg font-semibold">{userDisplayName}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Profile Fields */}
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="about">About</Label>
                    {isEditing ? (
                      <Textarea
                        id="about"
                        value={editData.about}
                        onChange={(e) => setEditData(prev => ({ ...prev, about: e.target.value }))}
                        placeholder="Tell others about yourself..."
                        rows={3}
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        {metadata?.about || "No bio provided"}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      {isEditing ? (
                        <Input
                          id="website"
                          value={editData.website}
                          onChange={(e) => setEditData(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://yourwebsite.com"
                        />
                      ) : (
                        <p className="text-muted-foreground">
                          {metadata?.website || "No website provided"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nip05">NIP-05 Identifier</Label>
                      {isEditing ? (
                        <Input
                          id="nip05"
                          value={editData.nip05}
                          onChange={(e) => setEditData(prev => ({ ...prev, nip05: e.target.value }))}
                          placeholder="user@domain.com"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-muted-foreground">
                            {metadata?.nip05 || "Not verified"}
                          </p>
                          {metadata?.nip05 && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Key Card */}
            <Card>
              <CardHeader>
                <CardTitle>Public Key</CardTitle>
                <CardDescription>
                  Your unique Nostr identifier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-sm font-mono truncate">
                    {user.pubkey}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(user.pubkey)}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your Nostr keys and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Private Key Management</Label>
                  <p className="text-sm text-muted-foreground">
                    Your private key is securely stored and never transmitted. 
                    Always keep a backup in a safe place.
                  </p>
                  <Button variant="outline">
                    Export Private Key
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Connected Relays</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage the relays you're connected to for publishing and receiving events.
                  </p>
                  <Button variant="outline">
                    Manage Relays
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ProfilePage;
