import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface MealCardSkeletonProps {
  showFoodEntries?: boolean;
  foodEntriesCount?: number;
}

export const MealCardSkeleton: React.FC<MealCardSkeletonProps> = ({
  showFoodEntries = false,
  foodEntriesCount = 3
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-1" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex space-x-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Macro summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-5 w-12 mx-auto" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
          ))}
        </div>

        {/* Food entries (if expanded) */}
        {showFoodEntries && (
          <div className="space-y-2 pt-4 border-t">
            {Array.from({ length: foodEntriesCount }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MealCardSkeleton;