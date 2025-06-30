import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight,
  Target,
  Shield,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAnimation, motion } from 'framer-motion';

export function HomePage() {
  const features = [
    {
      title: "Decentralized Crowdfunding",
      description: "Funds released in stages, always recoverable by investors.",
      icon: Shield
    },
    {
      title: "Instant Processing",
      description: "Fast and efficient grant management with real-time updates.",
      icon: Zap
    },
    {
      title: "Transparent Discovery",
      description: "Explore and support projects with full transparency via Nostr.",
      icon: Target
    }
  ];

  // Animation controls
  const heroControls = useAnimation();
  const featuresControls = useAnimation();
  const ctaControls = useAnimation();

  useEffect(() => {
    heroControls.start({ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.1 } });
    featuresControls.start({ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2 } });
    ctaControls.start({ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2 } });
  }, [heroControls, featuresControls, ctaControls]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={heroControls}
        className="py-24 px-6"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Grants Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            A new era of Bitcoin crowdfunding—secure, transparent, and decentralized.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/explore">
                Explore Grants
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8">
              <Link to="/explore">
                Apply for Grant
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={featuresControls}
        className="py-20 px-6 bg-muted/30"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2 + index * 0.1 } }}
                className="feature-card-animate"
              >
                <Card className="text-center border-0 shadow-none bg-transparent">
                  <CardContent className="pt-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-xl font-semibold mb-3">{feature.title}</div>
                    <div className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={ctaControls}
        className="py-20 px-6"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the future of grant management
          </p>
          <div>
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/explore">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
