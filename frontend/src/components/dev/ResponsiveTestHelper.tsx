import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface ResponsiveTestHelperProps {
  enabled?: boolean;
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

const DEVICE_PRESETS = {
  mobile: { width: 375, height: 667, name: 'iPhone SE' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  desktop: { width: 1920, height: 1080, name: 'Desktop' },
};

export const ResponsiveTestHelper: React.FC<ResponsiveTestHelperProps> = ({ 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [currentBreakpoint, setCurrentBreakpoint] = useState('');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({ width, height });

      // Determine current breakpoint
      if (width >= BREAKPOINTS['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= BREAKPOINTS.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= BREAKPOINTS.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= BREAKPOINTS.md) {
        setCurrentBreakpoint('md');
      } else if (width >= BREAKPOINTS.sm) {
        setCurrentBreakpoint('sm');
      } else {
        setCurrentBreakpoint('xs');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const simulateDevice = (preset: keyof typeof DEVICE_PRESETS) => {
    const device = DEVICE_PRESETS[preset];
    // In a real app, you might want to actually resize the viewport
    // For now, just show the info
    console.log(`Simulating ${device.name}: ${device.width}x${device.height}`);
  };

  if (!enabled) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          Responsive Test Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current screen info */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Screen:</span>
          <Badge variant="outline">
            {screenSize.width} × {screenSize.height}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Breakpoint:</span>
          <Badge 
            variant={currentBreakpoint === 'xs' ? 'destructive' : 'default'}
          >
            {currentBreakpoint}
          </Badge>
        </div>

        {/* Quick device simulation */}
        <div className="space-y-2">
          <div className="text-sm text-gray-600 mb-2">Quick Test:</div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateDevice('mobile')}
              className="flex-1"
            >
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateDevice('tablet')}
              className="flex-1"
            >
              <Tablet className="h-3 w-3 mr-1" />
              Tablet
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateDevice('desktop')}
              className="flex-1"
            >
              <Monitor className="h-3 w-3 mr-1" />
              Desktop
            </Button>
          </div>
        </div>

        {/* Breakpoint indicators */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Breakpoints:</div>
          <div className="grid grid-cols-3 gap-1 text-xs">
            {Object.entries(BREAKPOINTS).map(([name, size]) => (
              <div
                key={name}
                className={`text-center p-1 rounded ${
                  screenSize.width >= size ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                }`}
              >
                {name}: {size}px
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponsiveTestHelper;