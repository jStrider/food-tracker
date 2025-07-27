# Claude-Flow Memory Documentation

## Overview
The memory directories store agent-specific and session-based data for the Claude-Flow orchestration system.

## Structure

### Agent Memory (`/memory/agents/`)
Stores agent-specific memory data, configurations, and persistent state:
- `agent_XXX/` - Individual agent directories
  - `state.json` - Agent state and configuration
  - `knowledge.md` - Agent-specific knowledge base
  - `tasks.json` - Completed and active tasks
  - `calibration.json` - Agent-specific calibrations
- `shared/` - Cross-agent information

### Session Memory (`/memory/sessions/`)
Stores session-based memory data and conversation history:
- `YYYY-MM-DD/session_XXX/` - Session directories by date
  - `metadata.json` - Session metadata
  - `conversation.md` - Full conversation history
  - `decisions.md` - Key decisions made
  - `artifacts/` - Generated files
  - `coordination_state/` - System snapshots

## Usage Guidelines
- Maintain agent and session isolation
- Document all significant interactions
- Preserve state regularly
- Clean up terminated agent directories periodically

Last updated: 2025-01-27