import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CalendarSkeletonProps {
  viewType: 'month' | 'week' | 'day';
  className?: string;
}

export const CalendarSkeleton: React.FC<CalendarSkeletonProps> = ({
  viewType,
  className
}) => {
  if (viewType === 'month') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Month summary skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar grid skeleton */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4">
          {/* Day headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((_, i) => (
            <div key={i} className="text-center py-2">
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mx-auto" />
            </div>
          ))}
          
          {/* Calendar days */}
          {[...Array(35)].map((_, i) => (
            <Card key={i} className="h-24 sm:h-32">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col h-full">
                  <div className="h-4 w-6 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="flex-1">
                    <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (viewType === 'week') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Week grid skeleton */}
        <div className="grid grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <Card key={i} className="h-40">
              <CardContent className="p-3">
                <div className="text-center border-b pb-2 mb-2">
                  <div className="h-3 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                  <div className="h-5 w-6 bg-gray-200 rounded animate-pulse mx-auto" />
                </div>
                <div className="space-y-1">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Day view skeleton
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Two-column layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Daily Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Goals */}
          <Card>
            <CardContent className="p-6">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-2 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Meals */}
        <div className="lg:col-span-2 space-y-6">
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="text-center">
                          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarSkeleton;
