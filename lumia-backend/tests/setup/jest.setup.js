process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_min_32_characters_long_12345';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_min_32_chars_12345';
process.env.JWT_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

// Silence verbose application logs during testing unless DEBUG_TESTS is set
if (!process.env.DEBUG_TESTS) {
  const noop = () => {};
  jest.spyOn(console, 'log').mockImplementation((...args) => {
    // allow test output banners
    if (typeof args[0] === 'string' && (args[0].includes('PASS') || args[0].includes('FAIL'))) {
      process.stdout.write(args.join(' ') + '\n');
    }
  });
  jest.spyOn(console, 'info').mockImplementation(noop);
  jest.spyOn(console, 'warn').mockImplementation(noop);
}

