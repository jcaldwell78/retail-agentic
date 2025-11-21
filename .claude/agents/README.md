# Agent Descriptors

This directory contains descriptor files for specialized AI agents designed to work on the retail platform project. Each agent has specific responsibilities, expertise, and guidelines for their domain.

## Agent Colors

Each agent has a distinct color for visual identification in diagrams and documentation. See [COLORS.md](./COLORS.md) for complete color specifications.

| Agent | Color | Hex |
|-------|-------|-----|
| 🔵 Architect | Blue | `#3B82F6` |
| 🟣 Planner | Purple | `#A855F7` |
| 🟢 Backend Developer | Green | `#10B981` |
| 🔵 Frontend Developer | Cyan | `#06B6D4` |
| 🌸 UI/UX Designer | Pink | `#EC4899` |
| 🟠 Testing | Orange | `#F97316` |
| 🟡 Integration | Amber | `#F59E0B` |
| 🔴 DevOps | Red | `#EF4444` |

## Available Agents

### 1. UI/UX Designer Agent ⭐ NEW - PRIORITY

**File**: `UI_UX_DESIGNER.md`
**Role**: Design systems, user flows, visual design, accessibility
**Use When**: Creating design systems, designing user interfaces, defining component libraries, establishing visual guidelines
**Priority**: Clean, modern UI/UX is critical to project success. This agent should work BEFORE frontend implementation.

### 2. Architect Agent

**File**: `ARCHITECT.md`
**Role**: System design, architecture decisions, and technical specifications
**Use When**: Designing new features, planning system architecture, defining API contracts, making technology decisions

### 3. Planner Agent

**File**: `PLANNER.md`
**Role**: Breaking down features into actionable tasks, coordinating work
**Use When**: Starting new features, organizing complex work, creating implementation roadmaps, estimating effort

### 4. Backend Developer Agent

**File**: `BACKEND_DEVELOPER.md`
**Role**: Implementing Java/Spring/Reactor backend code
**Use When**: Writing backend services, creating API endpoints, implementing reactive flows, database operations

### 5. Frontend Developer Agent

**File**: `FRONTEND_DEVELOPER.md`
**Role**: Implementing React/TypeScript frontend applications per design specs
**Use When**: Building UI components per design specs, implementing designs with Tailwind + shadcn/ui, creating API clients, state management

### 6. Testing Agent

**File**: `TESTING.md`
**Role**: Writing and running tests at all levels
**Use When**: Creating test suites, ensuring code quality, finding bugs, verifying functionality

### 7. Integration Agent

**File**: `INTEGRATION.md`
**Role**: Ensuring components work together, verifying API contracts
**Use When**: Integrating frontend and backend, troubleshooting cross-component issues, verifying end-to-end flows

### 8. DevOps Agent

**File**: `DEVOPS.md`
**Role**: Build systems, CI/CD, infrastructure, deployment
**Use When**: Setting up build pipelines, configuring infrastructure, deployment automation, monitoring setup

## How to Use Agent Descriptors

### For AI Agent Systems

When invoking an AI agent to work on a task:

1. **Load the appropriate descriptor** - Read the relevant `.md` file for the agent type needed
2. **Provide as context** - Include the descriptor in the agent's system prompt or context
3. **Reference the task** - Clearly state what needs to be done and reference the agent's guidelines
4. **Specify deliverables** - Be clear about what outputs are expected

Example workflow:

```
Task: "Implement product search API"
→ Load PLANNER.md → Create task breakdown
→ Load ARCHITECT.md → Design search architecture
→ Load BACKEND_DEVELOPER.md → Implement the API
→ Load TESTING.md → Write tests
→ Load INTEGRATION.md → Verify integration
```

### For Human Developers

These descriptors also serve as:

- **Role definitions** for team members
- **Best practices guides** for each domain
- **Code examples** showing project patterns
- **Quality standards** for deliverables

## Agent Collaboration Patterns

### Pattern 1: Feature Development (with UI)

```
User Request
    ↓
Planner Agent (creates task breakdown)
    ↓
Architect Agent (designs technical architecture)
    ↓
UI/UX Designer Agent (creates design system & mockups) ⭐ FIRST
    ↓
Backend Developer Agent (implements API)
    ↓
Frontend Developer Agent (implements UI per designs)
    ↓
Testing Agent (verifies quality)
    ↓
Integration Agent (validates end-to-end)
```

### Pattern 1b: Backend-Only Feature Development

```
User Request
    ↓
Planner Agent (creates task breakdown)
    ↓
Architect Agent (designs solution)
    ↓
Backend Developer Agent (implements)
    ↓
Testing Agent (verifies quality)
    ↓
Integration Agent (validates end-to-end)
```

### Pattern 2: Bug Fix

```
Bug Report
    ↓
Integration Agent (reproduces and diagnoses)
    ↓
Planner Agent (determines fix approach)
    ↓
Developer Agent (implements fix)
    ↓
Testing Agent (verifies fix and regression)
    ↓
Integration Agent (validates resolution)
```

### Pattern 3: Architecture Change

```
Architecture Need
    ↓
Architect Agent (proposes design)
    ↓
Planner Agent (breaks down migration)
    ↓
DevOps Agent (prepares infrastructure)
    ↓
Developer Agents (implement changes)
    ↓
Testing Agent (validates migration)
    ↓
Integration Agent (verifies system health)
```

## Customizing Agent Descriptors

Feel free to modify these descriptors to match your project's needs:

1. **Add project-specific patterns** - Include your team's conventions
2. **Update technology versions** - Keep framework versions current
3. **Add examples** - Include actual code from your project
4. **Refine responsibilities** - Adjust based on what works for your team
5. **Add tools** - Include specific tools or libraries you use

## Descriptor Maintenance

Keep these descriptors updated as the project evolves:

- **Review quarterly** - Ensure they reflect current practices
- **Update after major changes** - New frameworks, patterns, or tools
- **Gather feedback** - From both AI agents and human developers
- **Version control** - Track changes to understand evolution

## Best Practices

### When Using Multiple Agents

1. **Clear handoffs** - Ensure each agent knows what previous agents delivered
2. **Avoid redundancy** - Don't have multiple agents do the same work
3. **Maintain context** - Share relevant information between agents
4. **Sequential vs parallel** - Know when agents can work in parallel vs sequentially

### When Writing New Descriptors

1. **Be specific** - Provide concrete examples and patterns
2. **Define boundaries** - Be clear about what the agent should NOT do
3. **Include project context** - Reference actual project structure and conventions
4. **Provide success criteria** - Make it clear what "done" looks like

### Common Pitfalls to Avoid

- **Over-specification** - Don't be so detailed that agents can't adapt
- **Under-specification** - Don't be so vague that agents don't know what to do
- **Conflicting guidance** - Ensure descriptors align with each other
- **Outdated examples** - Keep code examples current with latest practices

## Integration with Development Workflow

### During Sprint Planning

- Use **Planner Agent** to break down user stories
- Consult **Architect Agent** for design decisions
- Estimate tasks with appropriate agent descriptors

### During Development

- **Developer Agents** implement according to their descriptors
- **Testing Agent** runs continuous validation
- **Integration Agent** verifies component interaction

### During Deployment

- **DevOps Agent** handles build and deployment
- **Integration Agent** performs production validation
- **Testing Agent** runs smoke tests

## Questions and Support

For questions about:

- **Agent usage** - Refer to CLAUDE.md in project root
- **Project architecture** - See CLAUDE.md and consult Architect Agent
- **Specific technologies** - See relevant agent descriptor (Backend, Frontend, etc.)
- **Process and workflow** - See Planner Agent descriptor

## Contributing to Agent Descriptors

When improving these descriptors:

1. Test changes with actual agent interactions
2. Document what problem the change solves
3. Provide before/after examples
4. Update related descriptors if needed
5. Share learnings with the team

---

**Note**: These agent descriptors are living documents. They should evolve with the project and reflect the team's accumulated knowledge and best practices.
