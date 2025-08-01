import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Settings, TrendingUp, Target, Award } from 'lucide-react';
import { DailyNutrition } from '../api/nutritionApi';
import { 
  GoalPeriod,
  GoalType 
} from '../api/nutritionGoalsApi';
import { 
  useActiveNutritionGoal, 
  useTodayProgress 
} from '../hooks/useNutritionGoals';
import { CreateGoalModal } from './CreateGoalModal';
import { GoalProgressChart } from './GoalProgressChart';

interface EnhancedNutritionGoalsCardProps {
  dailyNutrition: DailyNutrition;
  selectedPeriod?: GoalPeriod;
  showCreateButton?: boolean;
}

const statusColors = {
  under: 'bg-red-500',
  met: 'bg-green-500',
  over: 'bg-yellow-500',
};

const statusTextColors = {
  under: 'text-red-600',
  met: 'text-green-600',
  over: 'text-yellow-600',
};

const goalTypeLabels = {
  [GoalType.WEIGHT_LOSS]: 'Weight Loss',
  [GoalType.WEIGHT_GAIN]: 'Weight Gain',
  [GoalType.MAINTENANCE]: 'Maintenance',
  [GoalType.MUSCLE_GAIN]: 'Muscle Gain',
  [GoalType.ATHLETIC_PERFORMANCE]: 'Athletic Performance',
  [GoalType.CUSTOM]: 'Custom',
};

const EnhancedNutritionGoalsCard: React.FC<EnhancedNutritionGoalsCardProps> = ({
  dailyNutrition,
  selectedPeriod = GoalPeriod.DAILY,
  showCreateButton = true,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const { data: activeGoal, isLoading } = useActiveNutritionGoal(selectedPeriod);
  const { data: todayProgress } = useTodayProgress(activeGoal?.id);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeGoal) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Nutrition Goals</CardTitle>
          {showCreateButton && (
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Target className="h-4 w-4 mr-2" />
              Set Goals
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Goals</h3>
            <p className="text-gray-500 mb-4">
              Set your {selectedPeriod} nutrition goals to track your progress
            </p>
            {showCreateButton && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Goals
              </Button>
            )}
          </div>
        </CardContent>

        <CreateGoalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          defaultPeriod={selectedPeriod}
        />
      </Card>
    );
  }

  const getPercentage = (actual: number, goal: number): number => {
    return Math.round((actual / goal) * 100);
  };

  const getProgressColor = (status: 'under' | 'met' | 'over'): string => {
    return statusColors[status];
  };

  const ProgressBar: React.FC<{
    actual: number;
    goal: number;
    label: string;
    unit: string;
    status?: 'under' | 'met' | 'over';
  }> = ({ actual, goal, label, unit, status }) => {
    const percentage = getPercentage(actual, goal);

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium flex items-center gap-2">
            {label}
            {status && (
              <Badge 
                variant="outline" 
                className={`text-xs ${statusTextColors[status]}`}
              >
                {status}
              </Badge>
            )}
          </span>
          <span className="text-gray-600">
            {actual.toFixed(0)}{unit} / {goal.toFixed(0)}{unit} ({percentage}%)
          </span>
        </div>
        <Progress 
          value={Math.min(percentage, 100)} 
          className="h-2"
        />
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {activeGoal.name}
              <Badge variant="outline">
                {goalTypeLabels[activeGoal.goalType]}
              </Badge>
            </CardTitle>
            {activeGoal.description && (
              <p className="text-sm text-gray-600">{activeGoal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsProgressModalOpen(true)}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Overall Progress Summary */}
          {todayProgress && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Today's Progress</span>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-bold">
                    {todayProgress.summary.overallScore}% Complete
                  </span>
                </div>
              </div>
              <Progress value={todayProgress.summary.overallScore} className="h-2" />
              <div className="text-xs text-gray-600 mt-1">
                {todayProgress.summary.totalGoalsMet} of {todayProgress.summary.totalGoalsTracked} goals met
              </div>
            </div>
          )}

          {/* Core Macronutrients */}
          <div className="space-y-3">
            <ProgressBar
              actual={dailyNutrition.calories}
              goal={activeGoal.calorieGoal}
              label="Calories"
              unit=""
              status={todayProgress?.status.calories}
            />
            <ProgressBar
              actual={dailyNutrition.protein}
              goal={activeGoal.proteinGoal}
              label="Protein"
              unit="g"
              status={todayProgress?.status.protein}
            />
            <ProgressBar
              actual={dailyNutrition.carbs}
              goal={activeGoal.carbGoal}
              label="Carbs"
              unit="g"
              status={todayProgress?.status.carbs}
            />
            <ProgressBar
              actual={dailyNutrition.fat}
              goal={activeGoal.fatGoal}
              label="Fat"
              unit="g"
              status={todayProgress?.status.fat}
            />
          </div>

          {/* Extended Nutrients */}
          {(activeGoal.fiberGoal || activeGoal.sodiumGoal) && (
            <div className="border-t pt-4 space-y-3">
              {activeGoal.fiberGoal && (
                <ProgressBar
                  actual={dailyNutrition.fiber}
                  goal={activeGoal.fiberGoal}
                  label="Fiber"
                  unit="g"
                  status={todayProgress?.status.fiber}
                />
              )}
              {activeGoal.sodiumGoal && (
                <ProgressBar
                  actual={dailyNutrition.sodium}
                  goal={activeGoal.sodiumGoal}
                  label="Sodium"
                  unit="mg"
                  status={todayProgress?.status.sodium}
                />
              )}
            </div>
          )}

          {/* Macro Ratios */}
          {todayProgress?.macroRatios && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Macro Ratios</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">Protein</div>
                  <div className="text-gray-600">
                    {todayProgress.macroRatios.actual.protein}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: {todayProgress.macroRatios.target.protein}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Carbs</div>
                  <div className="text-gray-600">
                    {todayProgress.macroRatios.actual.carbs}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: {todayProgress.macroRatios.target.carbs}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Fat</div>
                  <div className="text-gray-600">
                    {todayProgress.macroRatios.actual.fat}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: {todayProgress.macroRatios.target.fat}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Modal */}
      <Dialog open={isProgressModalOpen} onOpenChange={setIsProgressModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Goal Progress - {activeGoal.name}</DialogTitle>
            <DialogDescription>
              Track your progress and analyze trends
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              {todayProgress ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {todayProgress.summary.overallScore}%
                      </div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {todayProgress.summary.totalGoalsMet}
                      </div>
                      <div className="text-sm text-gray-600">Goals Met</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {Math.round(todayProgress.percentages.calories)}%
                      </div>
                      <div className="text-sm text-gray-600">Calories</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {Math.round(todayProgress.percentages.protein)}%
                      </div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No progress data available for today</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="week" className="space-y-4">
              <GoalProgressChart goalId={activeGoal.id} />
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Trend analysis coming soon</p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProgressModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultPeriod={selectedPeriod}
      />
    </>
  );
};

export default EnhancedNutritionGoalsCard;