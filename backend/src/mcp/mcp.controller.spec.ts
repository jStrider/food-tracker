import { Test, TestingModule } from "@nestjs/testing";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";

describe("McpController", () => {
  let controller: McpController;
  let service: McpService;

  const mockMcpService = {
    getAvailableTools: jest.fn(),
    callTool: jest.fn(),
    getAvailableResources: jest.fn(),
    getResource: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [McpController],
      providers: [
        {
          provide: McpService,
          useValue: mockMcpService,
        },
      ],
    }).compile();

    controller = module.get<McpController>(McpController);
    service = module.get<McpService>(McpService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("listTools", () => {
    it("should return available tools", () => {
      const mockTools = {
        tools: [
          {
            name: "get_meals",
            description: "Get meals with filtering",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "create_meal",
            description: "Create a new meal",
            inputSchema: { type: "object", properties: {} },
          },
        ],
      };

      mockMcpService.getAvailableTools.mockReturnValue(mockTools);

      const result = controller.listTools();

      expect(service.getAvailableTools).toHaveBeenCalled();
      expect(result).toEqual(mockTools);
    });

    it("should return empty tools array when no tools available", () => {
      const mockTools = { tools: [] };
      mockMcpService.getAvailableTools.mockReturnValue(mockTools);

      const result = controller.listTools();

      expect(result).toEqual({ tools: [] });
    });
  });

  describe("callTool", () => {
    it("should call tool with parameters", async () => {
      const toolName = "get_meals";
      const params = { date: "2024-01-15" };
      const mockResult = [{ id: "1", name: "Breakfast" }];

      mockMcpService.callTool.mockResolvedValue(mockResult);

      const result = await controller.callTool({ name: toolName, arguments: params });

      expect(service.callTool).toHaveBeenCalledWith(toolName, params);
      expect(result).toEqual(mockResult);
    });

    it("should handle tool calls without parameters", async () => {
      const toolName = "get_foods";
      const mockResult = [{ id: "1", name: "Apple" }];

      mockMcpService.callTool.mockResolvedValue(mockResult);

      const result = await controller.callTool({ name: toolName, arguments: {} });

      expect(service.callTool).toHaveBeenCalledWith(toolName, {});
      expect(result).toEqual(mockResult);
    });

    it("should handle tool call errors", async () => {
      const toolName = "invalid_tool";
      const error = new Error("Tool not found");

      mockMcpService.callTool.mockRejectedValue(error);

      await expect(
        controller.callTool({ name: toolName, arguments: {} }),
      ).rejects.toThrow("Tool not found");
    });

    it("should pass complex parameters correctly", async () => {
      const toolName = "compare_to_goals";
      const params = {
        date: "2024-01-15",
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 250,
          fat: 65,
        },
      };
      const mockResult = { status: "success" };

      mockMcpService.callTool.mockResolvedValue(mockResult);

      const result = await controller.callTool({ name: toolName, arguments: params });

      expect(service.callTool).toHaveBeenCalledWith(toolName, params);
      expect(result).toEqual(mockResult);
    });
  });

  describe("listResources", () => {
    it("should return available resources", () => {
      const mockResources = {
        resources: [
          {
            uri: "foodtracker://meals",
            name: "All Meals",
            description: "Access to all meals",
            mimeType: "application/json",
          },
          {
            uri: "foodtracker://foods",
            name: "Food Database",
            description: "Complete food database",
            mimeType: "application/json",
          },
        ],
      };

      mockMcpService.getAvailableResources.mockReturnValue(mockResources);

      const result = controller.listResources();

      expect(service.getAvailableResources).toHaveBeenCalled();
      expect(result).toEqual(mockResources);
    });

    it("should return empty resources array when no resources available", () => {
      const mockResources = { resources: [] };
      mockMcpService.getAvailableResources.mockReturnValue(mockResources);

      const result = controller.listResources();

      expect(result).toEqual({ resources: [] });
    });
  });

  describe("getResource", () => {
    it("should get resource by URI", async () => {
      const uri = "foodtracker://meals";
      const mockData = [{ id: "1", name: "Breakfast" }];

      mockMcpService.getResource.mockResolvedValue(mockData);

      const result = await controller.getResource({ uri });

      expect(service.getResource).toHaveBeenCalledWith(uri);
      expect(result).toEqual(mockData);
    });

    it("should handle different resource types", async () => {
      const testCases = [
        {
          uri: "foodtracker://meals/today",
          mockData: [{ id: "1", name: "Today's Breakfast" }],
        },
        {
          uri: "foodtracker://foods",
          mockData: [{ id: "1", name: "Apple" }],
        },
        {
          uri: "foodtracker://nutrition/daily",
          mockData: { date: "2024-01-15", calories: 2000 },
        },
      ];

      for (const testCase of testCases) {
        mockMcpService.getResource.mockResolvedValue(testCase.mockData);

        const result = await controller.getResource({ uri: testCase.uri });

        expect(service.getResource).toHaveBeenCalledWith(testCase.uri);
        expect(result).toEqual(testCase.mockData);
      }
    });

    it("should handle resource not found errors", async () => {
      const uri = "foodtracker://nonexistent";
      const error = new Error("Resource not found");

      mockMcpService.getResource.mockRejectedValue(error);

      await expect(controller.getResource({ uri })).rejects.toThrow(
        "Resource not found",
      );
    });

    it("should handle system info resource", async () => {
      const uri = "foodtracker://system/info";
      const mockSystemInfo = {
        name: "FoodTracker Backend",
        version: "1.0.0",
        capabilities: {
          meals: "Full CRUD",
          foods: "Search and manage",
          nutrition: "Comprehensive tracking",
        },
      };

      mockMcpService.getResource.mockResolvedValue(mockSystemInfo);

      const result = await controller.getResource({ uri });

      expect(service.getResource).toHaveBeenCalledWith(uri);
      expect(result).toEqual(mockSystemInfo);
    });
  });
});