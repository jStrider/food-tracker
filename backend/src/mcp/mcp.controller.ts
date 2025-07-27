import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { McpService } from "./mcp.service";

@ApiTags("mcp")
@Controller("mcp")
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get("tools")
  @ApiOperation({
    summary: "Get all available MCP tools for Claude integration",
  })
  @ApiResponse({
    status: 200,
    description: "List of available MCP tools with schemas",
  })
  getAvailableTools() {
    return this.mcpService.getAvailableTools();
  }

  @Post("tools/:toolName/call")
  @ApiOperation({ summary: "Execute a specific MCP tool with parameters" })
  @ApiParam({ name: "toolName", description: "Name of the tool to execute" })
  @ApiBody({ description: "Tool parameters based on tool schema" })
  @ApiResponse({ status: 200, description: "Tool execution result" })
  @ApiResponse({ status: 400, description: "Invalid tool name or parameters" })
  callTool(@Param("toolName") toolName: string, @Body() params: any) {
    return this.mcpService.callTool(toolName, params);
  }

  @Get("resources")
  @ApiOperation({
    summary: "Get all available MCP resources for Claude access",
  })
  @ApiResponse({ status: 200, description: "List of available MCP resources" })
  getAvailableResources() {
    return this.mcpService.getAvailableResources();
  }

  @Get("resources/:resourceUri")
  @ApiOperation({ summary: "Access a specific MCP resource by URI" })
  @ApiParam({
    name: "resourceUri",
    description: "URI of the resource to access",
  })
  @ApiResponse({ status: 200, description: "Resource data" })
  @ApiResponse({ status: 404, description: "Resource not found" })
  getResource(@Param("resourceUri") resourceUri: string) {
    return this.mcpService.getResource(resourceUri);
  }

  @Get("status")
  @ApiOperation({ summary: "Get MCP server status and health check" })
  @ApiResponse({ status: 200, description: "MCP server status information" })
  getServerStatus() {
    return {
      status: "healthy",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      capabilities: {
        tools: 23,
        resources: 7,
        features: [
          "Full CRUD operations for meals and foods",
          "OpenFoodFacts API integration",
          "Comprehensive nutrition tracking",
          "Calendar and analytics",
          "Goal tracking and progress monitoring",
        ],
      },
    };
  }
}
