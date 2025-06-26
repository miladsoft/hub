import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  PlayCircle, 
  Heart, 
  Share, 
  Music,
  Flame,
  ArrowUp,
  Clock,
  Users
} from 'lucide-react';

export function TrendingPage() {
  const [timeRange, setTimeRange] = useState('today');

  const trendingTracks = [
    {
      id: 1,
      title: "Midnight Echoes",
      artist: "Luna Beats",
      plays: 125000,
      change: +15,
      duration: "3:42",
      genre: "Electronic",
      cover: "/api/placeholder/60/60"
    },
    {
      id: 2,
      title: "Neon Dreams",
      artist: "Cyber Groove",
      plays: 98500,
      change: +8,
      duration: "4:15",
      genre: "Synthwave",
      cover: "/api/placeholder/60/60"
    },
    {
      id: 3,
      title: "Ocean Waves",
      artist: "Peaceful Mind",
      plays: 87200,
      change: +22,
      duration: "5:30",
      genre: "Ambient",
      cover: "/api/placeholder/60/60"
    },
    {
      id: 4,
      title: "City Lights",
      artist: "Urban Soul",
      plays: 76800,
      change: -5,
      duration: "3:28",
      genre: "Hip Hop",
      cover: "/api/placeholder/60/60"
    },
    {
      id: 5,
      title: "Sunset Boulevard",
      artist: "Retro Vibes",
      plays: 65400,
      change: +12,
      duration: "4:02",
      genre: "Chillwave",
      cover: "/api/placeholder/60/60"
    }
  ];

  const trendingArtists = [
    { name: "Luna Beats", followers: 45000, change: +18 },
    { name: "Cyber Groove", followers: 32000, change: +25 },
    { name: "Peaceful Mind", followers: 28000, change: +8 },
    { name: "Urban Soul", followers: 24000, change: +15 }
  ];

  const timeRanges = [
    { id: 'today', label: 'Today', active: true },
    { id: 'week', label: 'This Week', active: false },
    { id: 'month', label: 'This Month', active: false },
    { id: 'all', label: 'All Time', active: false }
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Trending</h1>
            <p className="text-muted-foreground">Discover what's hot on Grants Platform</p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <Button
              key={range.id}
              variant={timeRange === range.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range.id)}
              className={timeRange === range.id ? 'bg-gradient-to-r from-primary to-accent' : ''}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Trending Tracks */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                Trending Tracks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trendingTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {/* Rank */}
                  <div className="flex items-center gap-3 w-12">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className={`flex items-center gap-1 ${
                      track.change > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      <ArrowUp className={`w-3 h-3 ${track.change < 0 ? 'rotate-180' : ''}`} />
                      <span className="text-xs font-medium">{Math.abs(track.change)}</span>
                    </div>
                  </div>

                  {/* Cover */}
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{track.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {track.plays.toLocaleString()} plays
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {track.genre}
                      </Badge>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {track.duration}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                      <PlayCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                      <Share className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Artists */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Trending Artists
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trendingArtists.map((artist, index) => (
                <div
                  key={artist.name}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {artist.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{artist.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {artist.followers.toLocaleString()} followers
                    </p>
                  </div>
                  <div className="text-green-500 text-xs font-medium flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    +{artist.change}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Trending Genres */}
          <Card>
            <CardHeader>
              <CardTitle>Hot Genres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['Electronic', 'Hip Hop', 'Synthwave', 'Ambient', 'Chillwave'].map((genre, index) => (
                <div key={genre} className="flex items-center justify-between">
                  <span className="font-medium">{genre}</span>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-lg">
                  <p className="text-2xl font-bold text-primary">2.4M</p>
                  <p className="text-xs text-muted-foreground">Total Plays Today</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">1.2K</p>
                  <p className="text-xs text-muted-foreground">New Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TrendingPage;
