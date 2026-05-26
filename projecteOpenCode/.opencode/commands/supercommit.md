---
description: Group repository changes into semantic commits and push them safely
---

You are preparing a clean Git commit sequence for the current repository.

Optional user context:
$ARGUMENTS

## Goal

Inspect all current repository changes, group them into meaningful semantic commits, and push them to the current remote branch.

## Steps

1. Inspect the repository state:

```bash
git status
git diff
git diff --staged
git log --oneline -10
````

2. Review all modified, added, deleted, renamed, and untracked files.

3. Before committing, check carefully that no sensitive data is included:

   * API keys
   * passwords
   * tokens
   * private certificates
   * `.env` files
   * credentials
   * personal data
   * temporary debug output

4. If sensitive data is found, stop and explain what must be removed.

5. Group changes into small, coherent commits.

6. Use clear semantic commit messages, such as:

```text
feat: add user authentication flow
fix: correct dashboard layout overflow
docs: update setup instructions
refactor: simplify data loading logic
test: add coverage for repository parser
chore: update project configuration
```

7. For each group:

   * stage only the related files or hunks;
   * create one commit with a clear message;
   * avoid mixing unrelated changes.

8. After all commits are created, run:

```bash
git status
```

9. If the working tree is clean, push to the current upstream branch:

```bash
git push
```

10. If there is no upstream branch, suggest the correct push command instead of guessing.

## Rules

* Do not rewrite Git history.
* Do not amend existing commits unless explicitly requested.
* Do not force push.
* Do not commit generated files unless they are clearly required by the project.
* Do not commit dependency folders such as `node_modules`.
* Do not commit build artifacts unless the project intentionally tracks them.
* Prefer several small commits over one large commit.
* If the changes are unclear, explain the proposed commit plan before committing.
* If tests are available and quick to run, suggest running them before pushing.