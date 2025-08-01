import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MealType } from '@/features/meals/api/mealsApi';
import CreateMealModal from '@/features/meals/components/CreateMealModal';
import EditMealModal from '@/features/meals/components/EditMealModal';
import NutritionGoalsCard from '@/features/nutrition/components/NutritionGoalsCard';
import { formatCalendarDate } from '@/utils/date';
import { useFocusManagement } from '@/hooks/useFocusManagement';

// Modular components
import CalendarHeader from './shared/CalendarHeader';
import DailySummaryCard from './shared/DailySummaryCard';
import MealCategorySection from './shared/MealCategorySection';

// Custom hooks
import { useMealManagement } from '../hooks/useMealManagement';
import { useDailyNutrition } from '../hooks/useDailyNutrition';

// Constants
import { MEAL_CATEGORIES } from '../constants/mealCategories';

const DayView: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  
  // Custom hooks
  const { dailyNutrition: dayData, isLoading, error } = useDailyNutrition({ 
    date: date!, 
    enabled: !!date 
  });
  
  const {
    selectedMeal,
    isCreateModalOpen,
    isEditModalOpen,
    openCreateModal,
    openEditModal,
    closeCreateModal,
    closeEditModal,
    handleDeleteMeal,
    createLiveRegion,
    isDeletingMeal,
  } = useMealManagement({ date });
  
  // Focus management for modals
  const { containerRef: createModalRef } = useFocusManagement({
    trapFocus: true,
    restoreFocus: true,
    autoFocus: true,
  });
  
  const { containerRef: editModalRef } = useFocusManagement({
    trapFocus: true,
    restoreFocus: true,
    autoFocus: true,
  });

  const handleAddMealClick = (type: MealType) => {
    setSelectedMealType(type);
    openCreateModal();
  };

  const handleEditMeal = (meal: any) => {
    openEditModal(meal);
  };

  // Group meals by category
  const mealsByCategory = React.useMemo(() => {
    const defaultCategories: Record<MealType, any[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };
    
    if (!dayData?.meals) return defaultCategories;
    
    return dayData.meals.reduce((acc, meal) => {
      // Use type for backward compatibility, fall back to category
      const category = ((meal as any).type || meal.category || 'snack') as MealType;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(meal);
      return acc;
    }, defaultCategories);
  }, [dayData?.meals]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load daily data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!dayData) {
    return <div>No data found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <CalendarHeader
        title={formatCalendarDate(date!)}
        onNavigatePrevious={() => {}}
        onNavigateNext={() => {}}
        onAddMeal={openCreateModal}
        showAddButton={true}
      />

      {/* Two-column layout for desktop, stacked for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Daily Summary and Nutrition Goals */}
        <div className="lg:col-span-1 space-y-6">
          {/* Daily Summary with Enhanced Visuals */}
          <DailySummaryCard dailyNutrition={dayData} showAdditionalNutrients={true} />

          {/* Nutrition Goals */}
          <NutritionGoalsCard dailyNutrition={dayData} />
        </div>

        {/* Right column: Meals by Category */}
        <div className="lg:col-span-2 space-y-6">
          {MEAL_CATEGORIES.map(category => {
            const meals = mealsByCategory[category.value] || [];
            
            return (
              <MealCategorySection
                key={category.value}
                category={category}
                meals={meals}
                onAddMeal={handleAddMealClick}
                onEditMeal={handleEditMeal}
                onDeleteMeal={handleDeleteMeal}
                isDeletingMeal={isDeletingMeal}
              />
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <div ref={createModalRef as React.RefObject<HTMLDivElement>}>
        <CreateMealModal
          open={isCreateModalOpen}
          onOpenChange={closeCreateModal}
          defaultDate={date || format(new Date(), 'yyyy-MM-dd')}
          defaultType={selectedMealType}
        />
      </div>

      <div ref={editModalRef as React.RefObject<HTMLDivElement>}>
        <EditMealModal
          open={isEditModalOpen}
          onOpenChange={closeEditModal}
          meal={selectedMeal}
          currentDate={date || format(new Date(), 'yyyy-MM-dd')}
        />
      </div>

      {/* Live region for announcements */}
      {createLiveRegion()}
    </div>
  );
};

export default DayView;