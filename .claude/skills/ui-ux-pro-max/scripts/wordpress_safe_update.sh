#!/bin/bash

# WordPress Safe Content Update Script
# Prevents encoding issues when updating WordPress post content
# Usage: ./wordpress_safe_update.sh <post_id> <html_file_path>

set -euo pipefail

# Configuration
DB_NAME="wordpress"
DB_USER="root"
TABLE_PREFIX="wp_"

# Check arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <post_id> <html_file_path>"
    echo "Example: $0 112 /tmp/article_content.html"
    exit 1
fi

POST_ID="$1"
HTML_FILE="$2"

# Verify file exists
if [ ! -f "$HTML_FILE" ]; then
    echo "Error: File not found: $HTML_FILE"
    exit 1
fi

# Verify file is readable
if [ ! -r "$HTML_FILE" ]; then
    echo "Error: File is not readable: $HTML_FILE"
    exit 1
fi

# Check file encoding
FILE_ENCODING=$(file -b --mime-encoding "$HTML_FILE")
if [[ ! "$FILE_ENCODING" =~ utf-8 ]]; then
    echo "Warning: File encoding is $FILE_ENCODING, expected utf-8"
    echo "Converting to UTF-8..."
    iconv -f UTF-8 -t UTF-8 "$HTML_FILE" > "${HTML_FILE}.utf8"
    mv "${HTML_FILE}.utf8" "$HTML_FILE"
fi

# Verify no literal escape sequences
if grep -q '\\n' "$HTML_FILE"; then
    echo "Error: File contains literal \\n escape sequences"
    echo "Please fix the file before updating WordPress"
    exit 1
fi

# Backup current content
echo "Backing up current content..."
sudo mysql "${DB_NAME}" --skip-column-names --raw \
    -e "SELECT post_content FROM ${TABLE_PREFIX}posts WHERE ID = ${POST_ID};" \
    > "/tmp/wp_post_${POST_ID}_backup_$(date +%Y%m%d_%H%M%S).html"

# Update post content
echo "Updating post ID ${POST_ID}..."
sudo mysql "${DB_NAME}" \
    -e "UPDATE ${TABLE_PREFIX}posts SET post_content = LOAD_FILE('${HTML_FILE}') WHERE ID = ${POST_ID};"

# Verify update
RESULT=$(sudo mysql "${DB_NAME}" --skip-column-names --raw \
    -e "SELECT post_content FROM ${TABLE_PREFIX}posts WHERE ID = ${POST_ID};" \
    | head -20)

if echo "$RESULT" | grep -q '<!DOCTYPE\|<section\|<div'; then
    echo "✓ Update successful!"
    echo "✓ Post ID ${POST_ID} has been updated"
    echo "✓ Content verified"
else
    echo "✗ Update may have failed - please verify manually"
    exit 1
fi

echo ""
echo "Verification preview:"
echo "$RESULT"
echo ""
echo "To view full content:"
echo "sudo mysql ${DB_NAME} --skip-column-names --raw -e \"SELECT post_content FROM ${TABLE_PREFIX}posts WHERE ID = ${POST_ID};\""
