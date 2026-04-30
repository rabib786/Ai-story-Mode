# AI Story Mode - Critical Feature Testing Plan

## Overview
This document outlines a comprehensive testing plan for verifying critical features of the AI Story Mode application. The focus is on story generation, API providers, character management, and core functionality.

## Critical Features Identified

### 1. Story Generation System
- **Gemini API Integration**: Default provider with structured response parsing
- **OpenRouter Free Models**: Dynamic model fetching and validation
- **Response Parsing**: Narrative, suggested actions, memory additions, emotion detection
- **Dialogue Tag Processing**: `<dialogue>` tag extraction and rendering

### 2. API Provider Configuration
- **Multiple LLM Providers**: Gemini, OpenAI, OpenRouter, Groq, Together AI, DeepSeek, etc.
- **Provider Switching**: Real-time API configuration changes
- **Model Selection**: Provider-specific model options
- **API Key Management**: Secure storage and validation

### 3. Character Management
- **Character Creation**: Name, description, portrait generation
- **Character Storage**: LocalStorage persistence with UUID migration
- **Character Selection**: User character assignment to scenarios
- **Portrait Generation**: AI-generated character images via Gemini

### 4. Scenario System
- **Prebuilt Scenarios**: Default story templates
- **Custom Scenarios**: User-created scenarios with characters, settings, tags
- **Scenario Storage**: Separation of prebuilt vs custom scenarios
- **Scenario Deletion**: Soft deletion for prebuilt scenarios

### 5. Memory Bank
- **Fact Tracking**: Key story events and relationship changes
- **Memory Editing**: Add, edit, delete memory entries
- **AI Integration**: Automatic memory addition from story responses
- **Persistence**: LocalStorage with migration support

### 6. UI Components
- **Responsive Design**: Mobile-first approach for Android app
- **Component Library**: Reusable React components with Tailwind CSS
- **Modal System**: Confirmation, alert, and feature modals
- **Navigation**: Bottom navigation bar with multiple views

### 7. Data Storage & Migration
- **Async Storage**: Non-blocking LocalStorage operations
- **Data Migration**: UUID format updates, schema evolution
- **Error Handling**: Graceful fallbacks for corrupted data
- **Storage Limits**: Handling quota exceeded scenarios

## Testing Strategy

### Unit Tests (Existing)
- **storyUtils.test.ts**: Response parsing and narrative processing
- **apiUtils.test.ts**: API error handling and retry logic
- **memoryUtils.test.ts**: Memory bank operations
- **openrouterService.test.ts**: OpenRouter integration
- **scenarioSuggestions.test.ts**: Scenario generation logic
- **draftService.test.ts**: Draft management

### Integration Tests Needed
1. **End-to-End Story Generation**
   - Test complete flow: Scenario → Character → API Call → Response → UI Update
   - Verify dialogue tags are properly extracted and styled
   - Confirm memory additions are saved to memory bank

2. **API Provider Switching**
   - Test switching between different LLM providers
   - Verify API key validation and error handling
   - Test fallback behavior when provider fails

3. **Character Lifecycle**
   - Create → Edit → Delete character
   - Verify portrait generation with Gemini
   - Test character assignment to active chats

4. **Scenario Management**
   - Create custom scenario with characters
   - Delete and restore prebuilt scenarios
   - Test scenario filtering and search

5. **Memory Bank Operations**
   - Add memories manually and via AI
   - Edit and delete memories
   - Verify persistence across sessions

6. **Storage Migration**
   - Test UUID migration for existing data
   - Verify backward compatibility
   - Test error recovery from corrupted data

### Manual Testing Checklist

#### Story Generation
- [ ] Select prebuilt scenario
- [ ] Choose user character
- [ ] Generate story continuation with Gemini
- [ ] Verify dialogue tags are rendered correctly
- [ ] Check suggested actions appear
- [ ] Confirm memory additions are recorded
- [ ] Test with OpenRouter free models
- [ ] Verify error handling for missing API keys

#### API Configuration
- [ ] Access Story Settings → API Configuration
- [ ] Switch between different providers
- [ ] Enter valid/invalid API keys
- [ ] Test model selection dropdown
- [ ] Verify settings are persisted

#### Character Management
- [ ] Create new character with name/description
- [ ] Generate AI portrait
- [ ] Edit existing character
- [ ] Delete character
- [ ] Assign character to new story

#### Scenario System
- [ ] Browse prebuilt scenarios
- [ ] View scenario details
- [ ] Create custom scenario
- [ ] Edit custom scenario
- [ ] Delete custom scenario
- [ ] Restore deleted prebuilt scenario

#### Memory Bank
- [ ] Open memory bank from story view
- [ ] Add manual memory entry
- [ ] Edit existing memory
- [ ] Delete memory
- [ ] Verify AI-added memories appear

#### UI/UX
- [ ] Test responsive layout on different screen sizes
- [ ] Verify all modals open/close correctly
- [ ] Test navigation between screens
- [ ] Check loading states and error messages
- [ ] Verify animations and transitions

## Test Execution Scripts

### Existing Test Commands
```bash
# Run all unit tests
bun test

# Test OpenRouter free models (requires API key)
OPENROUTER_API_KEY=... bun run test:openrouter:free
```

### Recommended Additional Tests
```bash
# End-to-end story generation test (to be created)
bun run test:e2e:story

# API provider switching test (to be created)
bun run test:e2e:providers

# Storage migration test (to be created)
bun run test:storage:migration
```

## Test Data Requirements

### API Keys Needed
1. **Gemini API Key**: For default story generation
2. **OpenRouter API Key**: For free model testing
3. **Optional**: OpenAI, Groq, Together AI keys for provider testing

### Test Scenarios
1. **Simple Scenario**: Minimal characters, straightforward plot
2. **Complex Scenario**: Multiple characters, intricate relationships
3. **Edge Cases**: Empty descriptions, special characters, long text

## Success Criteria

### Functional Requirements
- All critical features work without crashes
- API calls succeed with valid credentials
- Data persists correctly across app restarts
- Error states are handled gracefully
- UI components render correctly on target devices

### Performance Requirements
- Story generation completes within 30 seconds
- UI remains responsive during API calls
- Storage operations don't block main thread
- Memory usage remains within acceptable limits

### Quality Requirements
- No data loss during migrations
- Consistent user experience across providers
- Clear error messages for failed operations
- Accessibility features work correctly

## Risk Assessment

### High Risk Areas
1. **API Dependency**: App functionality depends on external APIs
2. **Storage Limits**: LocalStorage has 5-10MB limits
3. **UUID Migration**: Potential data corruption during migration
4. **Portrait Generation**: Depends on Gemini image generation API

### Mitigation Strategies
1. Implement offline fallback modes
2. Add storage quota monitoring
3. Create backup/restore functionality
4. Provide default placeholder portraits

## Next Steps

1. **Immediate Action**: Run existing test suite to establish baseline
2. **Priority 1**: Test story generation with Gemini (requires API key)
3. **Priority 2**: Verify OpenRouter free model functionality
4. **Priority 3**: Test character creation and management
5. **Priority 4**: Validate storage persistence and migration

## Documentation
- Update README with testing instructions
- Document API key setup process
- Create troubleshooting guide for common issues
- Add screenshot verification for UI components