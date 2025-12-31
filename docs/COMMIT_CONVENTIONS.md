```markdown
# Commit Conventions

This project uses a **Conventional Commits**-style convention to keep history clean, searchable, and machine-friendly. All contributors must follow the rules below for every commit.

## Message format

Use this structure for commit messages:
```

<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]

```

Examples:

```

feat(map): add leaflet rally markers
fix(api): handle missing EC venue coordinates
docs(readme): document setup steps for dev environment
chore(ci): update github actions node version

```

Rules:

- Use present-tense, imperative verbs: “add”, “fix”, “update”.
- Keep the subject around 50 characters, no trailing period.
- Leave a blank line between subject and body if you add a body.
- Use the body to explain the **what** and **why**, not the whole diff.

## Allowed types

Use one of these types as the prefix:

- `feat`: New user-facing feature (e.g. new map overlay, new page).
- `fix`: Bug fix (logic error, crash, layout issue).
- `docs`: Documentation only (README, inline docs, ADRs).
- `style`: Styling-only changes; no logic (CSS, formatting, minor UI tweaks).
- `refactor`: Code restructuring that doesn’t change behavior.
- `perf`: Performance improvements.
- `test`: Add or update tests.
- `build`: Build system or dependencies (package.json, Vite config, Dockerfile).
- `ci`: Continuous integration configuration (GitHub Actions, pipelines).
- `chore`: Maintenance tasks that don’t affect app behavior.

## Scopes

Use scopes to indicate the area changed; keep them short and consistent.

Recommended scopes for this project:

- `map` – Leaflet/Google Maps layers, markers, tiles.
- `ec-data` – EC schedule ingestion/parsing logic.
- `api` – Backend endpoints, DTOs, data access.
- `ui` – General frontend components and layout.
- `auth` – Authentication and access control.
- `devops` – Deployment, infrastructure, scripts.

Examples:

```

feat(ec-data): parse pdf schedule into events
refactor(api): extract traffic service
perf(map): improve marker clustering performance

```

## Breaking changes

If a commit introduces a breaking change, mark it clearly so tooling and teammates can detect it.

Use either:

```

feat(map)!: switch to new tile provider

BREAKING CHANGE: old tile provider config is no longer supported.
All env files must define MAP_TILE_URL.

```

or:

```

feat(api): change event id format

BREAKING CHANGE: eventId now uses UUID instead of numeric ID.
Clients must update their queries.

```

The footer line must start with `BREAKING CHANGE:` followed by a short summary.

## Linking issues and PRs

Reference issues and PRs in the footer when relevant:

```

fix(ec-data): handle missing rally venue

Ensure events without coordinates are logged and skipped.

Fixes #23

```

Use:

- `Fixes #<number>` to auto-close issues when merged.
- `Refs #<number>` when related but not closing the issue.

## General commit best practices

- Commit logically grouped changes; avoid huge “kitchen sink” commits.
- Prefer multiple small commits over one giant one.
- Ensure the code builds and tests pass before committing.
- Do not commit secrets, large binaries, or generated files.
```
