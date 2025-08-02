import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Award, Target } from 'lucide-react';
import { useWeekProgress } from '../hooks/useNutritionGoals';

interface GoalProgressChartProps {
  goalId: string;
}

export const GoalProgressChart: React.FC<GoalProgressChartProps> = ({ goalId }) => {
  const { data: weekProgress, isLoading, error } = useWeekProgress(goalId);

  const chartData = useMemo(() => {
    if (!weekProgress?.progressData) return null;

    const days = weekProgress.progressData.map((progress) => {
      const date = new Date(progress.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      return {
        dayName,
        date: progress.date,
        overallScore: progress.summary.overallScore,
        goalsMet: progress.summary.totalGoalsMet,
        totalGoals: progress.summary.totalGoalsTracked,
        percentages: progress.percentages,
        status: progress.status,
      };
    });

    return days;
  }, [weekProgress]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !chartData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Unable to load progress data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusBadgeVariant = (status: 'under' | 'met' | 'over') => {
    switch (status) {
      case 'met':
        return 'default';
      case 'under':
        return 'destructive';
      case 'over':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {weekProgress?.aggregates.averageOverallScore.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {weekProgress?.aggregates.totalGoalsMet}
                </div>
                <div className="text-sm text-gray-600">Goals Met</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {getTrendIcon(weekProgress?.aggregates.trends.overallScore.trend || '')}
              <div>
                <div className="text-2xl font-bold">
                  {weekProgress?.aggregates.streaks.currentStreak}
                </div>
                <div className="text-sm text-gray-600">
                  {weekProgress?.aggregates.streaks.streakType === 'good' ? 'Good Days' : 'Streak'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {weekProgress?.aggregates.streaks.maxStreak}
                </div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Progress</CardTitle>
          <CardDescription>
            Your nutrition goal achievement throughout the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress bars for each day */}
            <div className="grid grid-cols-7 gap-2">
              {chartData.map((day) => (
                <div key={day.date} className="text-center space-y-2">
                  <div className="text-xs font-medium text-gray-600">
                    {day.dayName}
                  </div>
                  <div className="relative">
                    <div className={`
                      w-full h-24 rounded-lg flex items-end justify-center p-2 
                      ${getScoreColor(day.overallScore)}
                    `}>
                      <div className="text-xs font-bold">
                        {day.overallScore}%
                      </div>
                    </div>
                    <div className="absolute top-1 right-1">
                      {day.goalsMet === day.totalGoals && (
                        <Award className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.goalsMet}/{day.totalGoals}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div>
                <span>Excellent (90%+)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-50 border border-yellow-200"></div>
                <span>Good (70-90%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-50 border border-red-200"></div>
                <span>Needs Work (&lt;70%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Nutrient Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Nutrient Breakdown</CardTitle>
          <CardDescription>
            Track individual nutrient goals throughout the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {['calories', 'protein', 'carbs', 'fat'].map((nutrient) => (
              <div key={nutrient} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize">{nutrient}</h4>
                  <div className="flex gap-1">
                    {chartData.map((day) => {
                      const status = day.status[nutrient as keyof typeof day.status];
                      return (
                        <Badge 
                          key={day.date}
                          variant={getStatusBadgeVariant(status)}
                          className="w-6 h-6 p-0 text-xs"
                        >
                          {status === 'met' ? '✓' : status === 'over' ? '↑' : '↓'}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                {/* Average percentage for the week */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Weekly Average</span>
                    <span>
                      {Math.round(
                        chartData.reduce((sum, day) => 
                          sum + (day.percentages[nutrient as keyof typeof day.percentages] || 0), 0
                        ) / chartData.length
                      )}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(
                      chartData.reduce((sum, day) => 
                        sum + (day.percentages[nutrient as keyof typeof day.percentages] || 0), 0
                      ) / chartData.length,
                      100
                    )} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {weekProgress?.aggregates.trends && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getTrendIcon(weekProgress.aggregates.trends.overallScore.trend)}
                <span className="text-sm">
                  Overall score is {weekProgress.aggregates.trends.overallScore.trend} 
                  ({weekProgress.aggregates.trends.overallScore.change > 0 ? '+' : ''}
                  {weekProgress.aggregates.trends.overallScore.change.toFixed(1)}% change)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {getTrendIcon(weekProgress.aggregates.trends.calories.trend)}
                <span className="text-sm">
                  Calorie adherence is {weekProgress.aggregates.trends.calories.trend}
                  ({weekProgress.aggregates.trends.calories.change > 0 ? '+' : ''}
                  {weekProgress.aggregates.trends.calories.change.toFixed(1)}% change)
                </span>
              </div>

              {weekProgress.aggregates.streaks.streakType === 'good' && 
               weekProgress.aggregates.streaks.currentStreak >= 3 && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">
                    Great job! You're on a {weekProgress.aggregates.streaks.currentStreak}-day streak 
                    of meeting your goals.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};