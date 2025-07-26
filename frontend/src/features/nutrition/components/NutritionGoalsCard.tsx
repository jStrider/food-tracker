import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { NutritionGoals, DailyNutrition } from '@/features/nutrition/api/nutritionApi';

interface NutritionGoalsCardProps {
  dailyNutrition: DailyNutrition;
}

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
  fiber: 25,
  sodium: 2300,
};

const NutritionGoalsCard: React.FC<NutritionGoalsCardProps> = ({ dailyNutrition }) => {
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempGoals, setTempGoals] = useState<NutritionGoals>(goals);

  const handleSaveGoals = () => {
    setGoals(tempGoals);
    setIsDialogOpen(false);
  };

  const getPercentage = (actual: number, goal: number): number => {
    return Math.round((actual / goal) * 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const ProgressBar: React.FC<{ actual: number; goal: number; label: string; unit: string }> = ({
    actual,
    goal,
    label,
    unit,
  }) => {
    const percentage = getPercentage(actual, goal);
    const progressColor = getProgressColor(percentage);

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-gray-600">
            {actual}{unit} / {goal}{unit} ({percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Nutrition Goals</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Nutrition Goals</DialogTitle>
              <DialogDescription>
                Set your daily nutrition targets to track your progress.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="calories" className="text-sm font-medium">
                  Calories
                </label>
                <Input
                  id="calories"
                  type="number"
                  value={tempGoals.calories}
                  onChange={(e) => setTempGoals({ ...tempGoals, calories: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="protein" className="text-sm font-medium">
                  Protein (g)
                </label>
                <Input
                  id="protein"
                  type="number"
                  value={tempGoals.protein}
                  onChange={(e) => setTempGoals({ ...tempGoals, protein: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="carbs" className="text-sm font-medium">
                  Carbs (g)
                </label>
                <Input
                  id="carbs"
                  type="number"
                  value={tempGoals.carbs}
                  onChange={(e) => setTempGoals({ ...tempGoals, carbs: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fat" className="text-sm font-medium">
                  Fat (g)
                </label>
                <Input
                  id="fat"
                  type="number"
                  value={tempGoals.fat}
                  onChange={(e) => setTempGoals({ ...tempGoals, fat: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fiber" className="text-sm font-medium">
                  Fiber (g)
                </label>
                <Input
                  id="fiber"
                  type="number"
                  value={tempGoals.fiber || 0}
                  onChange={(e) => setTempGoals({ ...tempGoals, fiber: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="sodium" className="text-sm font-medium">
                  Sodium (mg)
                </label>
                <Input
                  id="sodium"
                  type="number"
                  value={tempGoals.sodium || 0}
                  onChange={(e) => setTempGoals({ ...tempGoals, sodium: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGoals}>Save Goals</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ProgressBar actual={dailyNutrition.calories} goal={goals.calories} label="Calories" unit="" />
        <ProgressBar actual={dailyNutrition.protein} goal={goals.protein} label="Protein" unit="g" />
        <ProgressBar actual={dailyNutrition.carbs} goal={goals.carbs} label="Carbs" unit="g" />
        <ProgressBar actual={dailyNutrition.fat} goal={goals.fat} label="Fat" unit="g" />
        {goals.fiber && (
          <ProgressBar actual={dailyNutrition.fiber} goal={goals.fiber} label="Fiber" unit="g" />
        )}
        {goals.sodium && (
          <ProgressBar actual={dailyNutrition.sodium} goal={goals.sodium} label="Sodium" unit="mg" />
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionGoalsCard;