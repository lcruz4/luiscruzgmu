# Stockfish Service Tests

This directory contains focused integration tests for the Stockfish chess engine service, emphasizing concurrent analysis and locking mechanisms.

## Overview

The tests work with real Stockfish processes to validate the actual service behavior, particularly focusing on:
- **Concurrent analysis handling**
- **Instance pool management**
- **Locking mechanisms**
- **Performance characteristics**
- **Error handling**

## Test Structure

### `stockfish.test.ts`

Main test file containing:

1. **Service Management** - Singleton behavior, instance pooling, cleanup
2. **Game Analysis** - Basic analysis functionality and accuracy validation
3. **Concurrent Analysis and Locking** - Core focus on concurrent request handling
4. **Performance and Caching** - Cache behavior and performance characteristics

## Key Testing Focus

### Concurrent Analysis & Locking
- **Race condition prevention**: Tests multiple simultaneous analysis requests
- **Instance pool management**: Validates proper queuing when pool is full
- **Data consistency**: Ensures concurrent analyses don't interfere with each other
- **Resource management**: Tests instance creation and cleanup under load

### Real Integration Testing
- **Actual Stockfish processes**: No mocks - tests real engine behavior
- **Move accuracy validation**: Tests actual chess positions (Scholar's Mate blunder detection)
- **Performance characteristics**: Validates analysis speed and resource usage
- **Error scenarios**: Tests invalid input handling and graceful failures

### Service Architecture
- **Singleton pattern**: Ensures single service instance across application
- **Instance pooling**: Tests the 5-instance pool limit and overflow handling
- **Process cleanup**: Validates proper resource deallocation

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Configuration

- **Timeout**: 60 seconds per test (for real Stockfish analysis)
- **Max Workers**: 2 (to avoid overwhelming Stockfish)
- **Process Cleanup**: Automatic cleanup of Stockfish instances after tests

## Dependencies

- **Stockfish**: Chess engine (install via `brew install stockfish` on macOS)
- **Redis**: Mocked for testing (no real Redis instance required)
- **Jest**: Testing framework
- **ts-jest**: TypeScript support for Jest

## Test Coverage & Validation

**92.57%** statement coverage of Stockfish service with focus on:

- ✅ **Concurrent request handling** - Multiple simultaneous analyses
- ✅ **Locking mechanisms** - Race condition prevention
- ✅ **Instance pool management** - Resource allocation and limits
- ✅ **Chess accuracy** - Blunder detection (Nf6?? in Scholar's Mate)
- ✅ **Performance characteristics** - Analysis speed and caching
- ✅ **Error resilience** - Invalid PGN and edge case handling
- ✅ **Process lifecycle** - Creation, queuing, and cleanup

## Notes

- Tests use real Stockfish analysis, so results may vary slightly between runs
- Caching ensures consistent results for identical positions
- Process cleanup prevents resource leaks during testing