import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, Utensils, Target } from 'lucide-react';

interface MonthSummaryProps {
  summary: {
    totalDays: number;
    daysWithData: number;
    averageCalories: number;
    totalCalories: number;
    averageProtein?: number;
    averageCarbs?: number;
    averageFat?: number;
    totalMeals?: number;
  };
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => (
  <div className="text-center">
    <div className="flex justify-center mb-2">
      <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
        {icon}
      </div>
    </div>
    <div className={`text-lg font-bold ${color}`}>{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

export const MonthSummary: React.FC<MonthSummaryProps> = ({ summary }) => {
  const trackingPercentage = Math.round((summary.daysWithData / summary.totalDays) * 100);
  
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Month Overview</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            icon={<Target className="h-5 w-5 text-blue-600" />}
            value={summary.totalCalories.toLocaleString()}
            label="Total Calories"
            color="text-blue-600"
          />
          
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-orange-600" />}
            value={summary.averageCalories}
            label="Avg Daily Calories"
            color="text-orange-600"
          />
          
          <StatCard
            icon={<Calendar className="h-5 w-5 text-green-600" />}
            value={`${summary.daysWithData}/${summary.totalDays}`}
            label="Days Tracked"
            color="text-green-600"
          />
          
          <StatCard
            icon={<Utensils className="h-5 w-5 text-purple-600" />}
            value={summary.totalMeals || 0}
            label="Total Meals"
            color="text-purple-600"
          />
        </div>
        
        {/* Progress bar for tracking percentage */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Tracking Progress</span>
            <span className="text-sm font-medium text-gray-900">{trackingPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${trackingPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Meal category legend */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-600">Breakfast</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600">Lunch</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-gray-600">Dinner</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Snack</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthSummary;
