import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Target, Zap, TrendingUp, Activity, Wrench } from 'lucide-react';
import {
  GoalPeriod,
  GoalType,
  CreateNutritionGoalsDto,
  GoalTemplate,
} from '../api/nutritionGoalsApi';
import {
  useCreateNutritionGoals,
  useCreateFromTemplate,
  useGoalTemplates,
} from '../hooks/useNutritionGoals';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPeriod?: GoalPeriod;
}

const goalTypeIcons = {
  [GoalType.WEIGHT_LOSS]: TrendingUp,
  [GoalType.WEIGHT_GAIN]: TrendingUp,
  [GoalType.MAINTENANCE]: Target,
  [GoalType.MUSCLE_GAIN]: Zap,
  [GoalType.ATHLETIC_PERFORMANCE]: Activity,
  [GoalType.CUSTOM]: Wrench,
};

const goalTypeDescriptions = {
  [GoalType.WEIGHT_LOSS]: 'Moderate calorie deficit with high protein to preserve muscle mass',
  [GoalType.WEIGHT_GAIN]: 'Controlled calorie surplus with balanced macronutrients',
  [GoalType.MAINTENANCE]: 'Balanced nutrition to maintain current weight and health',
  [GoalType.MUSCLE_GAIN]: 'Optimized protein intake with slight calorie surplus',
  [GoalType.ATHLETIC_PERFORMANCE]: 'High-energy nutrition to fuel training and recovery',
  [GoalType.CUSTOM]: 'Fully customizable goals tailored to your specific needs',
};

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  defaultPeriod = GoalPeriod.DAILY,
}) => {
  const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template');
  const [selectedGoalType, setSelectedGoalType] = useState<GoalType>(GoalType.MAINTENANCE);
  
  // Template form state
  const [templateData, setTemplateData] = useState<GoalTemplate>({
    goalType: GoalType.MAINTENANCE,
    weight: undefined,
    height: undefined,
    age: undefined,
    gender: undefined,
    activityLevel: 'moderate',
  });

  // Custom form state
  const [customData, setCustomData] = useState<CreateNutritionGoalsDto>({
    name: '',
    description: '',
    period: defaultPeriod,
    goalType: GoalType.CUSTOM,
    calorieGoal: 2000,
    proteinGoal: 150,
    carbGoal: 250,
    fatGoal: 65,
    fiberGoal: 25,
    sodiumGoal: 2300,
    waterGoal: 2500,
    toleranceLower: 90,
    toleranceUpper: 110,
    trackCalories: true,
    trackMacros: true,
    trackMicronutrients: false,
    trackWater: true,
  });

  const { data: templates } = useGoalTemplates();
  const createGoalMutation = useCreateNutritionGoals();
  const createFromTemplateMutation = useCreateFromTemplate();

  const handleTemplateSubmit = async () => {
    try {
      await createFromTemplateMutation.mutateAsync(templateData);
      onClose();
      resetForms();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCustomSubmit = async () => {
    try {
      await createGoalMutation.mutateAsync(customData);
      onClose();
      resetForms();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForms = () => {
    setTemplateData({
      goalType: GoalType.MAINTENANCE,
      weight: undefined,
      height: undefined,
      age: undefined,
      gender: undefined,
      activityLevel: 'moderate',
    });
    setCustomData({
      name: '',
      description: '',
      period: defaultPeriod,
      goalType: GoalType.CUSTOM,
      calorieGoal: 2000,
      proteinGoal: 150,
      carbGoal: 250,
      fatGoal: 65,
      fiberGoal: 25,
      sodiumGoal: 2300,
      waterGoal: 2500,
      toleranceLower: 90,
      toleranceUpper: 110,
      trackCalories: true,
      trackMacros: true,
      trackMicronutrients: false,
      trackWater: true,
    });
    setActiveTab('template');
  };

  const calculateMacroCalories = () => {
    const proteinCals = customData.proteinGoal * 4;
    const carbCals = customData.carbGoal * 4;
    const fatCals = customData.fatGoal * 9;
    return proteinCals + carbCals + fatCals;
  };

  const getMacroPercentages = () => {
    const totalMacroCals = calculateMacroCalories();
    if (totalMacroCals === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    return {
      protein: Math.round(((customData.proteinGoal * 4) / totalMacroCals) * 100),
      carbs: Math.round(((customData.carbGoal * 4) / totalMacroCals) * 100),
      fat: Math.round(((customData.fatGoal * 9) / totalMacroCals) * 100),
    };
  };

  const isCustomFormValid = () => {
    return customData.name.trim() !== '' &&
           customData.calorieGoal > 0 &&
           customData.proteinGoal > 0 &&
           customData.carbGoal > 0 &&
           customData.fatGoal > 0;
  };

  const isTemplateFormValid = () => {
    return templateData.weight && templateData.height && templateData.age && templateData.gender;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Nutrition Goals</DialogTitle>
          <DialogDescription>
            Set up your {defaultPeriod} nutrition goals using a template or custom values
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'template' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Template
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalType">Goal Type</Label>
                <Select 
                  value={selectedGoalType} 
                  onValueChange={(value) => {
                    setSelectedGoalType(value as GoalType);
                    setTemplateData({ ...templateData, goalType: value as GoalType });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(GoalType).map((type) => {
                      const Icon = goalTypeIcons[type];
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  {goalTypeDescriptions[selectedGoalType]}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={templateData.weight || ''}
                    onChange={(e) => setTemplateData({
                      ...templateData,
                      weight: e.target.value ? Number(e.target.value) : undefined
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={templateData.height || ''}
                    onChange={(e) => setTemplateData({
                      ...templateData,
                      height: e.target.value ? Number(e.target.value) : undefined
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="30"
                    value={templateData.age || ''}
                    onChange={(e) => setTemplateData({
                      ...templateData,
                      age: e.target.value ? Number(e.target.value) : undefined
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={templateData.gender || ''} 
                    onValueChange={(value) => setTemplateData({
                      ...templateData,
                      gender: value as 'male' | 'female'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityLevel">Activity Level</Label>
                <Select 
                  value={templateData.activityLevel || 'moderate'} 
                  onValueChange={(value) => setTemplateData({
                    ...templateData,
                    activityLevel: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                    <SelectItem value="light">Light (light exercise 1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (hard exercise 6-7 days/week)</SelectItem>
                    <SelectItem value="very_active">Very Active (physical job + exercise)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {templates && templates[selectedGoalType] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recommended Goals</CardTitle>
                    <CardDescription>
                      Based on the {selectedGoalType.replace('_', ' ')} template
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-lg">
                          {templates[selectedGoalType].calorieGoal}
                        </div>
                        <div className="text-gray-600">Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg">
                          {templates[selectedGoalType].proteinGoal}g
                        </div>
                        <div className="text-gray-600">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg">
                          {templates[selectedGoalType].carbGoal}g
                        </div>
                        <div className="text-gray-600">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg">
                          {templates[selectedGoalType].fatGoal}g
                        </div>
                        <div className="text-gray-600">Fat</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Goal Name</Label>
                  <Input
                    id="name"
                    placeholder="My Custom Goals"
                    value={customData.name}
                    onChange={(e) => setCustomData({ ...customData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your goals..."
                    value={customData.description}
                    onChange={(e) => setCustomData({ ...customData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <Select 
                    value={customData.period} 
                    onValueChange={(value) => setCustomData({ ...customData, period: value as GoalPeriod })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GoalPeriod.DAILY}>Daily</SelectItem>
                      <SelectItem value={GoalPeriod.WEEKLY}>Weekly</SelectItem>
                      <SelectItem value={GoalPeriod.MONTHLY}>Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Core Macronutrients</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={customData.calorieGoal}
                      onChange={(e) => setCustomData({ 
                        ...customData, 
                        calorieGoal: Number(e.target.value) || 0 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={customData.proteinGoal}
                      onChange={(e) => setCustomData({ 
                        ...customData, 
                        proteinGoal: Number(e.target.value) || 0 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={customData.carbGoal}
                      onChange={(e) => setCustomData({ 
                        ...customData, 
                        carbGoal: Number(e.target.value) || 0 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      value={customData.fatGoal}
                      onChange={(e) => setCustomData({ 
                        ...customData, 
                        fatGoal: Number(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>

                {/* Macro Ratios Display */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Macro Calories:</span>
                        <span>{calculateMacroCalories()} cal</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Difference:</span>
                        <span className={Math.abs(customData.calorieGoal - calculateMacroCalories()) > 50 ? 'text-red-600' : 'text-green-600'}>
                          {customData.calorieGoal - calculateMacroCalories()} cal
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <Badge variant="outline">P: {getMacroPercentages().protein}%</Badge>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline">C: {getMacroPercentages().carbs}%</Badge>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline">F: {getMacroPercentages().fat}%</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Additional Goals */}
            <div className="space-y-4">
              <h4 className="font-medium">Additional Goals (Optional)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fiber">Fiber (g)</Label>
                  <Input
                    id="fiber"
                    type="number"
                    value={customData.fiberGoal || ''}
                    onChange={(e) => setCustomData({ 
                      ...customData, 
                      fiberGoal: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sodium">Sodium (mg)</Label>
                  <Input
                    id="sodium"
                    type="number"
                    value={customData.sodiumGoal || ''}
                    onChange={(e) => setCustomData({ 
                      ...customData, 
                      sodiumGoal: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="water">Water (ml)</Label>
                  <Input
                    id="water"
                    type="number"
                    value={customData.waterGoal || ''}
                    onChange={(e) => setCustomData({ 
                      ...customData, 
                      waterGoal: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tolerance">Tolerance (%)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="90"
                      type="number"
                      value={customData.toleranceLower}
                      onChange={(e) => setCustomData({ 
                        ...customData, 
                        toleranceLower: Number(e.target.value) || 90 
                      })}
                    />
                    <Input
                      placeholder="110"
                      type="number"
                      value={customData.toleranceUpper}
                      onChange={(e) => setCustomData({ 
                        ...customData, 
                        toleranceUpper: Number(e.target.value) || 110 
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === 'template' ? (
            <Button
              onClick={handleTemplateSubmit}
              disabled={!isTemplateFormValid() || createFromTemplateMutation.isPending}
            >
              {createFromTemplateMutation.isPending ? 'Creating...' : 'Create from Template'}
            </Button>
          ) : (
            <Button
              onClick={handleCustomSubmit}
              disabled={!isCustomFormValid() || createGoalMutation.isPending}
            >
              {createGoalMutation.isPending ? 'Creating...' : 'Create Custom Goals'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};