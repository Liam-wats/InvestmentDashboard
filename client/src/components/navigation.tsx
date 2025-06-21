import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { TrendingUp, Menu, X, User, LogOut, Settings, Wallet, DollarSign, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { authService } from "@/lib/auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavigationProps {
  onAuthAction?: () => void;
}

export function Navigation({ onAuthAction }: NavigationProps) {
  const [location, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [user, setUser] = useState(authService.getUser());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updateAuthState = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setUser(authService.getUser());
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
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const NavItems = () => (
    <>
      {isAuthenticated ? (
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-500 text-white">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="w-full cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/fund-account" className="w-full cursor-pointer">
                  <Wallet className="mr-2 h-4 w-4" />
                  Fund Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/withdraw" className="w-full cursor-pointer">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Withdraw
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/kyc-verification" className="w-full cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  Verification
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  {isAuthenticated ? (
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center gap-3 p-4 border-b">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-emerald-500 text-white">
                            {user?.name ? getInitials(user.name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Link 
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <Settings className="h-5 w-5" />
                        Dashboard
                      </Link>
                      <Link 
                        href="/fund-account"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <Wallet className="h-5 w-5" />
                        Fund Account
                      </Link>
                      <Link 
                        href="/withdraw"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <DollarSign className="h-5 w-5" />
                        Withdraw
                      </Link>
                      <Link 
                        href="/kyc-verification"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <Shield className="h-5 w-5" />
                        Verification
                      </Link>
                      <Button 
                        variant="ghost" 
                        onClick={handleLogout}
                        className="flex items-center gap-3 p-3 justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="h-5 w-5" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button variant="ghost" onClick={handleLogin}>
                        Login
                      </Button>
                      <Button onClick={handleRegister} className="bg-emerald-500 hover:bg-emerald-600">
                        Create Account
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
