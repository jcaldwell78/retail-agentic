# Slash Commands

This directory contains slash commands for invoking specialized agent roles in the retail platform project.

## Available Commands

### Agent Commands

Invoke specialized agents to get role-specific guidance and implementation:

| Command | Agent | Color | Description |
|---------|-------|-------|-------------|
| `/architect` | Architect Agent | 🔵 Blue | System architecture and design decisions |
| `/planner` | Planner Agent | 🟣 Purple | Task breakdown and sprint planning |
| `/pm` | Product Manager | 🟤 Brown | Requirements, prioritization, business value |
| `/backend` | Backend Developer | 🟢 Green | Java/Spring/Reactor implementation |
| `/frontend` | Frontend Developer | 🔵 Cyan | React/TypeScript UI implementation |
| `/design` | UI/UX Designer | 🌸 Pink | Design systems and user experience |
| `/testing` | Testing Agent | 🟠 Orange | Quality assurance and test implementation |
| `/integration` | Integration Agent | 🟡 Amber | Cross-service integration and E2E testing |
| `/devops` | DevOps Agent | 🔴 Red | Infrastructure, CI/CD, deployment |

## Usage Examples

### Architecture Review
```
/architect

Review the proposed multi-tenant data isolation strategy for the product catalog.
```

### Feature Planning
```
/planner

Break down the "Shopping Cart with Persistence" feature into implementable tasks.
```

### Requirements Definition
```
/pm

Help prioritize these feature requests: product reviews, wishlist, gift cards, subscriptions.
```

### Backend Implementation
```
/backend

Implement a reactive product search endpoint with filters for category, price range, and dynamic attributes.
```

### Frontend Development
```
/frontend

Create a responsive product card component with image lazy loading, add to cart button, and whitelabel branding support.
```

### UI/UX Design
```
/design

Design the checkout flow for the consumer web app, including cart review, shipping, payment, and confirmation.
```

### Quality Assurance
```
/testing

Write comprehensive tests for the product search feature, including unit tests, integration tests, and E2E scenarios.
```

### Integration Testing
```
/integration

Verify that the product creation flow works end-to-end from admin UI through backend API to database.
```

### Infrastructure Setup
```
/devops

Set up GitHub Actions CI/CD pipeline for automated testing and deployment of all three subprojects.
```

## How It Works

When you use a slash command:
1. The command file is loaded from `.claude/commands/`
2. The content becomes part of the conversation context
3. I respond as the specified agent role
4. The agent definition from `.claude/agents/` provides detailed guidelines

## Agent Definitions

Full agent definitions with detailed responsibilities are available in:
```
.claude/agents/
├── ARCHITECT.md
├── PLANNER.md
├── PRODUCT_MANAGER.md
├── BACKEND_DEVELOPER.md
├── FRONTEND_DEVELOPER.md
├── UI_UX_DESIGNER.md
├── TESTING.md
├── INTEGRATION.md
├── DEVOPS.md
└── COLORS.md
```

## Best Practices

### When to Use Agents

- **Architecture decisions**: Use `/architect`
- **Breaking down features**: Use `/planner`
- **Understanding business value**: Use `/pm`
- **Writing backend code**: Use `/backend`
- **Creating UI components**: Use `/frontend`
- **Designing user flows**: Use `/design`
- **Ensuring quality**: Use `/testing`
- **Cross-service issues**: Use `/integration`
- **Deployment concerns**: Use `/devops`

### Combining Agents

You can switch between agents in a conversation:

```
/pm
Define requirements for the product recommendation feature.

[After PM provides requirements]

/architect
Design the architecture for implementing these recommendations.

[After architecture is defined]

/backend
Implement the recommendation engine according to the architecture.
```

### Agent Colors

Each agent has a distinct color for visual identification in documentation and diagrams. See `.claude/agents/COLORS.md` for the complete color scheme and usage guidelines.

## Creating New Commands

To add a new slash command:

1. Create a new `.md` file in this directory
2. Write the command prompt/instructions
3. Document it in this README

Example:
```markdown
<!-- .claude/commands/mycommand.md -->
You are now acting as...

Your role is to:
- Do something specific
- Follow these guidelines

Please approach the current task...
```

Then use it with `/mycommand`.

## Related Documentation

- [Agent Definitions](.claude/agents/)
- [Project Context](../CLAUDE.md)
- [Architecture Documentation](../docs/architecture/)
- [Development Guides](../docs/development/)
