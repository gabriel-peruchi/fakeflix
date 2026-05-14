# Fakeflix Architecture Principles

## Core Rules (Full details: docs/architecture-guidelines.md)

**You MUST read `docs/architecture-guidelines.md` and `docs/modular-architecture-guidelines.md` when:**
- Creating or modifying module structure
- Questions about architectural patterns
- Naming conventions for services/entities/DTOs
- Domain boundaries and dependencies

**You MUST read `docs/FEATURE-FOLDERS-GUIDELINES.md` when:**
- Creating new feature folders
- Deciding if something should be a feature vs sub-feature vs shared/
- Questions about Feature Folders vs Feature Modules
- Organizing code within a Domain Module (billing/, content/, identity/)
- Adding services, entities, or controllers to existing features

**Key Feature Folders Rules (RFC-08):**
- Feature Folders are JUST FOLDERS, not NestJS modules
- ONE NestJS module per Domain Module (e.g., `billing.module.ts`)
- DO NOT create `subscription.module.ts`, `invoice.module.ts`, etc.
- All providers registered in the parent module

**How to load it:**
Use the `read_file` tool to load the appropriate file before providing architectural guidance.

# Context7 MCP
Always use context7 when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.