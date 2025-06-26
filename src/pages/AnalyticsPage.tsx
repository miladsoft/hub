import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  Play,  Heart,
  Download,
  Zap,
  Calendar,
  Music,
  MapPin,
  Eye,
  Share2,
  DollarSign
} from 'lucide-react';

// Mock analytics data
const analyticsData = {
  overview: {
    totalPlays: 45620,
    uniqueListeners: 12840,
    totalEarnings: 892000, // sats
    earningsUSD: 892,
    followers: 3420,
    totalTracks: 24,
    avgRating: 4.7,
    monthlyGrowth: 23.5
  },
  recentTracks: [
    {
      id: 1,
      title: 'Summer Vibes',
      plays: 12450,
      likes: 834,
      downloads: 267,
      earnings: 145000,
      uploadDate: '2024-01-10',
      growth: '+12%'
    },
    {
      id: 2,
      title: 'Midnight Dreams',
      plays: 8920,
      likes: 623,
      downloads: 189,
      earnings: 98000,
      uploadDate: '2024-01-08',
      growth: '+8%'
    },
    {
      id: 3,
      title: 'Electronic Pulse',
      plays: 6780,
      likes: 445,
      downloads: 134,
      earnings: 76000,
      uploadDate: '2024-01-05',
      growth: '+15%'
    }
  ],
  demographics: {
    topCountries: [
      { country: 'United States', percentage: 28, listeners: 3595 },
      { country: 'Germany', percentage: 18, listeners: 2311 },
      { country: 'United Kingdom', percentage: 15, listeners: 1926 },
      { country: 'Canada', percentage: 12, listeners: 1541 },
      { country: 'Australia', percentage: 10, listeners: 1284 },
    ],
    ageGroups: [
      { range: '18-24', percentage: 35 },
      { range: '25-34', percentage: 42 },
      { range: '35-44', percentage: 15 },
      { range: '45+', percentage: 8 }
    ]
  },
  earnings: {
    thisMonth: 245000,
    lastMonth: 198000,
    growth: 23.7,
    breakdown: [
      { source: 'Streaming', amount: 180000, percentage: 73 },
      { source: 'Tips/Zaps', amount: 45000, percentage: 18 },
      { source: 'Downloads', amount: 20000, percentage: 9 }
    ]
  }
};

const timeRanges = ['7 days', '30 days', '90 days', '1 year'];

export function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30 days');
  const [selectedMetric, setSelectedMetric] = useState('plays');

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatSats = (sats: number) => {
    return `${sats.toLocaleString()} sats`;
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your music performance and audience insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
            <TrendingUp className="w-3 h-3 mr-1" />
            Growing
          </Badge>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground mt-2" />
        {timeRanges.map((range) => (
          <Button
            key={range}
            variant={selectedTimeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeRange(range)}
            className={selectedTimeRange === range ? 
              "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" : 
              ""
            }
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalPlays)}</p>
                <p className="text-sm text-muted-foreground">Total Plays</p>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +{analyticsData.overview.monthlyGrowth}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.uniqueListeners)}</p>
                <p className="text-sm text-muted-foreground">Unique Listeners</p>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +{(analyticsData.overview.monthlyGrowth * 0.8).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalEarnings)}</p>
                <p className="text-sm text-muted-foreground">Sats Earned</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <DollarSign className="w-3 h-3" />
                  ${analyticsData.overview.earningsUSD}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.followers)}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +{(analyticsData.overview.monthlyGrowth * 1.2).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Performance Overview
            </CardTitle>
            <div className="flex gap-2">
              {['plays', 'listeners', 'earnings'].map((metric) => (
                <Button
                  key={metric}
                  variant={selectedMetric === metric ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMetric(metric)}
                  className={selectedMetric === metric ? 
                    "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" : 
                    ""
                  }
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-purple-600/60" />
              <p className="text-sm text-muted-foreground">Interactive chart showing {selectedMetric} over {selectedTimeRange}</p>
              <p className="text-xs text-muted-foreground mt-2">Chart visualization would be implemented here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Tracks Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-600" />
              Top Performing Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.recentTracks.map((track, index) => (
                <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 text-center font-semibold text-sm text-muted-foreground">
                    {index + 1}
                  </div>
                  
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Music className="w-6 h-6 text-purple-600/60" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{track.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {formatNumber(track.plays)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {track.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {track.downloads}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatSats(track.earnings)}</p>
                    <Badge variant="outline" className="text-xs text-green-600">
                      {track.growth}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audience Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Audience Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Top Countries */}
              <div>
                <h4 className="font-medium mb-3">Top Countries</h4>
                <div className="space-y-2">
                  {analyticsData.demographics.topCountries.map((country) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <span className="text-sm">{country.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{country.percentage}%</span>
                        <span className="font-medium">{formatNumber(country.listeners)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Age Groups */}
              <div>
                <h4 className="font-medium mb-3">Age Distribution</h4>
                <div className="space-y-2">
                  {analyticsData.demographics.ageGroups.map((group) => (
                    <div key={group.range} className="flex items-center justify-between">
                      <span className="text-sm">{group.range}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Earnings Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatSats(analyticsData.earnings.thisMonth)}
              </div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <div className="flex items-center justify-center gap-1 text-sm text-green-600 mt-1">
                <TrendingUp className="w-3 h-3" />
                +{analyticsData.earnings.growth}% from last month
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground mb-2">
                {formatSats(analyticsData.earnings.lastMonth)}
              </div>
              <p className="text-sm text-muted-foreground">Last Month</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Revenue Sources</h4>
              {analyticsData.earnings.breakdown.map((source) => (
                <div key={source.source} className="flex items-center justify-between text-sm">
                  <span>{source.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{source.percentage}%</span>
                    <span className="font-medium">{formatSats(source.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Boost Your Performance</h3>
              <p className="text-white/80 text-sm">
                Get detailed insights and recommendations to grow your audience
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="text-purple-600 border-white/20">
                <Share2 className="w-4 h-4 mr-2" />
                Share Analytics
              </Button>
              <Button className="bg-white text-purple-600 hover:bg-white/90">
                <Eye className="w-4 h-4 mr-2" />
                Detailed Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
