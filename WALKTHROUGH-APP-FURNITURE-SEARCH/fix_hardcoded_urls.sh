#!/bin/bash

# Script to fix all hardcoded URLs in frontend components
echo "🔧 Fixing hardcoded URLs in frontend components..."

# Define the old and new patterns
OLD_URL="https://designhub-74.preview.emergentagent.com"
NEW_URL="\${process.env.REACT_APP_BACKEND_URL || window.location.origin}"

# Find all JavaScript files with hardcoded URLs and replace them
find /app/frontend/src/components -name "*.js" -type f -exec grep -l "$OLD_URL" {} \; | while read file; do
    echo "Fixing URLs in: $file"
    
    # For direct string assignments
    sed -i "s|const backendUrl = \"$OLD_URL\"|const backendUrl = process.env.REACT_APP_BACKEND_URL \|\| window.location.origin|g" "$file"
    
    # For fetch calls
    sed -i "s|fetch(\`$OLD_URL|fetch(\`\${process.env.REACT_APP_BACKEND_URL \|\| window.location.origin}|g" "$file"
    sed -i "s|fetch('$OLD_URL|fetch(\`\${process.env.REACT_APP_BACKEND_URL \|\| window.location.origin}|g" "$file"
    
    # For other direct URL usage
    sed -i "s|$OLD_URL|\${process.env.REACT_APP_BACKEND_URL \|\| window.location.origin}|g" "$file"
done

echo "✅ All hardcoded URLs have been replaced with environment variables"
echo "🔍 Verifying no hardcoded URLs remain..."

# Check if any hardcoded URLs still exist
REMAINING=$(find /app/frontend/src/components -name "*.js" -type f -exec grep -l "$OLD_URL" {} \; | wc -l)

if [ "$REMAINING" -eq 0 ]; then
    echo "✅ SUCCESS: No hardcoded URLs found"
else
    echo "⚠️  WARNING: $REMAINING files still contain hardcoded URLs"
    find /app/frontend/src/components -name "*.js" -type f -exec grep -l "$OLD_URL" {} \;
fi