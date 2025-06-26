import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Bitcoin, 
  Shield, 
  Globe,
  ArrowRight,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';

export function HomePage() {
  const { user } = useCurrentUser();

  // Sample featured projects data
  const featuredProjects = [
    {
      id: 1,
      title: "Green Energy Initiative",
      description: "Revolutionary solar panel technology for developing countries",
      raised: 85000,
      goal: 100000,
      progress: 85,
      backers: 142,
      daysLeft: 12,
      category: "Technology",
      creator: {
        name: "SolarTech Solutions",
        avatar: "ST"
      }
    },
    {
      id: 2,
      title: "Decentralized Mesh Network",
      description: "Building communication infrastructure without central control",
      raised: 67500,
      goal: 150000,
      progress: 45,
      backers: 98,
      daysLeft: 25,
      category: "Infrastructure",
      creator: {
        name: "MeshNet Labs",
        avatar: "ML"
      }
    },
    {
      id: 3,
      title: "Open Source Hardware",
      description: "Creating accessible computing hardware for education",
      raised: 42000,
      goal: 75000,
      progress: 56,
      backers: 187,
      daysLeft: 18,
      category: "Education",
      creator: {
        name: "EduTech Collective",
        avatar: "EC"
      }
    }
  ];

  const stats = [
    {
      label: "Total Raised",
      value: "2.1M",
      unit: "sats",
      icon: Bitcoin,
      change: "+12%"
    },
    {
      label: "Active Projects",
      value: "1,247",
      unit: "",
      icon: Target,
      change: "+8%"
    },
    {
      label: "Contributors",
      value: "15.2K",
      unit: "",
      icon: Users,
      change: "+23%"
    },
    {
      label: "Success Rate",
      value: "78%",
      unit: "",
      icon: TrendingUp,
      change: "+5%"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#cbdde1] to-[#cbdde1]/80 dark:from-[#022229] dark:to-[#086c81]/20 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#086c81] to-[#022229] bg-clip-text text-transparent">
            Angor Hub
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The decentralized Bitcoin crowdfunding platform powered by Nostr. 
            Fund innovative projects, support creators, and build the future with complete transparency and security.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-12">
            <Badge variant="secondary" className="px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Secure Bitcoin Escrow
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Globe className="w-4 h-4 mr-2" />
              Decentralized & Censorship-Resistant
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              Transparent Funding
            </Badge>
          </div>

          {!user ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg text-muted-foreground">
                Get started by connecting your Nostr identity
              </p>
              <LoginArea className="max-w-60" />
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-[#086c81] hover:bg-[#022229] text-white">
                Explore Projects
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                Start a Project
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-8 h-8 text-[#086c81]" />
                    <Badge variant="secondary" className="text-green-600">
                      {stat.change}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {stat.value}
                      {stat.unit && <span className="text-sm text-muted-foreground ml-1">{stat.unit}</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 px-6 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Projects</h2>
            <p className="text-lg text-muted-foreground">
              Discover innovative projects that are making a difference
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
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
                        <p className="text-lg font-bold text-primary">
                          {project.raised.toLocaleString()} sats
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
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline">
              View All Projects
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Angor Hub Works</h2>
            <p className="text-lg text-muted-foreground">
              Simple, secure, and transparent crowdfunding on Bitcoin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Project</h3>
              <p className="text-muted-foreground">
                Launch your project with clear goals, timeline, and funding requirements. 
                All project data is stored on Nostr for transparency.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bitcoin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Funding</h3>
              <p className="text-muted-foreground">
                Contributors fund projects using Bitcoin with built-in escrow protection. 
                Funds are released based on milestone completion.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor project development through regular updates and milestone achievements. 
                Complete transparency from start to finish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-6 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Build the Future?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of innovators and contributors on the world's first 
            decentralized Bitcoin crowdfunding platform.
          </p>
          
          <div className="flex justify-center gap-4">
            <Button size="lg" variant="secondary">
              Start Your Project
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
              Explore Projects
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
