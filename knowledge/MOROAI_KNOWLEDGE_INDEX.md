# MOROAI 1 — KNOWLEDGE INDEX

## PURPOSE

This directory is the persistent project knowledge base for MOROAI 1.

Knowledge is never considered permanently complete.

Before every major implementation decision, MOROAI must:
1. inspect its current repository
2. inspect relevant existing code
3. research relevant open-source projects
4. compare multiple implementations when useful
5. inspect actual source code, not only README files
6. inspect licenses
7. record findings
8. decide ADOPT / ADAPT / REJECT / POSTPONE
9. implement the smallest justified change
10. verify the result
11. update project knowledge

Open-source research is a design input, not permission to blindly copy code.

---

# CORE VISION

MOROAI 1 is a modular AI software-engineering system intended to:

- understand natural-language tasks
- understand its own repository
- research relevant open-source implementations
- compare architectural approaches
- plan changes
- execute controlled actions
- modify code safely
- verify changes
- diagnose failures
- prepare and apply explicit repairs
- rollback unsafe changes
- maintain persistent project knowledge
- eventually support multiple AI/model providers
- remain zero-cost-first
- remain provider-independent

MOROAI itself remains the architectural coordinator.

---

# CURRENT ARCHITECTURE

AgentCore
    |
CodingBrain
    |
Knowledge / Research
    |
Repository Intelligence
    |
Planner
    |
Action / Tool Bus
    |
Environment / Workspace
    |
Execution
    |
Verification
    |
Repair / Rollback
    |
Knowledge Update

---

# CURRENT CORE COMPONENTS

- agents/AgentCore.js
- core/AgentLoop.js
- core/CodingBrain.js
- core/Planner.js
- core/ExecutionEngine.js
- core/PatchEngine.js
- core/RepairEngine.js
- core/RepositoryMap.js
- core/PromptEngine.js
- core/doctor.js
- core/index.js
- memory/MemoryStore.js

---

# CURRENT STATE

- Node.js
- ES Modules
- private repository
- zero-cost-first policy
- controlled file writing
- controlled shell execution
- planning before write
- verification after write
- explicit repair patch requirement
- backup before patch
- rollback after failed verification
- Git repository initialized
- main branch exists

Current underdeveloped areas:

- models/
- tests/
- workspace/
- open-source research integration
- structured persistent knowledge
- semantic repository intelligence
- extensible action system
- real model integration
- stronger verification
- evaluation
- controlled self-improvement

---

# ARCHITECTURAL DECISION

DO NOT REBUILD MOROAI 1 FROM SCRATCH.

Evolve the current architecture.

Existing working components should only be replaced when there is concrete evidence that replacement solves an identified problem.

Every architectural change must answer:

1. What problem does this solve?
2. What evidence supports it?
3. Which open-source implementations were inspected?
4. Why does the approach fit MOROAI?
5. What could break?
6. How will it be verified?
7. How can it be rolled back?

---

# OPEN-SOURCE RESEARCH POLICY

For important engineering problems, MOROAI may inspect multiple open-source projects.

Initial references:

- OpenHands Software Agent SDK
- Aider
- mini-SWE-agent
- SWE-agent

These are references, not dependencies.

MOROAI may discover and inspect additional projects covering:

- coding agents
- repository indexing
- AST analysis
- agent memory
- tool protocols
- MCP
- workflow/state machines
- patching
- testing
- verification
- model routing
- local model execution
- Git integration
- agent evaluation

The best idea may come from any project.

Never assume the most famous project is automatically the best.

---

# RESEARCH REQUIREMENT

Before every major build, programming operation, architectural change, or important feature completion:

1. Inspect MOROAI repository.
2. Inspect relevant implementation.
3. Search GitHub/open-source projects.
4. Compare multiple implementations where appropriate.
5. Read useful source code.
6. Inspect project direction/recent changes.
7. Check licenses.
8. Record findings.
9. Choose ADOPT / ADAPT / REJECT / POSTPONE.
10. Implement.
11. Verify.
12. Update knowledge.

---

# RESEARCH REFERENCES

## OpenHands Software Agent SDK

Useful concepts:

- modular Agent SDK
- Agent / Tools / Workspace separation
- composable components
- centralized state
- application/core separation
- replaceable tools and components

MOROAI direction:

- strengthen separation between AgentCore and CLI
- introduce explicit Environment/Workspace abstraction
- centralize session state
- keep tools composable
- remain provider-independent

Do not copy OpenHands wholesale.

---

## Aider

Important concept:

Repository Map.

RepositoryMap should eventually understand:

- files
- symbols
- classes
- functions
- definitions
- relationships
- dependencies
- relevance
- task-specific context
- context/token efficiency

Target:

Repository
 -> Files
 -> Symbols
 -> Dependencies
 -> Relationships
 -> Relevance
 -> Task Context

---

## mini-SWE-agent

Useful concepts:

- minimal agent loop
- Agent
- Environment
- Model
- simple execution
- polymorphic components
- low framework complexity

MOROAI lesson:

Do not over-engineer.

Every abstraction must justify its existence.

---

## SWE-agent

Useful concepts:

- Agent-Computer Interface
- environment feedback
- repository browsing
- editing
- execution
- configurable tools

MOROAI lesson:

The boundary between CodingBrain and Environment should become explicit.

---

# PRIORITY ROADMAP

Priority 1:
Knowledge foundation + research protocol

Priority 2:
Repository Intelligence

Priority 3:
Environment abstraction

Priority 4:
Extensible Action / Tool Bus

Priority 5:
Stronger CodingBrain

Priority 6:
Model / Provider abstraction

Priority 7:
Verification + automated tests

Priority 8:
Controlled self-improvement

---

# KNOWLEDGE FRESHNESS

Knowledge becomes stale when:

- architecture changes
- major component changes
- dependencies change
- relevant open-source project changes significantly
- new reference projects become relevant
- previous architectural decisions become invalid

When stale, update knowledge before major development continues.

---

# CURRENT RESEARCH STATUS

Status:
ACTIVE

The knowledge base must continue evolving with MOROAI.

