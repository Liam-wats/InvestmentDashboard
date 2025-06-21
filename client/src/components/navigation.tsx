import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { TrendingUp, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getStoredAuth, clearStoredAuth } from "@/lib/auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavigationProps {
  onAuthAction?: () => void;
}

export function Navigation({ onAuthAction }: NavigationProps) {
  const [location, navigate] = useLocation();
  const [authState, setAuthState] = useState(getStoredAuth());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updateAuthState = () => {
      setAuthState(getStoredAuth());
    };

    // Listen for storage changes
    window.addEventListener('storage', updateAuthState);
    
    // Custom event for auth changes
    window.addEventListener('authStateChange', updateAuthState);

    return () => {
      window.removeEventListener('storage', updateAuthState);
      window.removeEventListener('authStateChange', updateAuthState);
    };
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    setAuthState({ user: null, isAuthenticated: false });
    window.dispatchEvent(new CustomEvent('authStateChange'));
    navigate('/');
    setIsOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setIsOpen(false);
    onAuthAction?.();
  };

  const handleRegister = () => {
    navigate('/register');
    setIsOpen(false);
    onAuthAction?.();
  };

  const NavItems = () => (
    <>
      {authState.isAuthenticated ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            Welcome, {user?.name}
          </span>
          <Button 
            variant="default" 
            onClick={() => navigate('/fund-account')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Fund Account
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleLogin}>
            Login
          </Button>
          <Button onClick={handleRegister} className="bg-emerald-500 hover:bg-emerald-600">
            Create Account
          </Button>
        </div>
      )}
    </>
  );

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              InvestWise
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <NavItems />
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <NavItems />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
