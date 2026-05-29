# 6.4 — .gitattributes

**Level:** Master  
**Goal:** Control line endings, diff behavior, merge strategies per file type

---

## What is .gitattributes?

A file committed to your repo that tells git how to handle specific files. It's the right way to configure line endings, diff drivers, and merge strategies.

---

## Line Endings (Most Common Use)

```gitattributes
# .gitattributes

# Normalize all text files to LF on commit
* text=auto

# Force specific files to LF (Unix) always
*.sh text eol=lf
*.py text eol=lf
Makefile text eol=lf

# Force CRLF (Windows) for certain files
*.bat text eol=crlf
*.cmd text eol=crlf

# Binary files — never touch line endings
*.png binary
*.jpg binary
*.pdf binary
*.zip binary
*.exe binary
*.dll binary
```

This solves the famous Windows/Mac/Linux line ending conflicts.

---

## Diff Drivers

```gitattributes
# Better diff for specific file types
*.md diff=markdown
*.ipynb diff=jupyternotebook

# Tell git how to diff binary formats
*.docx diff=word
*.pdf diff=pdf
```

Configure the word diff:
```bash
git config diff.word.textconv docx2txt
```

---

## Merge Strategies

```gitattributes
# Always use "ours" version for generated files (never merge them)
package-lock.json merge=ours
yarn.lock merge=ours

# Mark files as binary (never try to text merge)
*.png binary
*.min.js binary
```

---

## Export Ignore

Files to exclude when creating an archive:
```gitattributes
# These won't appear in git archive (GitHub "Download ZIP")
.gitignore export-ignore
.gitattributes export-ignore
.github/ export-ignore
tests/ export-ignore
docs/internal/ export-ignore
```

---

## Linguist (GitHub Language Detection)

```gitattributes
# Don't count generated files in language stats
*.min.js linguist-generated=true
dist/ linguist-generated=true
vendor/ linguist-vendored=true

# Override language detection
*.tsx linguist-language=TypeScript
```

---

## Recommended .gitattributes for Most Projects

```gitattributes
# Auto-detect text files, normalize line endings
* text=auto eol=lf

# Force LF for scripts
*.sh text eol=lf
*.bash text eol=lf

# Force CRLF for Windows-specific
*.bat text eol=crlf

# Binary files
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.svg binary
*.pdf binary
*.zip binary
*.tar.gz binary
*.woff binary
*.woff2 binary

# Lock files — never merge, just take ours
package-lock.json merge=ours
yarn.lock merge=ours

# Generated files don't count toward language stats
dist/ linguist-generated=true
*.min.js linguist-generated=true

# Archive exclusions
.gitignore export-ignore
.gitattributes export-ignore
.github/ export-ignore
.gitlab/ export-ignore
```
