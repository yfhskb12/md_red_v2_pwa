# Recommended branch strategy

Use a normal branch if you want to verify changes and later merge into `main`.

Recommended branch name:
- `test/pwa-pages-fix`

Why not an orphan branch:
- it is clean, but awkward to compare and merge back into `main`
- good for a throwaway publish-only sandbox, bad for a normal review -> merge flow

If you still want a totally sterile sandbox, use:
- `sandbox/pwa-orphan-test`

# Mobile-friendly flow

1. Create a new branch from current `main`:
   - `test/pwa-pages-fix`
2. Upload the FULL contents of this archive into that branch, replacing repo contents.
3. Commit the branch.
4. Let GitHub Actions deploy.
5. Open the GitHub Pages URL in normal Chrome first.
6. Remove the old installed PWA.
7. Clear site data for `yfhskb12.github.io`.
8. Install the PWA again.
9. Test:
   - open site
   - install PWA
   - open local markdown file
   - edit
   - save
   - reopen offline after first online visit

# Commit message

`fix: repair local save flow and GitHub Pages PWA assets`
