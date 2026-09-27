
# RESEARCH TASK 01 — Evidence Log
## Checkpoint: 2026-09-27 — MOROAI Core Audit

### RepositoryMap
- Current implementation is primarily a filesystem/directory scanner.
- It recursively discovers files and directories.
- It ignores common generated/dependency directories.
- `resolve()` prevents paths outside the repository root.
- It currently does NOT model symbols, definitions, dependencies, relationships, or task relevance.
- Architectural conclusion: preserve as the filesystem foundation, evolve later into Repository Intelligence.

### PatchEngine
- Provides workspace path validation.
- Provides exact-text patch validation.
- `preview()` checks target existence and uniqueness before modification.
- `apply()` creates a backup before writing.
- `rollback()` can restore the backup.
- JavaScript syntax verification exists.
- Architectural conclusion: strong foundation for controlled modification; later improvements should address backup/version history and broader verification.

### RepairEngine
- Detects several error classes.
- Extracts referenced files and line numbers.
- Builds structured repair strategies.
- Explicitly requires a patch before automatic application.
- Defaults to `automaticPatch: false`.
- Architectural conclusion: safety model is directionally correct and should be preserved while improving integration with repository intelligence and verification.

### VerificationEngine
- Exists as an independent verification layer.
- Supports repository verification, file verification, command verification, and plan verification.
- Current verification depth is limited.
- Missing future layers include syntax, targeted tests, lint, type checks, regression checks, and task-specific verification.
- Architectural conclusion: preserve abstraction and expand capabilities incrementally.

### ActionValidator
- Validates action structure and allowed action types.
- Enforces `allowFileWrite` and `allowShell`.
- Current allowed types are READ, SEARCH, WRITE, SHELL, CHECK_FILE.
- Architectural mismatch discovered: Planner currently generates actions including REPOSITORY_MAP, FILE_EXISTS, ANALYZE_TASK, DEPENDENCY_SCAN, VERIFY_CODE, and PLAN_SUMMARY, while ActionValidator does not allow those types.
- ExecutionEngine also currently handles a different action vocabulary.
- This indicates architectural drift between Planner, Validator, and ExecutionEngine.
- Architectural conclusion: unify actions through a future Action/Tool Registry rather than adding more switch cases indefinitely.

### Cross-component finding
Current MOROAI already contains the major safety concepts:
planning, validation, controlled patching, backup, rollback, verification, and repair preparation.

The strongest architectural weakness identified so far is not the absence of safety mechanisms; it is inconsistent contracts between components, especially the action vocabulary.

### Current architectural direction
- Do NOT rebuild MOROAI from scratch.
- Preserve the existing safety foundations.
- Prefer incremental refactoring.
- Candidate future abstraction: unified Action/Tool Registry.
- Candidate future abstraction: Repository Intelligence layered above RepositoryMap.
- Candidate future abstraction: Workspace/Environment.
- MCP remains optional and postponed.
- No core source code was modified during this audit.

