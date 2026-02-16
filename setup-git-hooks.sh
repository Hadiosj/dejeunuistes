#!/bin/bash

# Script to set up git hooks for automatic test running

echo "🔧 Setting up git hooks..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
  echo "❌ Not a git repository. Run 'git init' first."
  exit 1
fi

# Copy pre-push hook
cp .githooks/pre-push .git/hooks/pre-push

# Make it executable
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully!"
echo ""
echo "Your tests will now run automatically before every git push."
echo "To skip tests for a specific push, use: git push --no-verify"
