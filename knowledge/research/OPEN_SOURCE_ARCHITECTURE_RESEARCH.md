# MOROAI 1 — OPEN SOURCE ARCHITECTURE RESEARCH

Status: ACTIVE

## Research Principle

Do not rely only on README descriptions.

For important decisions inspect:

- architecture
- source code
- interfaces
- agent loops
- state management
- repository intelligence
- tools
- environments
- tests
- recent releases/commits
- licenses

---

## OpenHands Software Agent SDK

Repository:
OpenHands/software-agent-sdk

Useful concepts:

- Agent
- Tools
- Workspace
- Conversation
- Events
- typed modular components
- centralized mutable state
- composability
- application/core separation

Potential MOROAI adaptation:

- explicit Environment/Workspace
- stronger core/application separation
- centralized session state
- replaceable tools

Decision:

ADAPT CONCEPTS

---

## Aider

Repository:
Aider-AI/aider

Key concept:

Repository Map.

Useful concepts:

- symbols
- functions
- classes
- definitions
- dependencies
- relevance
- task-specific context
- context efficiency

Potential MOROAI adaptation:

Upgrade RepositoryMap.js into semantic repository intelligence.

Decision:

ADAPT

---

## mini-SWE-agent

Repository:
SWE-agent/mini-swe-agent

Useful concepts:

- minimal agent loop
- Agent
- Environment
- Model
- simple shell interface
- low complexity

Potential MOROAI adaptation:

Keep the architecture small and modular.

Decision:

ADAPT

---

## SWE-agent

Repository:
SWE-agent/SWE-agent

Useful concepts:

- Agent-Computer Interface
- environment feedback
- repository browsing
- editing
- execution
- configurable tools

Potential MOROAI adaptation:

Create a clean Brain -> Environment boundary.

Decision:

ADAPT

---

# ADDITIONAL RESEARCH TARGETS

Future research should investigate:

- AST/indexing engines
- tree-sitter based repository analysis
- MCP
- tool registries
- agent memory
- workflow/state machines
- patch engines
- test runners
- evaluation frameworks
- model routers
- local LLM execution
- Git automation
- sandboxed environments
- context compression
- retrieval systems

Each useful project must be recorded before architectural adoption.

