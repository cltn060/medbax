# Implementation Plans

Feature-based implementation documentation for MedBax.

## Structure

```
implementation/
├── chat/             # AI chat feature implementation
├── knowledge-bases/  # Knowledge bases (RAG collections) feature
├── marketing/        # Marketing pages implementation
├── subscriptions/    # Stripe subscription implementation
└── _TEMPLATE.md      # Template for new feature docs
```

## Document Naming

Each feature has versioned docs: `{feature}_implementation_v{N}.md`

- **v1** - Initial implementation (full context + details)
- **v2+** - Incremental changes (changelog + updated details)

## Template

See `_TEMPLATE.md` in any feature directory.
