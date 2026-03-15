# Contributing to LingoLearn

This document covers the commit conventions, branch model, and release process. It is intended for both human contributors and AI coding assistants helping with this project.

---

## Commit conventions

All commits must use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<optional scope>): <short description>
```

### Commit types and when to use them

| Type       | Use for                                    | Triggers in CHANGELOG |
| ---------- | ------------------------------------------ | --------------------- |
| `feat`     | New user-facing feature                    | Yes — Features        |
| `fix`      | Bug fix                                    | Yes — Bug Fixes       |
| `perf`     | Performance improvement with no API change | Yes — Performance     |
| `refactor` | Internal restructure, no behavior change   | Yes — Refactoring     |
| `style`    | CSS/UI-only changes, no logic change       | Yes — Styling         |
| `test`     | Adding or updating tests                   | Yes — Testing         |
| `docs`     | Documentation only                         | Yes — Documentation   |
| `chore`    | Dependency bumps, config tweaks            | Skipped               |
| `ci`       | CI/CD workflow changes                     | Skipped               |

### Breaking changes

Append `!` after the type, or add `BREAKING CHANGE:` in the commit body:

```
feat!: rename lesson API response shape
```

Breaking changes always require a **major** version bump.

---

## Branch model

```
main        — integration branch; always deployable
```

All work merges directly into `main`. When `main` is stable and feature-complete for a milestone, a versioned tag is pushed to trigger a release.

**Stable backport branches** (e.g. `release/v1.0`) are created only when a patch fix must be shipped against an older release without pulling in newer `main` commits. This is rare.

---

## Deciding whether to make a release

Ask these questions before tagging a release:

1. **Are all intended features for this milestone merged into `main`?**
2. **Do all unit tests pass?** (`pnpm test`)
3. **Does type-checking pass?** (`pnpm check`)
4. **Does linting pass?** (`pnpm lint`)
5. **Has the change been tested end-to-end** (either manually or via `pnpm test:e2e`)?

If yes to all: it is appropriate to release.

**Do not release** for chore/ci-only changes, mid-feature work, or when tests are failing.

---

## Choosing the semver bump level

Use `pnpm run release:patch`, `pnpm run release:minor`, or `pnpm run release:major`.

| Situation                                       | Command                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Only `fix` or `perf` commits since last release | `release:patch` — e.g. `1.0.0` → `1.0.1`                                      |
| One or more `feat` commits, no breaking changes | `release:minor` — e.g. `1.0.0` → `1.1.0`                                      |
| Any `feat!` or `BREAKING CHANGE` commit         | `release:major` — e.g. `1.0.0` → `2.0.0`                                      |
| Mix of `feat` and `fix`, no breaking            | `release:minor`                                                               |
| Only `style`, `refactor`, `test`, `docs`        | `release:patch` at most — use judgement; these alone rarely warrant a release |

**Quick rule:** the highest-impact commit type since the last tag determines the bump level. Breaking > feat > fix/perf > everything else.

---

## Release workflow

```bash
# 1. Verify everything passes locally
pnpm test && pnpm check && pnpm lint

# 2. Tag and push (pick the right level)
pnpm run release:patch   # or release:minor / release:major
```

This runs `pnpm version <level>` which:

- Bumps `version` in `package.json`
- Creates a git commit `chore: release vX.Y.Z`
- Creates a git tag `vX.Y.Z`

Then pushes the commit and tag to `origin/main`.

### What CI does automatically on a `v*` tag

1. **Quality gate** (`.github/workflows/release.yml`):
   - Type-check, lint, unit tests must all pass
   - If any fail, the release is aborted — no Docker image, no GitHub Release
2. **GitHub Release** created with auto-generated changelog (git-cliff)
3. **Docker image** built and pushed to GHCR (`.github/workflows/docker-publish.yml`):
   - Tagged `vX.Y.Z`, `X.Y`, and `latest`
   - Multi-platform: `linux/amd64` + `linux/arm64`

### Generating a CHANGELOG locally

```bash
pnpm run changelog   # writes CHANGELOG.md from all tags
```

---

## For AI assistants

When helping with this project:

- Always write commits in conventional format (`feat:`, `fix:`, etc.)
- Never commit directly — stage changes and let the user review before committing
- When asked whether to release: check `git log <last-tag>..HEAD --oneline` to see what has accumulated, then apply the bump level table above
- When asked to release: run `pnpm test && pnpm check && pnpm lint` first; only proceed if all pass
- The release scripts handle tagging and pushing — do not manually create tags or push with `--follow-tags` outside of those scripts
- `pnpm version` creates a commit automatically; never amend it
