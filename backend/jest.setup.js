// Silence console during tests to avoid noise from intentional error testing
global.console = {
  ...console,
  // Keep these for debugging if needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Silence these during tests
  warn: jest.fn(),
  error: jest.fn(),
};