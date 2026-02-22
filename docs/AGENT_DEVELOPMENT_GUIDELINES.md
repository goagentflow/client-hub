# Agent Development Guidelines

> Extracted from `AGENTS.md` to keep that file under the 300-line limit.
> These guidelines apply when building AI agents or Copilot integrations for AgentFlow.

## 1. Agents Use the Same API
- No special agent endpoints
- Same authentication (service principal or delegated)
- Same hub-scoped access controls

## 2. Agents Respect Permissions
- Agent cannot access hubs the user cannot access
- Agent cannot bypass visibility filters
- Agent actions are logged with agent identifier

## 3. Agents are Auditable
```typescript
interface AgentRequest {
  agentId: string;        // Which agent made the request
  agentType: 'copilot' | 'autonomous' | 'workflow';
  delegatedUserId?: string;  // User the agent acts on behalf of
  correlationId: string;  // Trace ID for debugging
}
```

## 4. Agents Fail Gracefully
- Return structured errors, not stack traces
- Provide actionable error messages
- Include retry guidance when appropriate
