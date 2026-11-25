---
name: code-review
description: Checklist to review a small code change. Use it when reviewing uncommitted changes or the result of a task, before it is accepted or committed.
---

# Code review

## Goal

Decide whether a small change does what was asked without breaking anything else.

## When to use it

- Reviewing the uncommitted changes of the project.
- Checking the work of another agent before reporting it as done.

## Procedure

1. **Request.** Does the change do everything that was asked, and nothing else?
2. **Scope.** Are there changed files or lines that the request does not need?
3. **Correctness.** Follow the main path and one edge case (empty value, wrong type, missing element). Would it fail?
4. **Existing behaviour.** Does anything that worked before stop working?
5. **Readability.** Clear names, short functions, no dead or commented-out code, no leftover debug logs.
6. **Dependencies.** No new library, CDN or build step unless the request asks for it.
7. **Secrets.** No keys, tokens or personal data in the code.

Prefer small, concrete corrections. Do not ask for large refactors.

## Expected result

`PASS` if no step finds a problem. Otherwise `CHANGES_REQUIRED` with one line per problem: file, line, what is wrong and what is expected.
