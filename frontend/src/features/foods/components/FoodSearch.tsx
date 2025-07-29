import { useState } from 'react';
import { Search, Plus, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { foodsApi, Food } from '@/features/foods/api/foodsApi';
import { mealsApi, Meal } from '@/features/meals/api/mealsApi';
import AddFoodToMealModal from './AddFoodToMealModal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const FoodSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();

  const { data: searchResults, isLoading: isSearching, error: searchError } = useQuery<Food[], Error>({
    queryKey: ['food-search', searchQuery],
    queryFn: () => foodsApi.searchFoods(searchQuery),
    enabled: searchQuery.length > 2,
  });

  const { data: barcodeResult, isLoading: isScanningBarcode, error: barcodeError } = useQuery<Food | null, Error>({
    queryKey: ['food-barcode', barcode],
    queryFn: () => foodsApi.searchByBarcode(barcode),
    enabled: barcode.length > 0,
  });

  const { data: meals, error: mealsError } = useQuery<Meal[], Error>({
    queryKey: ['meals', selectedDate],
    queryFn: () => mealsApi.getMeals(selectedDate),
  });

  const handleAddFood = (food: Food) => {
    if (!selectedMealId) {
      toast({
        title: 'Error',
        description: 'Please select a meal first',
        variant: 'destructive',
      });
      return;
    }
    setSelectedFood(food);
    setIsAddFoodModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Food Search</h1>
        
        {/* Meal Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="meal" className="text-sm font-medium">
              Select Meal to Add Food To
            </label>
            <Select value={selectedMealId} onValueChange={setSelectedMealId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a meal" />
              </SelectTrigger>
              <SelectContent>
                {meals?.map((meal) => (
                  <SelectItem key={meal.id} value={meal.id}>
                    {meal.name} ({meal.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Text Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search by Name
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter food name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Barcode Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ScanLine className="h-5 w-5 mr-2" />
                Search by Barcode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter barcode..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Error Messages */}
        {mealsError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              Failed to load meals. Please try refreshing the page.
            </div>
          </div>
        )}

        {meals && meals.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-yellow-800">
              No meals found for {selectedDate}. Create a meal first to add food items.
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Searching foods...</p>
        </div>
      )}

      {searchError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            Failed to search foods. Please try again.
          </div>
        </div>
      )}

      {searchResults && searchResults.length === 0 && searchQuery.length > 2 && !isSearching && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="text-gray-600">
            No foods found for "{searchQuery}". Try a different search term.
          </div>
        </div>
      )}

      {searchResults && searchResults.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-4">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((food) => (
              <Card key={food.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm">{food.name}</h3>
                    <Button size="sm" variant="outline" onClick={() => handleAddFood(food)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {food.brand && (
                    <p className="text-xs text-gray-500 mb-2">{food.brand}</p>
                  )}
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Calories:</span>
                      <span className="font-medium">{food.calories}/100g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protein:</span>
                      <span className="font-medium">{food.protein}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbs:</span>
                      <span className="font-medium">{food.carbs}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fat:</span>
                      <span className="font-medium">{food.fat}g</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Barcode Result */}
      {isScanningBarcode && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Scanning barcode...</p>
        </div>
      )}

      {barcodeError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            Failed to find food with this barcode. Please check the barcode and try again.
          </div>
        </div>
      )}

      {barcodeResult && (
        <div>
          <h2 className="text-lg font-medium mb-4">Barcode Result</h2>
          <Card className="max-w-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{barcodeResult.name}</h3>
                <Button size="sm" variant="outline" onClick={() => handleAddFood(barcodeResult)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {barcodeResult.brand && (
                <p className="text-sm text-gray-500 mb-2">{barcodeResult.brand}</p>
              )}
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Calories:</span>
                  <span className="font-medium">{barcodeResult.calories}/100g</span>
                </div>
                <div className="flex justify-between">
                  <span>Protein:</span>
                  <span className="font-medium">{barcodeResult.protein}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbs:</span>
                  <span className="font-medium">{barcodeResult.carbs}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Fat:</span>
                  <span className="font-medium">{barcodeResult.fat}g</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedFood && selectedMealId && (
        <AddFoodToMealModal
          open={isAddFoodModalOpen}
          onOpenChange={setIsAddFoodModalOpen}
          food={selectedFood}
          mealId={selectedMealId}
        />
      )}
    </div>
  );
};

export default FoodSearch;