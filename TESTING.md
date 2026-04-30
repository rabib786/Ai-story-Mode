# AI Story Mode - Testing Documentation

## Overview

This document provides comprehensive testing instructions for the AI Story Mode application. The test suite covers critical features including story generation, API providers, character management, scenario system, memory bank, and storage migration.

## Test Structure

The project uses [bun](https://bun.sh/) as the test runner with the built-in `bun:test` framework. Tests are located in the `services/` directory with the `.test.ts` extension.

### Test Categories

1. **Unit Tests**: Individual function testing (existing)
2. **Integration Tests**: Cross-service functionality testing (new)
3. **End-to-End Tests**: Full story generation flow testing (new)

## Prerequisites

1. **Bun Runtime**: Install bun if not already installed:
   ```bash
   # Windows (PowerShell)
   irm bun.sh/install.ps1 | iex
   
   # macOS/Linux
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Dependencies**: Ensure all dependencies are installed:
   ```bash
   bun install
   ```

## Running Tests

### Available Test Scripts

The following npm scripts are available in `package.json`:

| Script | Description | Command |
|--------|-------------|---------|
| `test` | Run all tests (default) | `bun test` |
| `test:e2e` | End-to-end story generation tests | `bun test services/storyGeneration.e2e.test.ts` |
| `test:api-providers` | API provider configuration tests | `bun test services/apiProviderSwitching.test.ts` |
| `test:characters` | Character management tests | `bun test services/characterManagement.test.ts` |
| `test:scenarios` | Scenario system tests | `bun test services/scenarioSystem.test.ts` |
| `test:memory` | Memory bank tests | `bun test services/memoryBank.test.ts` |
| `test:storage` | Storage migration tests | `bun test services/storageMigration.test.ts` |
| `test:integration` | All integration tests | `bun test services/*.test.ts` |
| `test:all` | All tests with coverage | `bun test --coverage` |
| `test:openrouter:free` | OpenRouter free model smoke test | `bun scripts/openrouter-free-smoke.ts` |

### Running Specific Test Suites

```bash
# Run all tests
bun test

# Run only end-to-end story generation tests
bun run test:e2e

# Run all integration tests
bun run test:integration

# Run tests with coverage report
bun run test:all
```

## Test Coverage

### 1. Story Generation End-to-End Tests (`services/storyGeneration.e2e.test.ts`)
- **Purpose**: Test complete story generation flow with mock API responses
- **Key Features Tested**:
  - Successful story generation with valid API response
  - Dialogue parsing and narrative segmentation
  - Error handling for empty/malformed responses
  - API provider fallback behavior
  - Response length configuration
- **Mocking**: Uses `mockFetch` to simulate API responses without actual network calls

### 2. API Provider Switching Tests (`services/apiProviderSwitching.test.ts`)
- **Purpose**: Test API provider configuration and switching logic
- **Key Features Tested**:
  - Provider configuration validation
  - API key requirement checking
  - Model selection per provider
  - Settings persistence
  - Provider-specific endpoint configuration
- **Note**: Requires TypeScript fixes for ApiSettings interface compatibility

### 3. Character Management Tests (`services/characterManagement.test.ts`)
- **Purpose**: Test character storage, retrieval, and management
- **Key Features Tested**:
  - Character creation with UUID generation
  - LocalStorage integration (mocked)
  - Character update and deletion
  - Character portrait generation simulation
  - Data validation and error handling

### 4. Scenario System Tests (`services/scenarioSystem.test.ts`)
- **Purpose**: Test scenario filtering, tagging, and management
- **Key Features Tested**:
  - Prebuilt vs custom scenario separation
  - Tag-based filtering
  - Search functionality
  - Scenario metadata validation
  - Character relationship mapping

### 5. Memory Bank Tests (`services/memoryBank.test.ts`)
- **Purpose**: Test memory tracking and relationship management
- **Key Features Tested**:
  - Different memory types (fact, relationship, hook)
  - Confidence level tracking
  - Memory prioritization
  - Context relevance scoring
  - Memory update and deletion

### 6. Storage Migration Tests (`services/storageMigration.test.ts`)
- **Purpose**: Test backward compatibility for data format changes
- **Key Features Tested**:
  - Legacy data format detection
  - Migration to new format
  - Data preservation during migration
  - Error handling for corrupted data
  - Async storage operations

## Manual Testing Checklist

For features that require manual verification, refer to the comprehensive testing plan in `plans/feature-testing-plan.md`.

### Critical Features to Manually Verify:

1. **Story Generation**
   - [ ] Generate story with different response lengths
   - [ ] Test dialogue parsing in UI
   - [ ] Verify memory bank updates during story

2. **API Providers**
   - [ ] Switch between different LLM providers
   - [ ] Configure API keys for each provider
   - [ ] Test model selection dropdown

3. **Character Management**
   - [ ] Create new character with portrait
   - [ ] Edit existing character details
   - [ ] Delete characters

4. **Scenario System**
   - [ ] Filter scenarios by tags
   - [ ] Search for scenarios
   - [ ] Create custom scenarios

5. **Memory Bank**
   - [ ] View memory entries during story
   - [ ] Edit memory facts
   - [ ] Delete outdated memories

## Troubleshooting

### Common Issues

1. **"bun: command not found"**
   - Ensure bun is installed and in PATH
   - Restart terminal after installation
   - On Windows, may need to run PowerShell as Administrator

2. **TypeScript Errors in Tests**
   - Run `bun install` to ensure all dependencies
   - Check for interface mismatches (e.g., ApiSettings)
   - Verify TypeScript version compatibility

3. **Test Failures Due to Missing Mocks**
   - All tests use mocked localStorage and fetch
   - Ensure mock implementations are properly set up
   - Check for async/await timing issues

4. **Coverage Report Not Generating**
   - Use `bun test --coverage` flag
   - Ensure sufficient test coverage exists
   - Check bun version supports coverage

### Debugging Tests

```bash
# Run tests with verbose output
bun test --verbose

# Run specific test file with debug
bun test services/storyGeneration.e2e.test.ts --verbose

# Run single test by name
bun test --test-name "should generate story with valid API response"
```

## Continuous Integration

For CI/CD pipelines, the following commands are recommended:

```yaml
# Example GitHub Actions workflow
steps:
  - uses: actions/checkout@v4
  - uses: oven-sh/setup-bun@v1
    with:
      bun-version: latest
  - run: bun install
  - run: bun run test:all
```

## Test Maintenance

### Adding New Tests

1. Create test file in `services/` with `.test.ts` extension
2. Import `{ test, expect, describe, mock, beforeEach, afterEach }` from `bun:test`
3. Follow existing patterns for mocking and assertions
4. Add appropriate test script to `package.json` if needed

### Updating Tests

When application interfaces change:
1. Update test mocks to match new interfaces
2. Update TypeScript type imports
3. Verify all tests still pass
4. Update documentation if test behavior changes

## Performance Considerations

- Tests run in-memory with mocked dependencies
- No actual API calls are made during testing
- LocalStorage is mocked to avoid browser dependencies
- Test execution should complete within seconds

## Success Criteria

A successful test run indicates:
- All critical features have test coverage
- No regressions in existing functionality
- API provider switching works correctly
- Story generation produces valid structured responses
- Data persistence and migration functions properly
- Memory bank tracks story facts accurately

---

*Last Updated: April 30, 2026*  
*Test Suite Version: 1.0.0*