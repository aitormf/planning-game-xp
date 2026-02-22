#!/bin/bash
# Pipeline reminder hook for Claude Code
# Detects git/deploy operations and reminds to update pipelineStatus in Planning Game

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Skip if no command (non-Bash tool or empty)
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Detect: gh pr create → remind to update pipelineStatus.prCreated
if echo "$COMMAND" | grep -qE "gh pr create"; then
  echo "PIPELINE REMINDER: You just created a PR. Update the card's pipelineStatus.prCreated with: { date, prUrl, prNumber } using update_card in the Planning Game MCP."
  exit 0
fi

# Detect: gh pr merge → remind to update pipelineStatus.merged
if echo "$COMMAND" | grep -qE "gh pr merge"; then
  echo "PIPELINE REMINDER: You just merged a PR. Update the card's pipelineStatus.merged with: { date, mergedBy } using update_card in the Planning Game MCP."
  exit 0
fi

# Detect: git merge → remind about pipelineStatus.merged
if echo "$COMMAND" | grep -qE "git merge"; then
  echo "PIPELINE REMINDER: You just performed a git merge. If this merges a PR branch, update the card's pipelineStatus.merged with: { date, mergedBy } using update_card."
  exit 0
fi

# Detect: firebase deploy / npm run deploy → remind about pipelineStatus.deployed
if echo "$COMMAND" | grep -qE "(firebase deploy|npm run deploy)"; then
  echo "PIPELINE REMINDER: You just deployed. Update the card's pipelineStatus.deployed with: { date, environment } using update_card in the Planning Game MCP."
  exit 0
fi

# No matching command → no output, no reminder
exit 0
