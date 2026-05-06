# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues at **`oppr-sandbox/oppr-docs-2026H2`** (https://github.com/oppr-sandbox/oppr-docs-2026H2). Use the `gh` CLI for all operations.

> Note: this working directory is **not** a clone of that repo, so `gh` cannot infer the target. Pass `--repo oppr-sandbox/oppr-docs-2026H2` explicitly on every command.

## Conventions

- **Create an issue**: `gh issue create --repo oppr-sandbox/oppr-docs-2026H2 --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --repo oppr-sandbox/oppr-docs-2026H2 --comments`.
- **List issues**: `gh issue list --repo oppr-sandbox/oppr-docs-2026H2 --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --repo oppr-sandbox/oppr-docs-2026H2 --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --repo oppr-sandbox/oppr-docs-2026H2 --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --repo oppr-sandbox/oppr-docs-2026H2 --comment "..."`

## When a skill says "publish to the issue tracker"

Create a GitHub issue in `oppr-sandbox/oppr-docs-2026H2`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --repo oppr-sandbox/oppr-docs-2026H2 --comments`.
