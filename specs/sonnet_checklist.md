# Sonnet Checklist: Missing Instructions and Clarifications Needed

This checklist identifies missing instructions, unclear requirements, and questions that need to be addressed to generate a working application.

## Missing Technical Specifications

### Database Schema & Data Model

- [ ] **Missing: Complete database schema definition**
  - What are the exact table structures for sqids, players, games, game_types, rivalries, stats?
  - What are the relationships between entities (foreign keys, constraints)?
  - What indexes are needed for performance?
  - What data types and field lengths should be used?

- [ ] **Missing: DuckDB connection and configuration details**
  - What is the connection string format for DuckDB?
  - Should the database file be stored locally or in memory?
  - What are the backup and persistence strategies?

- [ ] **Missing: Migration strategy specifics**
  - What migration tool should be used with DuckDB?
  - How should version control for schema changes be handled?
  - What happens if migrations fail in production?

### API Specifications

- [ ] **Missing: Complete REST endpoint definitions**
  - What are all the required endpoints (GET, POST, PUT, DELETE)?
  - What are the request/response payload structures?
  - What status codes should be returned for different scenarios?
  - What validation rules apply to each endpoint?

- [ ] **Missing: WebSocket event specifications**
  - What Socket.IO events need to be implemented?
  - What data structure should be sent for real-time updates?
  - How should connection failures be handled?
  - What rooms/namespaces should be used for Sqid isolation?

- [ ] **Missing: Authentication/Authorization details**
  - How exactly does Sqid-based access control work?
  - Should there be middleware to validate Sqids?
  - What happens if an invalid Sqid is provided?
  - Are there any admin/owner permissions within a Sqid?

### Frontend Component Specifications

- [ ] **Missing: Detailed component requirements**
  - What props and state should each component have?
  - What are the exact UI layouts for mobile vs desktop?
  - How should components communicate with each other?
  - What loading states and error handling should be implemented?

- [ ] **Missing: Routing specifications**
  - What are ALL the routes needed (not just /cards/:sqid)?
  - What should happen on invalid routes?
  - How should route parameters be validated?
  - What navigation patterns should be used?

### Game Logic Clarifications Needed

- [ ] **Unclear: Win/Loss condition logic**
  - How exactly are win/loss conditions stored and evaluated?
  - Can conditions be complex (e.g., "first to 500 OR first to lead by 100")?
  - What happens if multiple players reach the condition simultaneously?

- [ ] **Unclear: Rivalry creation and management**
  - When exactly are rivalries auto-created vs manually created?
  - Can the same players have multiple rivalries for different game types?

- [ ] **Unclear: Score update timing and UX**
  - How exactly should the 3-second score tally work?
  - Should score updates be debounced before sending to server?
  - What happens if network is slow/offline during scoring?

### UI/UX Specifications

- [ ] **Missing: Responsive design breakpoints**
  - What specific breakpoints should be used for mobile/tablet/desktop?
  - How should layouts change at each breakpoint?
  - What specific vwh font size scales should be used?

- [ ] **Missing: Dark theme color palette**
  - What specific DaisyUI theme should be used?
  - Are there custom colors needed beyond DaisyUI defaults?
  - What accessibility contrast requirements must be met?

- [ ] **Missing: Touch interaction specifications**
  - What minimum touch target sizes are required?
  - How should gestures like swipe/pinch be handled?
  - What feedback should be provided for touch interactions?

### Real-time and Error Handling

- [ ] **Missing: Offline/reconnection strategy**
  - What should happen when WebSocket connection is lost?
  - How should queued actions be handled when reconnecting?
  - What UI indicators show connection status?

- [ ] **Missing: Error handling specifications**
  - What specific error messages should be shown to users?
  - How should database errors be communicated to clients?
  - What retry mechanisms should be implemented?

## Development Environment Requirements

- [ ] **Missing: Development tooling specifications**
  - What specific versions of Node.js, npm should be used?
  - What VS Code extensions are required vs recommended?
  - What debugging configurations are needed?

- [ ] **Missing: Testing strategy details**
  - What specific test frameworks should be used?
  - What minimum test coverage is required?
  - How should real-time features be tested?
  - What devices/browsers must be tested?

## Deployment and Production

- [ ] **Missing: Raspberry Pi deployment specifics**
  - What OS and version should be used on Pi?
  - What performance optimizations are needed for Pi hardware?
  - How should the app auto-start on Pi boot?
  - What monitoring/logging should be implemented?

- [ ] **Missing: Production configuration**
  - What environment variables are needed in production?
  - How should secrets be managed?
  - What SSL/HTTPS configuration is required?
  - What backup strategies should be needed?

## Security Considerations

- [ ] **Missing: Security specifications**
  - What rate limiting should be implemented?
  - How should CORS be configured?
  - What input validation/sanitization is required?
  - Are there any data retention/privacy requirements?

## Performance Requirements

- [ ] **Missing: Performance benchmarks**
  - What response time requirements exist for API calls?
  - How many concurrent users should be supported per Sqid?
  - What are the maximum database size expectations?
  - What caching strategies should be used?

## Questions for Clarification

### Business Logic Questions

1. **Game Types**: Should there be a predefined list of common card games, or start empty?
2. **Player Limits**: What's the maximum number of players per game?
3. **Score Limits**: Are there minimum/maximum score values?
4. **Data Retention**: How long should game history be kept?
5. **Sqid Management**: Who can create new Sqids? How are they generated?

### Technical Architecture Questions

1. **State Management**: Should frontend use a state management library (Redux, Zustand)?
2. **Data Validation**: Should validation be client-side, server-side, or both?
3. **File Structure**: What specific folder structure should be used within api/ and app/?
4. **Build Process**: Should there be Docker containers for development/production?

### User Experience Questions

1. **Navigation**: Should there be a global navigation menu or contextual navigation?
2. **Onboarding**: Should there be help/tutorial content for new users?
3. **Mobile Optimization**: Should there be PWA features like offline support?
4. **Accessibility**: What specific WCAG compliance level is required?

## Action Items for LLM Collaboration

- [ ] Address each missing specification by providing detailed requirements
- [ ] Answer all clarification questions with specific business/technical decisions
- [ ] Create detailed component wireframes or mockups
- [ ] Define complete API specifications (OpenAPI/Swagger format)
- [ ] Create database schema with example data
- [ ] Establish coding standards and style guides
- [ ] Define testing requirements and coverage expectations
- [ ] Create deployment runbooks and troubleshooting guides

---

**Note**: This checklist should be worked through systematically with an LLM to ensure all requirements are clear and complete before implementation begins.
