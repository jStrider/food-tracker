import { renderHook } from '@testing-library/react';
import { useCalendarStats, useDailyMacros } from '../useCalendarStats';

describe('useCalendarStats', () => {
  const mockData = [
    {
      date: '2024-01-01',
      meals: [
        {
          id: '1',
          category: 'breakfast',
          calories: 400,
          protein: 20,
          carbs: 50,
          fat: 15,
          date: '2024-01-01',
        },
        {
          id: '2',
          category: 'lunch',
          calories: 600,
          protein: 30,
          carbs: 70,
          fat: 25,
          date: '2024-01-01',
        },
      ],
      totalCalories: 1000,
      totalProtein: 50,
      totalCarbs: 120,
      totalFat: 40,
      mealCount: 2,
    },
    {
      date: '2024-01-02',
      meals: [
        {
          id: '3',
          category: 'dinner',
          calories: 800,
          protein: 40,
          carbs: 90,
          fat: 35,
          date: '2024-01-02',
        },
      ],
      totalCalories: 800,
      totalProtein: 40,
      totalCarbs: 90,
      totalFat: 35,
      mealCount: 1,
    },
    {
      date: '2024-01-03',
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      mealCount: 0,
    },
  ];

  it('should calculate stats correctly from data', () => {
    const { result } = renderHook(() => useCalendarStats(mockData));

    expect(result.current).toEqual({
      totalCalories: 1800,
      totalMeals: 3,
      averageCaloriesPerDay: 900,
      daysWithData: 2,
      totalProtein: 90,
      totalCarbs: 210,
      totalFat: 75,
      averageProteinPerDay: 45,
      averageCarbsPerDay: 105,
      averageFatPerDay: 38,
      mealDistribution: {
        breakfast: 1,
        lunch: 1,
        dinner: 1,
        snack: 0,
      },
    });
  });

  it('should return null for undefined data', () => {
    const { result } = renderHook(() => useCalendarStats(undefined));
    expect(result.current).toBeNull();
  });

  it('should return null for empty data', () => {
    const { result } = renderHook(() => useCalendarStats([]));
    expect(result.current).toBeNull();
  });

  it('should handle data with missing meals gracefully', () => {
    const dataWithoutMeals = [
      {
        date: '2024-01-01',
        meals: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealCount: 0,
      },
    ];

    const { result } = renderHook(() => useCalendarStats(dataWithoutMeals));

    expect(result.current).toEqual({
      totalCalories: 0,
      totalMeals: 0,
      averageCaloriesPerDay: 0,
      daysWithData: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      averageProteinPerDay: 0,
      averageCarbsPerDay: 0,
      averageFatPerDay: 0,
      mealDistribution: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        snack: 0,
      },
    });
  });

  it('should recalculate when data changes', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useCalendarStats(data),
      { initialProps: { data: mockData } }
    );

    expect(result.current?.totalCalories).toBe(1800);

    // Update with new data
    const newData = [
      {
        date: '2024-01-04',
        meals: [
          {
            id: '4',
            category: 'snack',
            calories: 200,
            protein: 10,
            carbs: 20,
            fat: 10,
            date: '2024-01-04',
          },
        ],
        totalCalories: 200,
        totalProtein: 10,
        totalCarbs: 20,
        totalFat: 10,
        mealCount: 1,
      },
    ];

    rerender({ data: newData });

    expect(result.current?.totalCalories).toBe(200);
    expect(result.current?.mealDistribution.snack).toBe(1);
  });
});

describe('useDailyMacros', () => {
  it('should calculate macro percentages correctly', () => {
    const dayData = {
      date: '2024-01-01',
      meals: [],
      totalCalories: 2000,
      totalProtein: 150, // 600 calories (150 * 4)
      totalCarbs: 250,   // 1000 calories (250 * 4)
      totalFat: 45,      // 405 calories (45 * 9)
      mealCount: 3,
    };

    const { result } = renderHook(() => useDailyMacros(dayData));

    // Total macro calories: 600 + 1000 + 405 = 2005
    expect(result.current).toEqual({
      proteinPercentage: 30, // 600/2005 ≈ 30%
      carbsPercentage: 50,   // 1000/2005 ≈ 50%
      fatPercentage: 20,     // 405/2005 ≈ 20%
    });
  });

  it('should return zeros for undefined data', () => {
    const { result } = renderHook(() => useDailyMacros(undefined));

    expect(result.current).toEqual({
      proteinPercentage: 0,
      carbsPercentage: 0,
      fatPercentage: 0,
    });
  });

  it('should return zeros for data without calories', () => {
    const dayData = {
      date: '2024-01-01',
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      mealCount: 0,
    };

    const { result } = renderHook(() => useDailyMacros(dayData));

    expect(result.current).toEqual({
      proteinPercentage: 0,
      carbsPercentage: 0,
      fatPercentage: 0,
    });
  });

  it('should handle missing macro values', () => {
    const dayData = {
      date: '2024-01-01',
      meals: [],
      totalCalories: 1000,
      totalProtein: undefined,
      totalCarbs: 100,
      totalFat: undefined,
      mealCount: 1,
    };

    const { result } = renderHook(() => useDailyMacros(dayData as any));

    // Only carbs: 100 * 4 = 400 calories
    expect(result.current).toEqual({
      proteinPercentage: 0,
      carbsPercentage: 100,
      fatPercentage: 0,
    });
  });
});