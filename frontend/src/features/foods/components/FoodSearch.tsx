import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, ScanLine, Info, Loader2, X, Star } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { foodsApi, Food } from '@/features/foods/api/foodsApi';
import { mealsApi, Meal } from '@/features/meals/api/mealsApi';
import AddFoodToMealModal from './AddFoodToMealModal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Nutritional info tooltip component
interface NutritionalInfoProps {
  food: Food;
  className?: string;
}

const NutritionalInfo = ({ food, className }: NutritionalInfoProps) => {
  const totalMacros = food.protein + food.carbs + food.fat;
  const proteinPercent = totalMacros > 0 ? (food.protein * 4 / food.calories) * 100 : 0;
  const carbsPercent = totalMacros > 0 ? (food.carbs * 4 / food.calories) * 100 : 0;
  const fatPercent = totalMacros > 0 ? (food.fat * 9 / food.calories) * 100 : 0;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Calories:</span>
            <span className="font-semibold text-orange-600">{food.calories}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Protein:</span>
            <span className="font-semibold text-blue-600">{food.protein}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Carbs:</span>
            <span className="font-semibold text-green-600">{food.carbs}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fat:</span>
            <span className="font-semibold text-red-600">{food.fat}g</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Fiber:</span>
            <span className="font-medium">{food.fiber}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sugar:</span>
            <span className="font-medium">{food.sugar}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sodium:</span>
            <span className="font-medium">{food.sodium}mg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Serving:</span>
            <span className="font-medium">{food.servingSize}</span>
          </div>
        </div>
      </div>
      
      {totalMacros > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Macro Breakdown</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-600">Protein</span>
              <span>{proteinPercent.toFixed(0)}%</span>
            </div>
            <Progress value={proteinPercent} className="h-1 bg-blue-100">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{width: `${proteinPercent}%`}} />
            </Progress>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-600">Carbs</span>
              <span>{carbsPercent.toFixed(0)}%</span>
            </div>
            <Progress value={carbsPercent} className="h-1 bg-green-100">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{width: `${carbsPercent}%`}} />
            </Progress>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-600">Fat</span>
              <span>{fatPercent.toFixed(0)}%</span>
            </div>
            <Progress value={fatPercent} className="h-1 bg-red-100">
              <div className="h-full bg-red-500 rounded-full transition-all" style={{width: `${fatPercent}%`}} />
            </Progress>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Food Card Component
interface FoodCardProps {
  food: Food;
  onAddFood: (food: Food) => void;
  isFromCache?: boolean;
}

const FoodCard = ({ food, onAddFood, isFromCache = false }: FoodCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 mr-3">
            <h3 className="font-semibold text-sm leading-tight mb-1">{food.name}</h3>
            {food.brand && (
              <p className="text-xs text-gray-500 mb-2">{food.brand}</p>
            )}
            {isFromCache && (
              <Badge variant="secondary" className="text-xs mb-2">
                <Star className="w-3 h-3 mr-1" />
                Cached
              </Badge>
            )}
          </div>
          
          <div className="flex gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Info className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-semibold">{food.name}</h4>
                  {food.brand && <p className="text-sm text-gray-600">{food.brand}</p>}
                  <Separator />
                  <NutritionalInfo food={food} />
                </div>
              </PopoverContent>
            </Popover>
            
            <Button size="sm" variant="outline" onClick={() => onAddFood(food)} className="h-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Cal:</span>
            <span className="font-semibold text-orange-600">{food.calories}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Protein:</span>
            <span className="font-semibold text-blue-600">{food.protein}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Carbs:</span>
            <span className="font-semibold text-green-600">{food.carbs}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fat:</span>
            <span className="font-semibold text-red-600">{food.fat}g</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FoodSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Debounced search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Enhanced search with debouncing and caching
  const { data: searchResults, isLoading: isSearching, error: searchError } = useQuery<Food[], Error>({
    queryKey: ['food-search', debouncedSearchQuery],
    queryFn: () => foodsApi.searchFoods(debouncedSearchQuery),
    enabled: debouncedSearchQuery.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  // Enhanced barcode search with better error handling
  const { data: barcodeResult, isLoading: isScanningBarcode, error: barcodeError } = useQuery<Food | null, Error>({
    queryKey: ['food-barcode', barcode],
    queryFn: () => foodsApi.searchByBarcode(barcode),
    enabled: barcode.length >= 8, // Minimum barcode length
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
  });

  // Meals query with caching
  const { data: meals, error: mealsError } = useQuery<Meal[], Error>({
    queryKey: ['meals', selectedDate],
    queryFn: () => mealsApi.getMeals(selectedDate),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Enhanced keyboard navigation for autocomplete
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showAutocomplete || !searchResults?.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedFood = searchResults[selectedSuggestionIndex];
          handleSelectFood(selectedFood);
        }
        break;
      case 'Escape':
        setShowAutocomplete(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showAutocomplete, searchResults, selectedSuggestionIndex]);

  // Handle food selection from autocomplete
  const handleSelectFood = useCallback((food: Food) => {
    setSearchQuery(food.name);
    setShowAutocomplete(false);
    setSelectedSuggestionIndex(-1);
    handleAddFood(food);
  }, []);

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

  const clearSearch = () => {
    setSearchQuery('');
    setShowAutocomplete(false);
    setSelectedSuggestionIndex(-1);
    searchInputRef.current?.focus();
  };

  const clearBarcode = () => {
    setBarcode('');
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show autocomplete when we have search results
  useEffect(() => {
    if (searchResults && searchResults.length > 0 && debouncedSearchQuery.length > 2) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  }, [searchResults, debouncedSearchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Food Search</h1>
          <Badge variant="outline" className="text-sm">
            {searchResults?.length || 0} results
          </Badge>
        </div>
        
        {/* Meal Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium text-gray-700">
              Date
            </label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="meal" className="text-sm font-medium text-gray-700">
              Select Meal to Add Food To
            </label>
            <Select value={selectedMealId} onValueChange={setSelectedMealId}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a meal" />
              </SelectTrigger>
              <SelectContent>
                {meals?.map((meal) => (
                  <SelectItem key={meal.id} value={meal.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{meal.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {meal.category}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Enhanced Text Search with Autocomplete */}
          <Card className="border-blue-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Search className="h-5 w-5 mr-2 text-blue-600" />
                Search by Name
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative" ref={autocompleteRef}>
                <div className="relative">
                  <Input
                    ref={searchInputRef}
                    placeholder="Type food name for instant search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedSuggestionIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (searchResults && searchResults.length > 0 && debouncedSearchQuery.length > 2) {
                        setShowAutocomplete(true);
                      }
                    }}
                    className="pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  )}
                  
                  {searchQuery && !isSearching && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Autocomplete Dropdown */}
                {showAutocomplete && searchResults && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
                    {searchResults.slice(0, 8).map((food, index) => (
                      <div
                        key={food.id}
                        className={cn(
                          'px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors',
                          selectedSuggestionIndex === index && 'bg-blue-50'
                        )}
                        onClick={() => handleSelectFood(food)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{food.name}</div>
                            {food.brand && (
                              <div className="text-xs text-gray-500">{food.brand}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {food.calories} cal
                            </Badge>
                            <Plus className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                    {searchResults.length > 8 && (
                      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 text-center">
                        +{searchResults.length - 8} more results below
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {searchQuery.length > 0 && searchQuery.length <= 2 && (
                <p className="text-xs text-gray-500 mt-2">
                  Type at least 3 characters to search
                </p>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Barcode Search */}
          <Card className="border-green-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <ScanLine className="h-5 w-5 mr-2 text-green-600" />
                Search by Barcode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  placeholder="Enter or scan barcode..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="pr-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                
                {isScanningBarcode && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                  </div>
                )}
                
                {barcode && !isScanningBarcode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearBarcode}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {barcode.length > 0 && barcode.length < 8 && (
                <p className="text-xs text-gray-500 mt-2">
                  Barcode should be at least 8 digits
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Error Messages and Status */}
        <div className="mt-6 space-y-4">
          {mealsError && (
            <div className="bg-red-50 border-l-4 border-l-red-400 p-4 rounded-r-md">
              <div className="flex items-center">
                <div className="text-red-700">
                  <strong>Error:</strong> Failed to load meals. Please try refreshing the page.
                </div>
              </div>
            </div>
          )}

          {meals && meals.length === 0 && (
            <div className="bg-amber-50 border-l-4 border-l-amber-400 p-4 rounded-r-md">
              <div className="text-amber-800">
                <strong>No meals found</strong> for {format(new Date(selectedDate), 'MMMM d, yyyy')}. 
                <span className="block mt-1">Create a meal first to add food items.</span>
              </div>
            </div>
          )}

          {searchError && (
            <div className="bg-red-50 border-l-4 border-l-red-400 p-4 rounded-r-md">
              <div className="text-red-700">
                <strong>Search Error:</strong> {searchError.message || 'Failed to search foods. Please try again.'}
              </div>
            </div>
          )}

          {barcodeError && (
            <div className="bg-red-50 border-l-4 border-l-red-400 p-4 rounded-r-md">
              <div className="text-red-700">
                <strong>Barcode Error:</strong> {barcodeError.message || 'Failed to find food with this barcode.'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Search Results Section */}
      {searchResults && searchResults.length === 0 && debouncedSearchQuery.length > 2 && !isSearching && (
        <div className="mt-8">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No foods found</h3>
            <p className="text-gray-600">
              No results for "{debouncedSearchQuery}". Try a different search term or check the spelling.
            </p>
          </div>
        </div>
      )}

      {searchResults && searchResults.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {searchResults.length} found
              </Badge>
              {isSearching && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchResults.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                onAddFood={handleAddFood}
                isFromCache={(food as any).isFromCache}
              />
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Barcode Result */}
      {barcodeResult && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <ScanLine className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Barcode Result</h2>
            <Badge className="bg-green-100 text-green-800">
              Found
            </Badge>
          </div>
          
          <div className="max-w-md">
            <FoodCard
              food={barcodeResult}
              onAddFood={handleAddFood}
              isFromCache={(barcodeResult as any).isFromCache}
            />
          </div>
        </div>
      )}

      {barcode && barcode.length >= 8 && !barcodeResult && !isScanningBarcode && !barcodeError && (
        <div className="mt-8">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <ScanLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No product found</h3>
            <p className="text-gray-600">
              No product found for barcode "{barcode}". Please check the barcode and try again.
            </p>
          </div>
        </div>
      )}

      {/* Add Food Modal */}
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