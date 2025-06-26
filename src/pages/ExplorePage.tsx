import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Target, 
  Users, 
  Clock,
  Bitcoin
} from 'lucide-react';

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  raised: number;
  goal: number;
  progress: number;
  backers: number;
  daysLeft: number;
  creator: {
    name: string;
    avatar: string;
  };
}

interface Creator {
  id: number;
  name: string;
  description: string;
  avatar: string;
  followers: number;
  projects: number;
  totalRaised: number;
}

const categories = [
  { id: 'all', label: 'All Projects', icon: Target },
  { id: 'technology', label: 'Technology', icon: Target },
  { id: 'education', label: 'Education', icon: Target },
  { id: 'environment', label: 'Environment', icon: Target },
  { id: 'infrastructure', label: 'Infrastructure', icon: Target },
];

const sampleData = {
  projects: [
    {
      id: 1,
      title: "Solar Energy Grid",
      description: "Decentralized solar energy network for rural communities",
      category: "Environment",
      raised: 45000,
      goal: 100000,
      progress: 45,
      backers: 89,
      daysLeft: 22,
      creator: {
        name: "GreenTech Solutions",
        avatar: "GT"
      }
    },
    {
      id: 2,
      title: "Open Hardware Platform",
      description: "Building accessible computing hardware for education",
      category: "Technology", 
      raised: 72000,
      goal: 120000,
      progress: 60,
      backers: 156,
      daysLeft: 15,
      creator: {
        name: "EduTech Collective",
        avatar: "EC"
      }
    }
  ] as Project[],
  
  creators: [
    {
      id: 1,
      name: "InnovateLab",
      description: "Building the future with open-source technology",
      avatar: "IL",
      followers: 1420,
      projects: 8,
      totalRaised: 250000
    },
    {
      id: 2,
      name: "GreenFuture Initiative",
      description: "Sustainable solutions for environmental challenges",
      avatar: "GF",
      followers: 896,
      projects: 5,
      totalRaised: 180000
    }
  ] as Creator[]
};

export function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'projects' | 'creators'>('projects');

  const filteredProjects = sampleData.projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           project.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCreators = sampleData.creators.filter(creator =>
    creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Projects</h1>
        <p className="text-muted-foreground mb-6">Discover innovative projects and support creators</p>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search projects and creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'projects' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('projects')}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Projects
          </Button>
          <Button
            variant={activeTab === 'creators' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('creators')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Creators
          </Button>
        </div>

        {/* Category Filters (for projects) */}
        {activeTab === 'projects' && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'projects' ? (
          filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{project.category}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {project.daysLeft} days left
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight">{project.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {project.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    
                    <div className="flex justify-between">
                      <div>
                        <p className="text-lg font-bold text-primary flex items-center gap-1">
                          <Bitcoin className="w-4 h-4" />
                          {project.raised.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          of {project.goal.toLocaleString()} sats goal
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{project.backers}</p>
                        <p className="text-xs text-muted-foreground">backers</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {project.creator.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {project.creator.name}
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        View Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          )
        ) : (
          filteredCreators.length > 0 ? (
            filteredCreators.map((creator) => (
              <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="text-lg font-bold">
                        {creator.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{creator.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {creator.description}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div>
                          <p className="text-sm font-bold">{creator.followers}</p>
                          <p className="text-xs text-muted-foreground">followers</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">{creator.projects}</p>
                          <p className="text-xs text-muted-foreground">projects</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold flex items-center justify-center gap-1">
                            <Bitcoin className="w-3 h-3" />
                            {(creator.totalRaised / 1000).toFixed(0)}K
                          </p>
                          <p className="text-xs text-muted-foreground">sats raised</p>
                        </div>
                      </div>
                      
                      <Button size="sm" className="w-full">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No creators found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ExplorePage;
