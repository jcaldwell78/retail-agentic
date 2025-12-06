# Long Roadmap Task Implementation

You are tasked with implementing roadmap tasks for approximately 2 hours of work. Focus on completing tasks systematically with the following requirements:

## Requirements

1. **Select Tasks**: Choose approximately 15-20 uncompleted tasks from docs/ROADMAP.md that can be completed within 2 hours
2. **Implementation Standards**:
   - All code must have comprehensive unit tests
   - All tests must pass before marking tasks complete
   - All builds must succeed (both backend and frontend)
   - Follow project best practices from CLAUDE.md
   - Use TypeScript strict mode for frontend
   - Use reactive programming patterns for backend
   - Ensure multi-tenant isolation in all backend code

3. **Testing Requirements**:
   - Backend: Use JUnit/Mockito, aim for 80%+ coverage
   - Frontend: Use Vitest + React Testing Library
   - All new components need comprehensive test coverage
   - Run `npm test -- --run` for frontend tests
   - Run `mvn test` for backend tests

4. **Build Verification**:
   - Frontend: `npm run build` must succeed
   - Backend: `mvn clean install` must succeed
   - Fix any TypeScript or Java compilation errors

5. **Task Selection Priority**:
   - Focus on MVP-critical tasks (marked with priority in roadmap)
   - Complete related tasks together (e.g., all payment tasks, all OAuth tasks)
   - Backend and frontend can be done in parallel conceptually
   - Prefer tasks with clear dependencies already met

6. **Session Completion Criteria**:
   - **CRITICAL**: Continue working for approximately 2 hours OR until all selected tasks are complete
   - Do NOT stop after completing just a few tasks - keep working for the full 2-hour duration
   - Each individual task is only "done" when:
     - Code is written
     - Tests are written and passing
     - Build succeeds
     - Code is committed (if requested)
   - Update ROADMAP.md to mark completed tasks with [x]

7. **Work Approach**:
   - Create a TodoWrite list at the start with 15-20 tasks (approximately 2 hours of work)
   - Work systematically through each task, marking as complete when done
   - After completing each task, immediately move to the next one
   - Continue until approximately 2 hours have passed or all tasks are complete
   - Test frequently during development
   - Run full test suite periodically
   - If stuck on a task for >15 minutes, document the blocker and move on to the next task

8. **Focus Areas** (in order of priority):
   - Payment integration (PayPal gateway, processing, refunds, webhooks)
   - OAuth2 authentication (Google, Facebook)
   - Missing E2E tests for critical flows
   - Performance optimization tasks
   - Any remaining admin-web or consumer-web features

## Output

Provide a summary at the end showing:
- Tasks completed with test counts
- Test results (passing/failing)
- Build status
- Any blockers or incomplete tasks
- Updated ROADMAP.md

Start working immediately and continue until approximately 2 hours of implementation time has passed or all selected tasks are complete.
