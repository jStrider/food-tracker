import { Test, TestingModule } from "@nestjs/testing";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";

describe("CalendarController", () => {
  let controller: CalendarController;
  let calendarService: CalendarService;

  const _mockCalendarService = {
    getMonthView: jest.fn(),
    getWeekView: jest.fn(),
    getDayView: jest.fn(),
    getNutritionStreaks: jest.fn(),
    getCalendarStats: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
    calendarService = module.get<CalendarService>(CalendarService);
  });

  describe("getMonthView", () => {
    it("should return month view data", async () => {
      const _mockMonthData = {
        month: 1,
        year: 2024,
        days: [],
        summary: {
          totalDays: 31,
          daysWithData: 15,
          averageCalories: 1800,
          totalCalories: 27000,
          averageProtein: 90,
          averageCarbs: 225,
          averageFat: 60,
        },
      };

      mockCalendarService.getMonthView.mockResolvedValue(mockMonthData);

      const _result = await controller.getMonthView("1", "2024");

      expect(result).toEqual(mockMonthData);
      expect(calendarService.getMonthView).toHaveBeenCalledWith(1, 2024);
    });

    it("should parse string parameters to numbers", async () => {
      mockCalendarService.getMonthView.mockResolvedValue({});

      await controller.getMonthView("12", "2023");

      expect(calendarService.getMonthView).toHaveBeenCalledWith(12, 2023);
    });
  });

  describe("getMonthViewWithGoals", () => {
    it("should return month view with goal progress", async () => {
      const _goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
      };

      const _mockMonthData = {
        month: 1,
        year: 2024,
        days: [
          {
            date: "2024-01-15",
            totalCalories: 1800,
            totalProtein: 90,
            totalCarbs: 225,
            totalFat: 60,
            totalFiber: 25,
            mealCount: 3,
            hasData: true,
            dayOfWeek: 1,
            goalProgress: {
              calories: 90,
              protein: 90,
              carbs: 90,
              fat: 92,
            },
          },
        ],
        summary: {
          totalDays: 31,
          daysWithData: 1,
          averageCalories: 1800,
          totalCalories: 1800,
          averageProtein: 90,
          averageCarbs: 225,
          averageFat: 60,
        },
      };

      mockCalendarService.getMonthView.mockResolvedValue(mockMonthData);

      const _result = await controller.getMonthViewWithGoals(
        "1",
        "2024",
        goals,
      );

      expect(result).toEqual(mockMonthData);
      expect(calendarService.getMonthView).toHaveBeenCalledWith(1, 2024, goals);
    });
  });

  describe("getWeekView", () => {
    it("should return week view data", async () => {
      const _mockWeekData = {
        startDate: "2024-01-14",
        endDate: "2024-01-20",
        days: [],
        summary: {
          totalCalories: 12600,
          averageCalories: 1800,
          totalProtein: 630,
          totalCarbs: 1575,
          totalFat: 420,
          daysWithData: 7,
        },
      };

      mockCalendarService.getWeekView.mockResolvedValue(mockWeekData);

      const _result = await controller.getWeekView("2024-01-15");

      expect(result).toEqual(mockWeekData);
      expect(calendarService.getWeekView).toHaveBeenCalledWith("2024-01-15");
    });
  });

  describe("getWeekViewWithGoals", () => {
    it("should return week view with goal progress", async () => {
      const _goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
      };

      const _mockWeekData = {
        startDate: "2024-01-14",
        endDate: "2024-01-20",
        days: [
          {
            date: "2024-01-15",
            totalCalories: 1800,
            totalProtein: 90,
            totalCarbs: 225,
            totalFat: 60,
            totalFiber: 25,
            mealCount: 3,
            hasData: true,
            dayOfWeek: 1,
            goalProgress: {
              calories: 90,
              protein: 90,
              carbs: 90,
              fat: 92,
            },
          },
        ],
        summary: {
          totalCalories: 1800,
          averageCalories: 1800,
          totalProtein: 90,
          totalCarbs: 225,
          totalFat: 60,
          daysWithData: 1,
        },
      };

      mockCalendarService.getWeekView.mockResolvedValue(mockWeekData);

      const _result = await controller.getWeekViewWithGoals(
        "2024-01-15",
        goals,
      );

      expect(result).toEqual(mockWeekData);
      expect(calendarService.getWeekView).toHaveBeenCalledWith(
        "2024-01-15",
        goals,
      );
    });
  });

  describe("getDayView", () => {
    it("should return detailed day view", async () => {
      const _mockDayData = {
        date: "2024-01-15",
        meals: [],
        mealCount: 3,
        calories: 1800,
        protein: 90,
        carbs: 225,
        fat: 60,
        fiber: 25,
        sugar: 40,
        sodium: 2000,
      };

      mockCalendarService.getDayView.mockResolvedValue(mockDayData);

      const _result = await controller.getDayView("2024-01-15");

      expect(result).toEqual(mockDayData);
      expect(calendarService.getDayView).toHaveBeenCalledWith("2024-01-15");
    });
  });

  describe("getNutritionStreaks", () => {
    it("should return nutrition streaks with end date", async () => {
      const _mockStreaks = {
        currentStreak: 5,
        longestStreak: 12,
        streakDates: [
          "2024-01-16",
          "2024-01-17",
          "2024-01-18",
          "2024-01-19",
          "2024-01-20",
        ],
      };

      mockCalendarService.getNutritionStreaks.mockResolvedValue(mockStreaks);

      const _result = await controller.getNutritionStreaks("2024-01-20");

      expect(result).toEqual(mockStreaks);
      expect(calendarService.getNutritionStreaks).toHaveBeenCalledWith(
        "2024-01-20",
      );
    });

    it("should return nutrition streaks without end date", async () => {
      const _mockStreaks = {
        currentStreak: 3,
        longestStreak: 10,
        streakDates: ["2024-01-18", "2024-01-19", "2024-01-20"],
      };

      mockCalendarService.getNutritionStreaks.mockResolvedValue(mockStreaks);

      const _result = await controller.getNutritionStreaks();

      expect(result).toEqual(mockStreaks);
      expect(calendarService.getNutritionStreaks).toHaveBeenCalledWith(
        undefined,
      );
    });
  });

  describe("getCalendarStats", () => {
    it("should return calendar statistics", async () => {
      const _mockStats = {
        totalDays: 31,
        daysWithData: 20,
        completionRate: 65,
        averageCalories: 1850,
        averageMealsPerDay: 3.2,
        mostActiveDay: "2024-01-15",
        leastActiveDay: "2024-01-20",
      };

      mockCalendarService.getCalendarStats.mockResolvedValue(mockStats);

      const _result = await controller.getCalendarStats(
        "2024-01-01",
        "2024-01-31",
      );

      expect(result).toEqual(mockStats);
      expect(calendarService.getCalendarStats).toHaveBeenCalledWith(
        "2024-01-01",
        "2024-01-31",
      );
    });
  });
});
