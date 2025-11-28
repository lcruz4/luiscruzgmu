jest.mock('../services/redis', () => ({
  redis: {
    keys: jest.fn().mockResolvedValue([]),
    withCache: jest.fn().mockImplementation(async (_, callback) => {
      return await callback();
    }),
  }
}));

process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'WARN';
