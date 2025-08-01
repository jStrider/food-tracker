import { Controller, Get, Query, Post, Body, Param, Request, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { NutritionService, NutritionGoals } from "./nutrition.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  QueryRateLimit,
  MutationRateLimit,
} from "../../common/decorators/rate-limit.decorator";
import {
  ApiQueryRateLimit,
  ApiMutationRateLimit,
} from "../../common/decorators/api-rate-limit.decorator";

@ApiTags("nutrition")
@Controller("nutrition")
@UseGuards(JwtAuthGuard) // SECURITY FIX: Require authentication for all nutrition endpoints
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get("daily")
  @QueryRateLimit()
  @ApiQueryRateLimit()
  @ApiOperation({ summary: "Get daily nutrition summary" })
  @ApiResponse({ status: 200, description: "Daily nutrition data" })
  getDailyNutrition(@Query("date") date: string, @Request() req) {
    return this.nutritionService.getDailyNutrition(date, req.user.userId);
  }

  @Get("weekly")
  @QueryRateLimit()
  @ApiQueryRateLimit()
  @ApiOperation({ summary: "Get weekly nutrition summary" })
  @ApiResponse({ status: 200, description: "Weekly nutrition data" })
  getWeeklyNutrition(@Query("startDate") startDate: string, @Request() req) {
    return this.nutritionService.getWeeklyNutrition(startDate, req.user.userId);
  }

  @Get("monthly")
  @QueryRateLimit()
  @ApiQueryRateLimit()
  @ApiOperation({ summary: "Get monthly nutrition summary" })
  @ApiResponse({ status: 200, description: "Monthly nutrition data" })
  getMonthlyNutrition(
    @Query("month") month: string,
    @Query("year") year: string,
    @Request() req,
  ) {
    return this.nutritionService.getMonthlyNutrition(
      parseInt(month),
      parseInt(year),
      req.user.userId,
    );
  }

  @Get("meal/:id")
  @QueryRateLimit()
  @ApiQueryRateLimit()
  @ApiOperation({ summary: "Get nutrition for a specific meal" })
  @ApiResponse({ status: 200, description: "Meal nutrition data" })
  getMealNutrition(@Param("id") id: string, @Request() req) {
    return this.nutritionService.getMealNutrition(id, req.user.userId);
  }

  @Post("goals/compare")
  @MutationRateLimit()
  @ApiMutationRateLimit()
  @ApiOperation({ summary: "Compare daily nutrition to goals" })
  @ApiResponse({ status: 200, description: "Goal comparison data" })
  compareToGoals(@Query("date") date: string, @Body() goals: NutritionGoals, @Request() req) {
    return this.nutritionService.compareToGoals(date, goals, req.user.userId);
  }

  @Get("macro-breakdown")
  @QueryRateLimit()
  @ApiQueryRateLimit()
  @ApiOperation({ summary: "Get macronutrient breakdown percentages" })
  @ApiResponse({ status: 200, description: "Macro breakdown data" })
  async getMacroBreakdown(@Query("date") date: string, @Request() req) {
    const nutrition = await this.nutritionService.getDailyNutrition(date, req.user.userId);
    return this.nutritionService.getMacroBreakdown(nutrition);
  }
}
