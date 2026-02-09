```text
name: changelog
description: Use for writing, reviewing, editing, or generating Meteor release changelog entries. Defines canonical file locations, naming rules, required section structure, formatting conventions, PR-based generation workflow, and common entry patterns. Applies to files under v3-docs/docs/generators/changelog/versions/.
```

# Meteor Changelog Authoring Guide

Rules for creating, reviewing, and auto-generating Meteor release changelog entries.

## Canonical Source

All changelog source files live in:

```
v3-docs/docs/generators/changelog/versions/
```

These files are consumed by a generator that produces the public changelog.
Never edit generated output—only modify files in this directory.

Special file:
`99999-generated-code-warning.md` is the static header for the generated page. Do not alter its structure.

## File Naming Rules

* One file per release
* Filename format: `MAJOR.MINOR.PATCH.md`
* Do not prefix versions with `v`
* Do not add suffixes or metadata

Examples:

* `3.4.0.md`
* `3.1.1.md`
* ❌ `v3.0.0.md`
* ❌ `3.2.0-final.md`

## Required Entry Structure

Every changelog file must contain **all sections below**, in this exact order.
If a section has no content, use `N/A`.

````markdown
## v<VERSION>, <DATE>

### Highlights

- Description of change

#### Breaking Changes

N/A

#### Internal API changes

N/A

#### Migration Steps

Please run the following command to update your project:

```bash
meteor update --release <VERSION>
```

#### Bumped Meteor Packages

* package-name@version

#### Bumped NPM Packages

N/A

#### Special thanks to

N/A

````

## Formatting Rules

### Version Header

```markdown
## v3.4.0, 2025-01-30
````

* Prefix version with `v`
* Date format: `YYYY-MM-DD`
* Use comma + space as separator

### Highlights

* Use dash (`-`) bullets
* Each bullet describes a user-facing change
* Append PR links inline

Example:

```markdown
### Highlights

- Upgrade to Node v22, [PR#13997](https://github.com/meteor/meteor/pull/13997)
- Fix bulk remove in LocalCollection to remove all items, [PR#13965](https://github.com/meteor/meteor/pull/13965)
```

For major features, use nested bullets with emoji markers:

```markdown
- **Meteor-Rspack Integration**, [PR#13910](https://github.com/meteor/meteor/pull/13910)
  - ⚡ New `rspack` atmosphere package
  - 📦 New `@meteorjs/rspack` npm package
  - 📃 Documentation link
```

For feature-heavy releases, add this link **after** the Highlights list:

```markdown
All Merged PRs@[GitHub PRs 3.4](https://github.com/meteor/meteor/pulls?q=is%3Apr+is%3Amerged+base%3Arelease-3.4)
```

## Breaking Changes

If none:

```markdown
#### Breaking Changes

N/A
```

For package-specific breaks, wrap package names in backticks and list API changes.

## Migration Steps

Always start with:

```bash
meteor update --release <VERSION>
```

Add additional commands or documentation links as needed.

## Bumped Meteor Packages

* One package per line
* Format: `name@version`
* No backticks

## Bumped NPM Packages

Same format as Meteor packages. Use `N/A` if none.

## Special Thanks

Wrap contributor lists with sparkle lines:

```markdown
✨✨✨
- [@username](https://github.com/username)
✨✨✨
```

Use `N/A` if there are no external contributors.

## Review Checklist

* Filename matches `MAJOR.MINOR.PATCH.md`
* Header format is correct
* All required sections present and ordered
* Empty sections use `N/A`
* PR links and contributor links are correct
* Package lists use `name@version`
* No YAML frontmatter
