# Fix Chat Loading Flow - Requirements

## Overview
The chat creation flow is currently stuck at "AI is analyzing..." state with no progress. The `/api/chat/new` request is being sent but not completing, causing a poor user experience with no feedback or error handling.

## Problem Statement
When a user uploads an image and navigates to the chat page:
1. The auto-start flow successfully uploads the image to R2
2. The prompt is built correctly
3. The `/api/chat/new` request is sent
4. **The request hangs indefinitely with no response**
5. The UI shows "AI is analyzing..." with no progress indication
6. No error is displayed to the user
7. The left side has no dynamic animation showing current state

## User Stories

### 1. As a user, I want to see clear progress indicators during chat creation
**Acceptance Criteria:**
- 1.1 When the chat creation starts, I see a "Creating chat..." indicator
- 1.2 If the request takes longer than 5 seconds, I see a timeout warning
- 1.3 If the request fails, I see a clear error message with retry option
- 1.4 The loading state shows animated progress, not static text

### 2. As a user, I want the chat creation to complete successfully
**Acceptance Criteria:**
- 2.1 The `/api/chat/new` endpoint responds within 10 seconds
- 2.2 If the database operation fails, I get a meaningful error message
- 2.3 The chat is created in the database before navigation occurs
- 2.4 After successful creation, I'm navigated to the chat page

### 3. As a user, I want to see synchronized loading states on both sides
**Acceptance Criteria:**
- 3.1 Left side shows "Creating your chat..." with animated loader
- 3.2 Right side shows "Preparing workspace..." with animated loader
- 3.3 Both sides transition smoothly to the next state
- 3.4 Loading animations are consistent and professional

### 4. As a developer, I want better error handling and logging
**Acceptance Criteria:**
- 4.1 All async operations have try-catch blocks
- 4.2 Errors are logged with context (function name, parameters)
- 4.3 Database connection errors are caught and reported
- 4.4 Timeout errors are handled gracefully

## Technical Requirements

### 1. Add Request Timeout
- Add 10-second timeout to `/api/chat/new` request
- Show timeout error if exceeded
- Provide retry button

### 2. Improve Error Handling
- Wrap all database operations in try-catch
- Log errors with full context
- Return meaningful error messages to client
- Handle rate limiting errors specifically

### 3. Add Loading State Management
- Track loading phase: "uploading" → "creating" → "navigating"
- Update UI based on current phase
- Show animated loaders for each phase
- Transition smoothly between phases

### 4. Add Server-Side Logging
- Log when `/api/chat/new` receives request
- Log database operation start/end
- Log any errors with stack traces
- Log successful chat creation

### 5. Add Client-Side Retry Logic
- If request fails, show retry button
- Allow user to retry up to 3 times
- Clear error state on retry
- Show different error messages for different failure types

## Out of Scope
- Changing the database schema
- Modifying the authentication system
- Changing the prompt building logic
- Redesigning the entire chat UI

## Success Metrics
- Chat creation completes within 5 seconds 95% of the time
- Users see clear progress indicators at every step
- Error rate for chat creation is below 1%
- Users can successfully retry failed operations
- No more "stuck" states with no feedback

## Dependencies
- Existing database connection must be working
- User authentication must be functional
- R2 storage upload must be working (already confirmed working)

## Risks
- Database connection might be slow or timing out
- Rate limiting might be blocking requests
- Authentication might be failing silently
- Network issues might cause timeouts

## Notes
- The R2 upload is working correctly (confirmed by user)
- The prompt building is working correctly (confirmed by logs)
- The issue is specifically with the `/api/chat/new` endpoint
- The user is logged in (confirmed by logs)
