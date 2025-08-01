import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Calendar, Search, Home, BarChart3, LogOut, User, Menu, X, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ui/error-boundary';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Calendar', href: '/', icon: Calendar },
    { name: 'Foods', href: '/foods', icon: Search },
    { name: 'Goals', href: '/nutrition-goals', icon: Target },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                  <Home className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <span className="text-lg sm:text-xl font-semibold text-gray-900">
                    FoodTracker
                  </span>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Button
                      key={item.name}
                      variant={isActive ? 'default' : 'ghost'}
                      asChild
                      className="flex items-center space-x-2"
                    >
                      <Link to={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </Button>
                  );
                })}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {user?.name || 'My Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {user?.name || 'My Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={cn(
            "md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50 transform transition-all duration-200 ease-in-out",
            isMobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none"
          )}>
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? 'default' : 'ghost'}
                    asChild
                    className="w-full justify-start space-x-3 h-12"
                    onClick={closeMobileMenu}
                  >
                    <Link to={item.href}>
                      <Icon className="h-5 w-5" />
                      <span className="text-base">{item.name}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Layout;