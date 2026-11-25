---
description: Commit the current changes with a message that follows the commit-message skill.
---

Commit the current changes. $ARGUMENTS

1. Load the `commit-message` skill and follow it.
2. Write the commit message and show it to me before committing.
3. Stage the changes with `git add -A` and make the commit. Do not push.

Changed files:

!`git status --short --untracked-files=all`

Diff:

!`git diff HEAD`
