# ESTABLISHED Design Co. - PRD

## Core Architecture
- Frontend: React (CRA) port 3000 | Backend: FastAPI port 8001 | DB: MongoDB
- Config: Runtime `config.js` → `window.ENV.REACT_APP_BACKEND_URL`

## Implemented (Feb 10-11, 2026)
- **To-Do "Done" fix**: Optimistic UI update (instant visual feedback), added missing "In Progress" dropdown option, fixed GlobalToDoModal wrong API endpoint (`/todos/${projectId}/${todoId}` → `/todos/${todoId}`)
- Multi-room bulk delete with one confirm prompt
- No per-room delete prompts
- Fixed "Project Not Found" (hardcoded URL + window.ENV overwrite)
- Fixed duplicate bottom nav bar
- Fixed transfers (Walkthrough→Checklist, Checklist→FFE)
- Removed misplaced search bar
- Photo management verified

## Login: DesignReady2026!
