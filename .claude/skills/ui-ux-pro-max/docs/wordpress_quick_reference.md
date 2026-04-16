# WordPress Content Update - Quick Reference

## Emergency Fix (If Escape Sequences Appear)

```bash
# 1. Export current content
sudo mysql wordpress --skip-column-names --raw \
  -e "SELECT post_content FROM wp_posts WHERE ID = <POST_ID>;" \
  > /tmp/post_export.html

# 2. Clean the file (remove literal \n)
sed -i 's/\\n/\n/g' /tmp/post_export.html

# 3. Update with LOAD_FILE()
sudo mysql wordpress \
  -e "UPDATE wp_posts SET post_content = LOAD_FILE('/tmp/post_export.html') WHERE ID = <POST_ID>;"

# 4. Verify
/tmp/encoding_test.sh
```

## Standard Update Procedure (Safe Method)

```bash
# 1. Create HTML file with proper newlines
cat > /tmp/new_content.html << 'EOF'
<div class="content">
    <h1>Your Content</h1>
    <p>Use actual newlines, not \n escape sequences</p>
</div>
EOF

# 2. Use safe update script
/home/uroma/.claude/skills/ui-ux-pro-max/scripts/wordpress_safe_update.sh <POST_ID> /tmp/new_content.html

# 3. Verify success
sudo mysql wordpress --skip-column-names --raw \
  -e "SELECT post_content FROM wp_posts WHERE ID = <POST_ID>;" \
  | head -20
```

## Quick Verification

```bash
# Check for escape sequences (should return 0)
sudo mysql wordpress --skip-column-names --raw \
  -e "SELECT post_content FROM wp_posts WHERE ID = <POST_ID>;" \
  | grep -c '\\n'

# Or run full test suite
/tmp/encoding_test.sh
```

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Literal `\n` visible | Content shows `\n` instead of line breaks | Use LOAD_FILE() method |
| Content corrupted | Characters display incorrectly | Check UTF-8 encoding |
| Update failed | Content not changed | Check file permissions |
| Double-escaped | Shows `\\n` or `\\\\n` | Clean with sed: `sed 's/\\\\n/\n/g'` |

## Key Files

- **Safe Update Script**: `/home/uroma/.claude/skills/ui-ux-pro-max/scripts/wordpress_safe_update.sh`
- **Test Suite**: `/tmp/encoding_test.sh`
- **Full Guide**: `/home/uroma/.claude/skills/ui-ux-pro-max/docs/wordpress_encoding_fix_guide.md`

## Database Info

```
Database: wordpress
Table: wp_posts
Charset: utf8mb4
Post ID: 112 (Superpowers Article)
```

## Golden Rules

1. ✅ **Always** use LOAD_FILE() for HTML content
2. ✅ **Never** use PHP string escaping for content
3. ✅ **Always** verify updates with test suite
4. ✅ **Always** create backups before updates
5. ❌ **Never** create HTML files with literal `\n`

## Emergency Contact

If issues persist:
1. Check the full guide: `docs/wordpress_encoding_fix_guide.md`
2. Run test suite: `/tmp/encoding_test.sh`
3. Verify encoding: `file -b --mime-encoding <file>`
4. Use safe update script for all changes

---
**Quick Reference v1.0** - Last Updated: 2026-01-18
