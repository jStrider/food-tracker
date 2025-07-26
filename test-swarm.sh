#!/bin/bash

# Clear screen first
clear

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Agent directories and their roles
declare -A AGENTS=(
  ["frontend"]="Frontend Agent"
  ["backend"]="Backend Agent"
  ["shared"]="Shared Types Agent"
  ["infra"]="Infrastructure Agent"
  ["tests"]="Testing Agent"
  ["root"]="Tech Lead Agent"
)

# Function to format timestamp
format_time() {
  date -r "$1" "+%H:%M:%S"
}

# Function to check if file was recently modified (within last 5 seconds)
is_recent() {
  local file_time=$1
  local current_time=$(date +%s)
  local diff=$((current_time - file_time))
  [ $diff -le 5 ]
}

# Main monitoring loop
while true; do
  clear
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║           🤖 CLAUDE SWARM PARALLEL AGENTS MONITOR 🤖           ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo
  printf "⏰ %s - Press Ctrl+C to exit\n" "$(date '+%Y-%m-%d %H:%M:%S')"
  echo -e "${CYAN}═════════════════════════════════════════════════════════════════${NC}"
  echo

  # Track active agents
  ACTIVE_COUNT=0
  
  # Sort directories for consistent display
  for DIR in frontend backend shared infra tests root; do
    AGENT_NAME="${AGENTS[$DIR]}"
    
    if [ "$DIR" = "root" ]; then
      ACTUAL_DIR="."
      DISPLAY_DIR="root"
    else
      ACTUAL_DIR="$DIR"
      DISPLAY_DIR="$DIR"
    fi
    
    # Header for each agent
    echo -e "${BLUE}┌─ ${AGENT_NAME} [$DISPLAY_DIR]${NC}"
    
    if [ -d "$ACTUAL_DIR" ]; then
      # Check for agent status markers (proper swarm detection)
      AGENT_LOG="$ACTUAL_DIR/.claude_agent.log"
      AGENT_PID="$ACTUAL_DIR/.claude_agent.pid"
      HEARTBEAT="$ACTUAL_DIR/.claude_heartbeat"
      
      # Check if agent process is running
      if [ -f "$AGENT_PID" ]; then
        PID=$(cat "$AGENT_PID" 2>/dev/null)
        if ps -p "$PID" > /dev/null 2>&1; then
          ACTIVE_COUNT=$((ACTIVE_COUNT + 1))
          echo -e "│  ${GREEN}● ACTIVE${NC} - Agent running (PID: $PID)"
          
          # Show last agent action
          if [ -f "$AGENT_LOG" ]; then
            LAST_ACTION=$(tail -1 "$AGENT_LOG" 2>/dev/null)
            echo -e "│  Last action: $LAST_ACTION"
          fi
        else
          echo -e "│  ${RED}✗ CRASHED${NC} - PID file exists but process dead"
        fi
      else
        # Fallback: Check for recent file activity (basic detection)
        TMPFILE="/tmp/swarm_monitor_ref_$$"
        touch -t $(date -v-30S "+%Y%m%d%H%M.%S") "$TMPFILE" 2>/dev/null
        RECENT_FILES=$(find "$ACTUAL_DIR" -type f -newer "$TMPFILE" 2>/dev/null | grep -v "node_modules" | grep -v ".git" | head -3)
        rm -f "$TMPFILE"
        
        if [ -n "$RECENT_FILES" ]; then
          echo -e "│  ${YELLOW}◐ POSSIBLE ACTIVITY${NC} - File changes detected"
          echo "│  Recent changes:"
          echo "$RECENT_FILES" | while read -r file; do
            if [ -n "$file" ]; then
              REL_PATH=${file#./}
              echo -e "│    ${YELLOW}↻${NC} $REL_PATH"
            fi
          done
        else
          echo -e "│  ${YELLOW}○ IDLE${NC} - No activity detected"
        fi
      fi
      
      # Check for heartbeat (agent communication)
      if [ -f "$HEARTBEAT" ]; then
        LAST_BEAT=$(stat -f "%m" "$HEARTBEAT" 2>/dev/null)
        CURRENT=$(date +%s)
        if [ -n "$LAST_BEAT" ] && [ $((CURRENT - LAST_BEAT)) -lt 60 ]; then
          echo -e "│  ${GREEN}💓${NC} Heartbeat: $(format_time "$LAST_BEAT")"
        else
          echo -e "│  ${RED}💔${NC} Heartbeat: Stale"
        fi
      fi
      
      # Show status file if exists
      if [ -f "$ACTUAL_DIR/status.txt" ]; then
        STATUS=$(tail -1 "$ACTUAL_DIR/status.txt" 2>/dev/null)
        echo -e "│  Status: $STATUS"
      fi
      
      # File count (excluding node_modules and .git)
      FILE_COUNT=$(find "$ACTUAL_DIR" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l | xargs)
      echo "│  Total files: $FILE_COUNT"
      
    else
      echo -e "│  ${RED}✗ MISSING${NC} - Directory not found"
    fi
    
    echo "└───────────────────────────────────────"
    echo
  done
  
  # Summary
  echo -e "${CYAN}═════════════════════════════════════════════════════════════════${NC}"
  echo -e "📊 Summary: ${GREEN}$ACTIVE_COUNT${NC} active agents out of ${#AGENTS[@]} total"
  
  # Show parallel indicator
  if [ $ACTIVE_COUNT -gt 1 ]; then
    echo -e "⚡ ${GREEN}PARALLEL EXECUTION DETECTED!${NC} Multiple agents working simultaneously"
  elif [ $ACTIVE_COUNT -eq 1 ]; then
    echo -e "🔄 Single agent active"
  else
    echo -e "💤 All agents idle"
  fi
  
  # Refresh every 2 seconds
  sleep 2
done