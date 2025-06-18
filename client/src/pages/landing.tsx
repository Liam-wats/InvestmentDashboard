import { useEffect } from "react";
import { useLocation } from "wouter";
import { TrendingUp, Shield, DollarSign, BarChart3, Lock, Smartphone, AlertCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStoredAuth } from "@/lib/auth";

export default function Landing() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    const auth = getStoredAuth();
    if (auth.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-16 min-h-screen gradient-bg flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Grow Your Wealth with{" "}
                <span className="text-emerald-400">Smart Investments</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl">
                Join thousands of investors who trust InvestWise to build their financial future. 
                Start investing with as little as $1 and watch your portfolio grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 text-lg font-semibold transition-all transform hover:scale-105"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white hover:text-navy-600 px-8 py-4 text-lg font-semibold"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              {/* Professional investment dashboard mockup illustration */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  <div className="h-12 bg-emerald-400/30 rounded"></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-8 bg-white/20 rounded"></div>
                    <div className="h-8 bg-white/20 rounded"></div>
                    <div className="h-8 bg-white/20 rounded"></div>
                  </div>
                  <div className="h-6 bg-white/20 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose InvestWise?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with expert insights to help you make smarter investment decisions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-hover">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Smart Analytics</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Advanced AI-powered analytics help you identify the best investment opportunities and optimize your portfolio performance.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bank-Level Security</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Your investments are protected with 256-bit encryption, two-factor authentication, and SIPC insurance coverage.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Low Fees</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Start investing with zero commission trades and industry-leading low management fees. Keep more of your returns.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Investors Say
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-hover">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  "InvestWise has completely transformed how I approach investing. The insights are incredibly valuable and the platform is so easy to use. My portfolio has grown 34% this year!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    <span className="text-gray-600 font-semibold">SM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Sarah Mitchell</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Marketing Director</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  "As a beginner investor, I was intimidated by the complexity of other platforms. InvestWise made it simple to understand and start building my financial future. Highly recommend!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    <span className="text-gray-600 font-semibold">DL</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">David Lee</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Software Engineer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  "The security features give me peace of mind, and the low fees mean I keep more of my returns. I've been using InvestWise for 3 years now and couldn't be happier with the results."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    <span className="text-gray-600 font-semibold">RT</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Rachel Torres</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Financial Advisor</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Security is Our Priority
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We use industry-leading security measures to protect your investments and personal information.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">SIPC Insured</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Up to $500,000 protection</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">256-bit SSL</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Bank-level encryption</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2FA Authentication</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Extra account protection</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">24/7 Monitoring</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Fraud detection system</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
