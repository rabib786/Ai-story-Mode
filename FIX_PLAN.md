# AI Story Mode - Bug Fix Plan

## Overview
This document outlines a systematic plan to fix all 22 bugs identified in the AI Story Mode application. The plan is organized by priority, with critical TypeScript errors addressed first.

## Phase 1: Critical TypeScript Fixes (Blocking Issues)

### 1.1 Fix Missing Exports in geminiService.ts
**Priority**: Critical  
**Estimated Time**: 30 minutes  
**Files**: `services/geminiService.ts`

**Actions**:
1. Check if `generateStoryContinuation` function exists in the file
2. If it exists, add `export` keyword to the function declaration
3. If it doesn't exist, check if it should be `generateStoryPart` (which is exported)
4. Update test imports to use correct function name
5. For `generateWithOpenAiCompatible`:
   - Check if it's an internal helper function
   - If it should be exported, add `export` keyword
   - If it shouldn't be exported, remove the import from tests

**Expected Outcome**: TypeScript errors about missing exports resolved.

### 1.2 Fix ApiSettings Interface Mismatch
**Priority**: Critical  
**Estimated Time**: 45 minutes  
**Files**: `services/apiProviderSwitching.test.ts`, `services/storyGeneration.e2e.test.ts`, `types.ts`

**Actions**:
1. Update test files to use correct field names:
   - Change `openAiApiKey` → `openAiCompatibleApiKey`
   - Change `openRouterApiKey` → `openAiCompatibleApiKey` (if using same field)
   - Verify actual field usage in the codebase
2. Check if ApiSettings interface needs additional fields for OpenRouter
3. Update mock data in tests to match current interface
4. Run TypeScript compilation to verify fixes

**Expected Outcome**: No more "property does not exist" errors for ApiSettings.

### 1.3 Fix Component Type Errors
**Priority**: Critical  
**Estimated Time**: 60 minutes  
**Files**: `components/ErrorBoundary.tsx`, `components/ScenarioEditor.tsx`, `components/SetupWizard.tsx`, `components/icons.tsx`

**Actions**:
1. **ErrorBoundary.tsx**:
   - Check React ErrorBoundary implementation pattern
   - Add proper typing for `state` and `props`
   - Consider using `React.Component<Props, State>` pattern

2. **ScenarioEditor.tsx**:
   - Check `icons.tsx` for available icon exports
   - Update import to use correct icon name
   - Create `SuggestionBox` component or remove references

3. **SetupWizard.tsx**:
   - Check `icons.tsx` for available icon exports
   - Update imports to use correct icon names
   - Add missing icons to `icons.tsx` if needed

4. **icons.tsx**:
   - Export all required icons
   - Ensure consistent naming convention

**Expected Outcome**: All component TypeScript errors resolved.

### 1.4 Fix Fetch Mock Type Issues
**Priority**: High  
**Estimated Time**: 30 minutes  
**Files**: `services/apiProviderSwitching.test.ts`, `services/storyGeneration.e2e.test.ts`

**Actions**:
1. Create proper fetch mock that matches `typeof fetch` signature
2. Add missing properties like `preconnect` (can be empty function)
3. Use bun's built-in mocking utilities correctly
4. Consider using `mock.module` for fetch mocking

**Expected Outcome**: Fetch mock type errors resolved.

## Phase 2: Runtime and Functional Fixes

### 2.1 Fix Development Server Crash
**Priority**: Critical  
**Estimated Time**: 30 minutes  
**Files**: `vite.config.ts`, `package.json`

**Actions**:
1. After fixing TypeScript errors, try running dev server again
2. Check Vite configuration for any issues
3. Look for runtime errors in browser console
4. Ensure all dependencies are properly installed

**Expected Outcome**: Development server runs without crashing.

### 2.2 Fix API Provider Configuration
**Priority**: Medium  
**Estimated Time**: 45 minutes  
**Files**: `constants/llmProviders.ts`, `services/apiUtils.ts`

**Actions**:
1. Verify provider configurations match actual API requirements
2. Update OpenRouter free model list if needed
3. Test provider switching in UI
4. Add validation for API keys

**Expected Outcome**: API provider switching works correctly.

### 2.3 Fix Scenario System Issues
**Priority**: Medium  
**Estimated Time**: 30 minutes  
**Files**: `services/scenarioSystem.test.ts`, `types.ts`

**Actions**:
1. Remove `setting` property from test scenario objects
2. Update Scenario interface if `setting` is actually needed
3. Test scenario filtering and search functionality
4. Verify tag-based filtering works correctly

**Expected Outcome**: Scenario system tests pass and functionality works.

## Phase 3: Test Improvements

### 3.1 Improve Test Mock Implementations
**Priority**: Medium  
**Estimated Time**: 60 minutes  
**Files**: All test files

**Actions**:
1. Create shared mock utilities for fetch and localStorage
2. Ensure mocks properly clean up between tests
3. Add proper type definitions for mocks
4. Test async operations with proper await patterns

**Expected Outcome**: More reliable and maintainable tests.

### 3.2 Fix Test Type Assertions
**Priority**: Low  
**Estimated Time**: 30 minutes  
**Files**: Test files with `as any` casts

**Actions**:
1. Replace `as any` with proper type definitions
2. Create test utility types where needed
3. Use TypeScript generics for better type safety

**Expected Outcome**: Type-safe tests without unsafe casts.

## Phase 4: Environment and Tooling

### 4.1 Fix Bun Path Issues
**Priority**: Low  
**Estimated Time**: 15 minutes  
**Files**: Environment configuration

**Actions**:
1. Add bun to system PATH
2. Update documentation to reflect proper bun usage
3. Consider adding `.bun` to PATH in CI/CD scripts

**Expected Outcome**: `bun` command works without full path.

### 4.2 Update TypeScript Configuration
**Priority**: Low  
**Estimated Time**: 30 minutes  
**Files**: `tsconfig.json`

**Actions**:
1. Review TypeScript configuration for optimal settings
2. Add missing type definitions if needed
3. Consider stricter type checking options

**Expected Outcome**: Better TypeScript error detection.

## Implementation Schedule

### Day 1: Critical Fixes (4-5 hours)
1. Phase 1.1: Missing exports (30 min)
2. Phase 1.2: ApiSettings interface (45 min)
3. Phase 1.3: Component errors (60 min)
4. Phase 1.4: Fetch mocks (30 min)
5. Phase 2.1: Dev server (30 min)

### Day 2: Functional Fixes (3-4 hours)
1. Phase 2.2: API provider config (45 min)
2. Phase 2.3: Scenario system (30 min)
3. Phase 3.1: Test improvements (60 min)
4. Phase 3.2: Test type assertions (30 min)

### Day 3: Environment and Polish (2-3 hours)
1. Phase 4.1: Bun path (15 min)
2. Phase 4.2: TypeScript config (30 min)
3. Final testing and verification (60 min)

## Success Criteria

### Immediate (After Phase 1)
- ✅ TypeScript compilation passes with no errors
- ✅ Development server starts without crashing
- ✅ All existing tests pass

### Functional (After Phase 2)
- ✅ API provider switching works in UI
- ✅ Scenario creation and filtering works
- ✅ Character management functions correctly
- ✅ Memory bank updates properly

### Complete (After All Phases)
- ✅ All 22 bugs fixed or addressed
- ✅ Codebase is TypeScript clean
- ✅ Tests are reliable and comprehensive
- ✅ Development experience is smooth

## Risk Mitigation

### High Risk Areas
1. **ErrorBoundary component**: May require significant refactoring
   - Mitigation: Create minimal fix first, refactor later if needed

2. **API provider validation**: Complex logic with multiple providers
   - Mitigation: Focus on fixing TypeScript errors first, then test functionality

3. **Fetch mocking**: Bun's mocking API may have limitations
   - Mitigation: Use simpler mock patterns if complex mocking fails

### Testing Strategy
1. After each fix, run TypeScript compilation
2. After critical fixes, run test suite
3. After all fixes, run development server and manual testing
4. Create regression tests for fixed bugs

## Resource Requirements

### Tools
- Bun runtime (already installed)
- TypeScript 5.8+
- Vite development server
- Code editor with TypeScript support

### Knowledge
- React 19 with TypeScript
- Bun test framework
- Vite build system
- LLM API integration patterns

## Verification Checklist

After implementing fixes, verify:

- [ ] `bun run tsc --noEmit` returns no errors
- [ ] `bun test` passes all 80 tests
- [ ] `bun run dev` starts and stays running
- [ ] Browser loads application without console errors
- [ ] API provider switching works in UI
- [ ] Scenario filtering works correctly
- [ ] Character creation saves properly
- [ ] Memory bank updates during story

## Contingency Plan

If fixes take longer than expected:

1. **Priority 1**: Fix only critical TypeScript errors (Phase 1)
2. **Priority 2**: Get dev server running (Phase 2.1)
3. **Priority 3**: Fix API provider issues (Phase 2.2)
4. **Defer**: Test improvements and environment fixes (Phases 3-4)

## Documentation Updates Required

After fixes are complete:

1. Update `TESTING.md` with any changed test commands
2. Update `BUGS.md` to mark bugs as resolved
3. Update `README.md` if build/run instructions change
4. Add any new development notes

---

*Fix Plan Created: April 30, 2026*  
*Based on Bug Report in BUGS.md*