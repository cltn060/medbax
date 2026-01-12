# Implementation Plans

Feature-based implementation documentation for MedBax.

## Structure

```
implementation/
├── architecture/     # System-wide architecture docs
├── chat/             # AI chat feature implementation
├── schema/           # Database schema & data models
└── api/              # API layer (FastAPI RAG backend)
```

## Document Naming

Each feature has versioned docs: `{feature}_implementation_v{N}.md`

- **v1** - Initial implementation (full context + details)
- **v2+** - Incremental changes (changelog + updated details)

## Template

See `_TEMPLATE.md` in any feature directory.
