# Interior Design Management System - PRD

## Original Problem Statement
Full-stack interior design project management application with multiple spreadsheets (FFE, Checklist, Walkthrough), task management (To-Do, Punch List, Company Tasks), and Microsoft Teams integration.

## Latest Session (January 12, 2026)

### Issues Fixed
1. **Checklist Text Color Fix** - Fixed unreadable text on highlighted rows in the Checklist spreadsheet:
   - Added inline `style={{ color: textColor }}` to all text elements in item rows
   - Highlighted rows now show BLACK text (#000000) instead of default gold (#B49B7E)
   - Applied to: Item name, Vendor, SKU, Qty, Size, Finish/Color, Cost, Remarks columns
   - Uses inline styles to override CSS classes

2. **Highlight Auto-Refresh** - Added 10-second polling interval to update highlights when tasks are completed:
   - `loadLinkedItems()` now runs every 10 seconds via `setInterval`
   - When a To-Do or Punch List item is marked complete, the Checklist highlight disappears automatically
   - Proper cleanup on component unmount

3. **Verified PASTE Column Intact** - Confirmed the 📋 PASTE button exists in the action column:
   - Button shows green (animate-pulse) when scraper data is available
   - Button shows gray/disabled when no data to paste
   - All 113 test items have the PASTE button visible

### Files Modified
- `/app/frontend/src/components/ExactChecklistSpreadsheet.js`
  - Lines 2326-2328: Added `textColor`, `cellStyle`, `inputStyle` variables
  - Lines 549-553: Added 10-second polling interval for linked items
  - Multiple cells updated with `style={cellStyle}` and `style={{ color: textColor }}`

---

## Previous Session (January 11, 2026)

### Issues Fixed
1. **Company To-Do endpoint route ordering** - `/todos/company` routes were being captured by `/todos/{project_id}` parameter route. Fixed by moving company routes BEFORE parameterized routes in server.py.

2. **Medium priority color** - Changed from yellow (`bg-yellow-600`) to cyan (`bg-cyan-600`) to differentiate from "Modern Kitchen" room color.

3. **ToDoList interface** - Rebuilt to match PunchList interface exactly:
   - Filter tabs (All, PENDING, IN PROGRESS, COMPLETED)
   - Status toggle button with icons
   - FFE/Checklist item linking dropdown
   - Deadline date picker
   - Description field
   - Assigned to field
   - Priority dropdown

4. **Company To-Do (MasterToDoList)** - Rebuilt to match PunchList interface:
   - Section tabs (All Tasks, Company Tasks, Project Tasks)
   - Filter tabs (All, PENDING, IN PROGRESS, COMPLETED)
   - "+ Add Company Task" form with deadline
   - Status toggle cycling
   - Priority badges

5. **Deadline field added** to all 3 lists:
   - To-Do List: `deadline` field
   - Punch List: `due_date` field (already existed)
   - Company To-Do: `deadline` field

6. **Teams Webhook separation**:
   - Project To-Do & Punch List → Design Den webhook (existing `TEAMS_WEBHOOK_URL`)
   - Company To-Do → NEW Company webhook (`COMPANY_TEAMS_WEBHOOK_URL`)

7. **FFE Spreadsheet highlighting** - Updated to:
   - Load both Punch List AND To-Do linked items
   - Sort linked items to TOP of their category
   - Use bright "highlighter" colors (yellow, green, pink, blue, orange, plum)
   - Show badges: "PUNCH" (red), "TO-DO" (blue), "✓ DONE" (green)

### Files Modified
- `/app/backend/server.py` - Route ordering fix, deadline fields, Teams webhook
- `/app/backend/teams_integration.py` - Added `notify_company_todo()` function with separate webhook
- `/app/backend/.env` - Added `COMPANY_TEAMS_WEBHOOK_URL`
- `/app/frontend/src/components/ToDoList.js` - Complete rebuild to match PunchList
- `/app/frontend/src/components/PunchList.js` - Added deadline field, changed medium priority to cyan
- `/app/frontend/src/components/MasterToDoList.js` - Rebuilt Company section to match PunchList
- `/app/frontend/src/components/ExactFFESpreadsheet.js` - Added To-Do linked items, bright highlighting, sorting

### Testing Status
- **Backend**: 15/15 tests passed (100%)
- **Frontend**: All UI elements verified
- Test file: `/app/tests/test_todo_punchlist_features.py`

## Architecture

### Backend (FastAPI + MongoDB)
- Port: 8001
- Database: interior_design_db
- Collections: projects, rooms, todos, company_todos, punch_list, master_contacts, etc.

### Frontend (React)
- Port: 3000
- Components in `/app/frontend/src/components/`
- UI library: Shadcn/UI + Tailwind CSS

### Key API Endpoints
- `GET/POST/PUT/DELETE /api/todos/company` - Company tasks (MUST be before `/todos/{project_id}`)
- `GET/POST /api/todos/{project_id}` - Project tasks
- `GET/POST/PATCH/DELETE /api/punch-list` - Punch list items
- `GET /api/projects/{id}?sheet_type=ffe|checklist|walkthrough` - Project data

### Environment Variables
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `TEAMS_WEBHOOK_URL` - Design Den webhook for projects
- `COMPANY_TEAMS_WEBHOOK_URL` - Company tasks webhook

## Priority Colors
- Low: `bg-gray-600`
- Medium: `bg-cyan-600` (NOT yellow)
- High: `bg-orange-600`
- Urgent: `bg-red-600`

## Backlog / Future Tasks
1. iPad Portrait/Landscape View for spreadsheets
2. Android mobile app
3. Google Drive Backup feature
4. Client Approval Portal
5. Backend refactoring (modular API routers)
6. Root cause investigation for recurring data loss

## Known Issues
- Chrome Scraper - Fixed missing `/api/scraper/save` endpoint that was causing HTTP 404
- Recurring data loss - Root cause not yet identified
