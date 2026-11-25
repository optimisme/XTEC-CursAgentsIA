---
description: Review the current uncommitted changes with the code_reviewer agent.
agent: code_reviewer
subagent: true
---

Review the uncommitted changes in this project. $ARGUMENTS

Changed files:

!`git status --short --untracked-files=all`

Diff:

!`git diff HEAD`
