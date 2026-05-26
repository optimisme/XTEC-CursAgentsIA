---
description: List PNG files as a tree
agent: explorer
---

List only the `.png` files in the current project folder using a tree-style format. Don't show extra information, just the list of files.


Run this command:

```bash
find . -type f -iname "*.png" | sort | sed 's#^\./##'
```
