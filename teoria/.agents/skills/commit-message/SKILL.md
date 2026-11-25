---
name: commit-message
description: Format of the commit messages of this project. Use it when writing a commit message or making a commit.
---

# Commit message

## Goal

Commit messages that say what changed and why, all with the same format.

## When to use it

- Before every `git commit`.

## Procedure

1. Look at what will be committed: `git status --short` and `git diff HEAD`.
2. Write the first line as `<type>: <summary>`:
   - `type` is one of `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
   - `summary` is in English, imperative, lower case, without a final period and at most 60 characters.
3. If the reason is not obvious, add a blank line and one or two lines explaining why.
4. One commit, one change. If the diff mixes unrelated changes, propose separate commits.
5. Never commit `.secrets/`, `keys.env`, `*.env` or `node_modules/`.

## Expected result

```text
feat: add analog clock page

Draws the clock on a canvas and updates it every second.
```
