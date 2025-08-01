import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CalendarSkeletonProps {
  viewType?: 'month' | 'week' | 'day';
}

export const CalendarSkeleton: React.FC<CalendarSkeletonProps> = ({ viewType = 'month' }) => {
  if (viewType === 'day') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center space-y-2">
                      <Skeleton className="h-8 w-16 mx-auto" />
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Nutrition Goals Card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Meals */}
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 4 }).map((_, categoryIndex) => (
              <div key={categoryIndex} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
                
                {/* Meal cards */}
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, mealIndex) => (
                    <Card key={mealIndex}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <div className="flex space-x-1">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="text-center space-y-1">
                              <Skeleton className="h-4 w-12 mx-auto" />
                              <Skeleton className="h-3 w-8 mx-auto" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Add meal button skeleton */}
                  <Card className="border-dashed">
                    <CardContent className="p-0">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (viewType === 'month') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        {/* Month Summary */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <Skeleton className="h-8 w-16 mx-auto" />
                  <Skeleton className="h-4 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <Card className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square">
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Week view skeleton
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CalendarSkeleton;