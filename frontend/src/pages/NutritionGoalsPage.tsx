import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreVertical, 
  Target, 
  Calendar,
  Play,
  Pause,
  Trash2,
  Edit
} from 'lucide-react';
import {
  GoalPeriod,
  GoalType,
  NutritionGoalsEntity,
} from '@/features/nutrition/api/nutritionGoalsApi';
import {
  useNutritionGoals,
  useActiveGoalsForAllPeriods,
  useActivateNutritionGoal,
  useDeactivateNutritionGoal,
  useDeleteNutritionGoals,
} from '@/features/nutrition/hooks/useNutritionGoals';
import { CreateGoalModal } from '@/features/nutrition/components/CreateGoalModal';
import { GoalProgressChart } from '@/features/nutrition/components/GoalProgressChart';
import EnhancedNutritionGoalsCard from '@/features/nutrition/components/EnhancedNutritionGoalsCard';
import { nutritionApi } from '@/features/nutrition/api/nutritionApi';
import { useQuery } from '@tanstack/react-query';

const goalTypeLabels = {
  [GoalType.WEIGHT_LOSS]: 'Weight Loss',
  [GoalType.WEIGHT_GAIN]: 'Weight Gain',
  [GoalType.MAINTENANCE]: 'Maintenance',
  [GoalType.MUSCLE_GAIN]: 'Muscle Gain',
  [GoalType.ATHLETIC_PERFORMANCE]: 'Athletic Performance',
  [GoalType.CUSTOM]: 'Custom',
};

const periodLabels = {
  [GoalPeriod.DAILY]: 'Daily',
  [GoalPeriod.WEEKLY]: 'Weekly',
  [GoalPeriod.MONTHLY]: 'Monthly',
};

const NutritionGoalsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriod>(GoalPeriod.DAILY);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get today's nutrition for the goals card
  const today = new Date().toISOString().split('T')[0];
  const { data: todayNutrition } = useQuery({
    queryKey: ['nutrition', 'daily', today],
    queryFn: () => nutritionApi.getDailyNutrition(today),
  });

  const { data: allGoals, isLoading: isLoadingGoals } = useNutritionGoals();
  const activeGoalsData = useActiveGoalsForAllPeriods();
  const activateGoalMutation = useActivateNutritionGoal();
  const deactivateGoalMutation = useDeactivateNutritionGoal();
  const deleteGoalMutation = useDeleteNutritionGoals();

  const handleActivateGoal = async (goalId: string) => {
    await activateGoalMutation.mutateAsync(goalId);
  };

  const handleDeactivateGoal = async (goalId: string) => {
    await deactivateGoalMutation.mutateAsync(goalId);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      await deleteGoalMutation.mutateAsync(goalId);
    }
  };

  const GoalCard: React.FC<{ goal: NutritionGoalsEntity }> = ({ goal }) => {
    const macroRatios = {
      protein: Math.round(((goal.proteinGoal * 4) / ((goal.proteinGoal * 4) + (goal.carbGoal * 4) + (goal.fatGoal * 9))) * 100),
      carbs: Math.round(((goal.carbGoal * 4) / ((goal.proteinGoal * 4) + (goal.carbGoal * 4) + (goal.fatGoal * 9))) * 100),
      fat: Math.round(((goal.fatGoal * 9) / ((goal.proteinGoal * 4) + (goal.carbGoal * 4) + (goal.fatGoal * 9))) * 100),
    };

    return (
      <Card className={goal.isActive ? 'ring-2 ring-blue-500' : ''}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{goal.name}</CardTitle>
              {goal.isActive && (
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {goalTypeLabels[goal.goalType]}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {periodLabels[goal.period]}
              </Badge>
            </div>
            {goal.description && (
              <CardDescription>{goal.description}</CardDescription>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {goal.isActive ? (
                <DropdownMenuItem onClick={() => handleDeactivateGoal(goal.id)}>
                  <Pause className="h-4 w-4 mr-2" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleActivateGoal(goal.id)}>
                  <Play className="h-4 w-4 mr-2" />
                  Activate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteGoal(goal.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Goal targets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">{goal.calorieGoal}</div>
              <div className="text-gray-600">Calories</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{goal.proteinGoal}g</div>
              <div className="text-gray-600">Protein</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{goal.carbGoal}g</div>
              <div className="text-gray-600">Carbs</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{goal.fatGoal}g</div>
              <div className="text-gray-600">Fat</div>
            </div>
          </div>

          {/* Macro ratios */}
          <div className="flex justify-center gap-4 text-xs">
            <Badge variant="outline">P: {macroRatios.protein}%</Badge>
            <Badge variant="outline">C: {macroRatios.carbs}%</Badge>
            <Badge variant="outline">F: {macroRatios.fat}%</Badge>
          </div>

          {/* Additional info */}
          {(goal.fiberGoal || goal.sodiumGoal || goal.waterGoal) && (
            <div className="pt-2 border-t">
              <div className="grid grid-cols-3 gap-4 text-xs text-center">
                {goal.fiberGoal && (
                  <div>
                    <div className="font-medium">{goal.fiberGoal}g</div>
                    <div className="text-gray-600">Fiber</div>
                  </div>
                )}
                {goal.sodiumGoal && (
                  <div>
                    <div className="font-medium">{goal.sodiumGoal}mg</div>
                    <div className="text-gray-600">Sodium</div>
                  </div>
                )}
                {goal.waterGoal && (
                  <div>
                    <div className="font-medium">{goal.waterGoal}ml</div>
                    <div className="text-gray-600">Water</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date range if applicable */}
          {(goal.startDate || goal.endDate) && (
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {goal.startDate && new Date(goal.startDate).toLocaleDateString()}
              {goal.startDate && goal.endDate && ' - '}
              {goal.endDate && new Date(goal.endDate).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoadingGoals) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nutrition Goals</h1>
            <p className="text-gray-600">
              Manage your nutrition goals and track your progress
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </div>

        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as GoalPeriod)}>
          <TabsList>
            <TabsTrigger value={GoalPeriod.DAILY}>Daily Goals</TabsTrigger>
            <TabsTrigger value={GoalPeriod.WEEKLY}>Weekly Goals</TabsTrigger>
            <TabsTrigger value={GoalPeriod.MONTHLY}>Monthly Goals</TabsTrigger>
          </TabsList>

          <TabsContent value={GoalPeriod.DAILY} className="space-y-6">
            {/* Active Daily Goal Card */}
            {activeGoalsData.daily.data && todayNutrition && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EnhancedNutritionGoalsCard
                  dailyNutrition={todayNutrition}
                  selectedPeriod={GoalPeriod.DAILY}
                  showCreateButton={false}
                />
                <GoalProgressChart goalId={activeGoalsData.daily.data.id} />
              </div>
            )}

            {/* All Daily Goals */}
            <div>
              <h2 className="text-xl font-semibold mb-4">All Daily Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allGoals?.filter(goal => goal.period === GoalPeriod.DAILY).map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
                {allGoals?.filter(goal => goal.period === GoalPeriod.DAILY).length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Target className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Daily Goals</h3>
                      <p className="text-gray-500 text-center mb-4">
                        Create your first daily nutrition goal to start tracking your progress
                      </p>
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Daily Goal
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value={GoalPeriod.WEEKLY} className="space-y-6">
            {/* Active Weekly Goal */}
            {activeGoalsData.weekly.data && (
              <div className="space-y-6">
                <GoalCard goal={activeGoalsData.weekly.data} />
                <GoalProgressChart goalId={activeGoalsData.weekly.data.id} />
              </div>
            )}

            {/* All Weekly Goals */}
            <div>
              <h2 className="text-xl font-semibold mb-4">All Weekly Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allGoals?.filter(goal => goal.period === GoalPeriod.WEEKLY).map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
                {allGoals?.filter(goal => goal.period === GoalPeriod.WEEKLY).length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Target className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Weekly Goals</h3>
                      <p className="text-gray-500 text-center mb-4">
                        Create weekly goals to track longer-term nutrition patterns
                      </p>
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Weekly Goal
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value={GoalPeriod.MONTHLY} className="space-y-6">
            {/* Active Monthly Goal */}
            {activeGoalsData.monthly.data && (
              <div className="space-y-6">
                <GoalCard goal={activeGoalsData.monthly.data} />
                <GoalProgressChart goalId={activeGoalsData.monthly.data.id} />
              </div>
            )}

            {/* All Monthly Goals */}
            <div>
              <h2 className="text-xl font-semibold mb-4">All Monthly Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allGoals?.filter(goal => goal.period === GoalPeriod.MONTHLY).map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
                {allGoals?.filter(goal => goal.period === GoalPeriod.MONTHLY).length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Target className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Monthly Goals</h3>
                      <p className="text-gray-500 text-center mb-4">
                        Create monthly goals to track long-term nutrition trends
                      </p>
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Monthly Goal
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultPeriod={selectedPeriod}
      />
    </div>
  );
};

export default NutritionGoalsPage;