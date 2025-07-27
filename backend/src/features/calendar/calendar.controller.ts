import { Controller, Get, Query, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CalendarService } from "./calendar.service";
import { NutritionGoals } from "../nutrition/nutrition.service";

@ApiTags("calendar")
@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get("month")
  @ApiOperation({ summary: "Get calendar month view with nutrition data" })
  @ApiResponse({ status: 200, description: "Monthly calendar data" })
  getMonthView(@Query("month") month: string, @Query("year") year: string) {
    return this.calendarService.getMonthView(parseInt(month), parseInt(year));
  }

  @Post("month/with-goals")
  @ApiOperation({ summary: "Get calendar month view with goal progress" })
  @ApiResponse({
    status: 200,
    description: "Monthly calendar data with goal progress",
  })
  getMonthViewWithGoals(
    @Query("month") month: string,
    @Query("year") year: string,
    @Body() goals: NutritionGoals,
  ) {
    return this.calendarService.getMonthView(
      parseInt(month),
      parseInt(year),
      goals,
    );
  }

  @Get("week")
  @ApiOperation({ summary: "Get calendar week view with nutrition data" })
  @ApiResponse({ status: 200, description: "Weekly calendar data" })
  getWeekView(@Query("startDate") startDate: string) {
    return this.calendarService.getWeekView(startDate);
  }

  @Post("week/with-goals")
  @ApiOperation({ summary: "Get calendar week view with goal progress" })
  @ApiResponse({
    status: 200,
    description: "Weekly calendar data with goal progress",
  })
  getWeekViewWithGoals(
    @Query("startDate") startDate: string,
    @Body() goals: NutritionGoals,
  ) {
    return this.calendarService.getWeekView(startDate, goals);
  }

  @Get("day")
  @ApiOperation({
    summary: "Get detailed day view with all meals and nutrition",
  })
  @ApiResponse({ status: 200, description: "Daily detailed data" })
  getDayView(@Query("date") date: string) {
    return this.calendarService.getDayView(date);
  }

  @Get("streaks")
  @ApiOperation({ summary: "Get nutrition tracking streaks" })
  @ApiResponse({ status: 200, description: "Streak data" })
  getNutritionStreaks(@Query("endDate") endDate?: string) {
    return this.calendarService.getNutritionStreaks(endDate);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get calendar statistics for date range" })
  @ApiResponse({ status: 200, description: "Calendar statistics" })
  getCalendarStats(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.calendarService.getCalendarStats(startDate, endDate);
  }
}
