#!/bin/bash

echo "=== Claude Swarm Status Report ==="
echo

# Liste manuelle des répertoires agents (à adapter si besoin)
AGENT_DIRS=(
  "./frontend"
  "./backend"
  "./infra"
  "./tests"
  "."  # Pour tech_lead
)

for DIR in "${AGENT_DIRS[@]}"; do
  NAME=$(basename "$DIR")
  echo "🔹 Agent: $NAME"
  if [ -d "$DIR" ]; then
    COUNT=$(find "$DIR" -type f | wc -l)
    echo "  - Files: $COUNT"
    echo "  - Last 5 modified:"
    find "$DIR" -type f -exec stat -f "%m %N" {} \; | sort -rn | head -5 | cut -d' ' -f2-
    if [ -f "$DIR/status.txt" ]; then
      echo "  - Status: $(cat "$DIR/status.txt")"
    else
      echo "  - Status: ❌ No status.txt"
    fi
  else
    echo "  - ⚠️ Directory missing"
  fi
  echo
done


echo "=== End of report ==="