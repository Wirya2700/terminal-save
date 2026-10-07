# terminal-save

> **A simple terminal that remembers your work.**

You are building **terminal-save**, a lightweight Windows-first desktop terminal application.

The product should feel like:

**Notepad++ + PowerShell + persistent workspace + notes**

The core promise is:

> Close terminal-save today. Restart Windows tomorrow. Open terminal-save again and your documents, working directories, command history, notes, and layout are still there.

---

# 1. IMPORTANT DEVELOPMENT RULES

Read this entire document before writing code.

## Work incrementally

Build ONLY one phase at a time.

After every phase:

1. Run the application.
2. Run TypeScript/type checks.
3. Run the production build.
4. Test the implemented functionality.
5. Fix all errors found.
6. Verify there are no obvious console/runtime errors.
7. Report what changed.
8. STOP.
9. Wait for my confirmation before starting the next phase.

Never continue automatically to the next phase.

## Never leave the project broken

If a command fails:

- Diagnose the root cause.
- Fix it.
- Re-run the failed command.
- Continue only after it passes.

Do not say:

> "This can be fixed later."

The current phase must finish in a working state.

---

# 2. PRODUCT SCOPE

The MVP is intentionally small.

Build ONLY:

- Real PowerShell terminal
- Persistent terminal documents
- Persistent CWD
- Persistent command history
- `Arrow+Up` / `Arrow+Down` history navigation
- Notes per document
- Persistent layout
- Hide/show Document List
- Hide/show Notes
- Three simple layouts
- SQLite persistence
- Light theme
- Windows-first desktop UX

Do NOT build:

- Tab groups
- Cloud synchronization
- Authentication
- User accounts
- AI assistant
- Remote SSH manager
- Team collaboration
- Plugin marketplace
- Subscription
- Telemetry
- Cloud database
- Complex settings
- Redux
- React unless absolutely necessary

Keep the application local-first.

---

# 3. CORE UX

The application has three areas:

```text
Document List → Terminal → Notes
```

Example:

```text
┌──────────────────────────────────────────────────────────────┐
│ terminal-save                         Layout   Documents Notes│
├──────────────┬───────────────────────────────┬───────────────┤
│              │                               │               │
│ Documents    │          Terminal             │     Notes     │
│              │                               │               │
│ + New        │    PS C:\Projects\Api>       │ API Project   │
│              │                               │               │
│ ● API        │    dotnet run                │ TODO:         │
│   Backend    │    Building...               │ □ Fix API     │
│              │                               │ □ Add tests   │
│ ○ Frontend   │    PS C:\Projects\Api>       │               │
│              │                               │               │
└──────────────┴───────────────────────────────┴───────────────┘
```

The UI should be inspired by:

- Notepad++
- VS Code Light
- Windows Terminal
- Modern lightweight developer tools

Do not copy their UI exactly.

---

# 4. THREE LAYOUTS

Implement exactly three layout presets.

### Standard

```text
Document List | Terminal | Notes
```

### Focus Terminal

```text
Terminal
```

### Terminal + Notes

```text
Terminal | Notes
```

Persist the selected layout in SQLite.

On restart, restore the last selected layout.

Also provide independent controls:

```text
Show/Hide Document List
Show/Hide Notes
```

Do not create a complex drag-and-drop layout system.

---

# 5. VISUAL DESIGN

## LIGHT THEME ONLY

The MVP must use a light theme.

Do NOT implement dark mode.

Use a clean developer-tool aesthetic:

- White panels
- Light gray application background
- Thin borders
- Small subtle shadows
- Blue accent
- Compact controls
- Minimal decoration
- No gradients
- No excessive rounded cards
- No dashboard-style design

### Application colors

```text
Background:       #F7F8FA
Panel:            #FFFFFF
Border:           #E2E8F0
Primary Text:     #1F2937
Secondary Text:   #64748B
Muted Text:       #94A3B8
Accent:           #2563EB
Active:           #EFF6FF
Hover:            #F1F5F9
```

### Terminal colors

The terminal is also light.

```text
Background:       #FFFFFF
Text:             #1F2937
Prompt:           #2563EB
Path:             #0891B2
Success:          #16A34A
Warning:          #CA8A04
Error:            #DC2626
Selection:        #BFDBFE
```

Define the colors as CSS custom properties.

Use the same design tokens throughout the application.

---

# 6. TECHNOLOGY

Use:

```text
Electron
TypeScript
electron-vite
Vite
@xterm/xterm
@xterm/addon-fit
node-pty
better-sqlite3
plain CSS
```

Prefer Vanilla TypeScript.

Do NOT add React, Vue, Redux, Zustand, or another framework unless there is a demonstrated technical reason.

Keep dependencies minimal.

---

# 7. DEPENDENCY POLICY

The following versions are the initial target:

```text
Electron             44.4.3
electron-vite         5.0.0
electron-builder     26.15.3
@electron/rebuild     4.2.0
TypeScript             7.0.2
Vite                   7.3.6
@xterm/xterm           6.0.0
@xterm/addon-fit       0.11.0
node-pty               1.1.0
better-sqlite3         13.0.3
```

Pin versions exactly for the initial build.

However:

## IMPORTANT

Do NOT blindly force incompatible dependencies.

Before installation:

1. Inspect package peer dependencies.
2. Create the package configuration.
3. Run `npm install`.
4. If npm reports `ERESOLVE`, diagnose the actual conflict.
5. Do not use `--force` or `--legacy-peer-deps` merely to hide the problem.
6. Fix the dependency versions/configuration properly.
7. Re-run `npm install`.
8. Verify the final dependency tree.

The project is considered valid only when:

```text
npm install
```

finishes successfully without dependency-resolution errors.

---

# 8. NATIVE MODULES

`node-pty` and `better-sqlite3` are native modules.

Electron uses its own Node ABI.

After dependencies are installed, rebuild native modules for the Electron version.

Use the appropriate `@electron/rebuild` workflow.

Verify:

```text
node-pty
better-sqlite3
```

actually load from the Electron process.

Do not assume installation succeeded merely because npm finished.

The application must actually launch successfully.

---

# 9. ELECTRON ARCHITECTURE

Use:

```text
Main Process
Preload
Renderer
```

Security:

```text
contextIsolation: true
nodeIntegration: false
sandbox: true where compatible
```

Renderer must NOT directly access:

```text
fs
child_process
better-sqlite3
node-pty
```

Expose only the required APIs through `contextBridge`.

---

# 10. ARCHITECTURE

Use this separation:

```text
Electron Main
│
├── Database
│
├── Document Repository
│
├── Notes Repository
│
├── Command History Repository
│
├── PTY Manager
│
├── Shell Detector
│
└── IPC Handlers
        │
        ▼
     Preload
        │
        ▼
    Renderer
        │
        ├── Document List
        ├── Terminal
        ├── Notes
        ├── Toolbar
        └── Layout State
```

The renderer handles UI state.

The main process owns:

- Database
- PTY processes
- File-system-level operations
- privileged operations

---

# 11. PROJECT STRUCTURE

Use the electron-vite convention.

```text
terminal-save/
│
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
├── CLAUDE.md
│
├── src/
│   │
│   ├── main/
│   │   ├── index.ts
│   │   │
│   │   ├── ipc/
│   │   │   ├── documents.ts
│   │   │   ├── terminal.ts
│   │   │   ├── history.ts
│   │   │   ├── notes.ts
│   │   │   └── settings.ts
│   │   │
│   │   ├── terminal/
│   │   │   ├── PtyManager.ts
│   │   │   ├── ShellDetector.ts
│   │   │   └── CwdTracker.ts
│   │   │
│   │   └── database/
│   │       ├── Database.ts
│   │       ├── migrations/
│   │       │   └── 001_initial.sql
│   │       │
│   │       └── repositories/
│   │           ├── DocumentsRepository.ts
│   │           ├── NotesRepository.ts
│   │           ├── CommandHistoryRepository.ts
│   │           └── SettingsRepository.ts
│   │
│   ├── preload/
│   │   └── index.ts
│   │
│   ├── renderer/
│   │   ├── index.html
│   │   ├── app.ts
│   │   │
│   │   ├── components/
│   │   │   ├── Toolbar.ts
│   │   │   ├── DocumentList.ts
│   │   │   ├── TerminalView.ts
│   │   │   ├── NotesPanel.ts
│   │   │   └── LayoutManager.ts
│   │   │
│   │   ├── store/
│   │   │   └── AppStore.ts
│   │   │
│   │   └── styles/
│   │       ├── theme.css
│   │       └── layout.css
│   │
│   └── shared/
│       ├── types/
│       └── constants/
│
└── resources/
```

Do not create huge files.

---

# 12. DATABASE

Use:

```text
SQLite
better-sqlite3
```

Database location:

```text
app.getPath('userData')/terminal-save.db
```

Enable:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
```

Use migrations.

Never drop/recreate tables on startup.

---

# 13. DATABASE SCHEMA

Use:

```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    shell TEXT NOT NULL,
    cwd TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_opened_at TEXT
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    FOREIGN KEY (document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE
);

CREATE TABLE command_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    command TEXT NOT NULL,
    cwd TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_history_document
ON command_history(document_id, id);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

Use prepared statements.

Use transactions for related writes.

---

# 14. DOCUMENT CONCEPT

A document represents a saved terminal workspace.

Example:

```text
API
C:\Projects\Nexa\Api
PowerShell
```

A document stores:

```text
id
name
shell
cwd
created_at
updated_at
last_opened_at
```

It does NOT store the live shell process.

---

# 15. DOCUMENT LIST

Left sidebar:

```text
DOCUMENTS

+ New

● API
  C:\Projects\Nexa\Api

○ Backend
  C:\Projects\Nexa\Backend

○ Frontend
  C:\Projects\Nexa\Frontend

○ Server
  C:\Server
```

Actions:

```text
New
Open
Rename
Save
Delete
```

Double-click:

```text
Open document
```

Right-click:

```text
Rename
Save
Delete
```

Active document:

```text
subtle blue background
```

No tab groups.

---

# 16. TERMINAL

Use:

```text
@xterm/xterm
@xterm/addon-fit
node-pty
```

Windows-first.

Shell detection:

```text
1. PowerShell
2. cmd.exe fallback
```

Prefer PowerShell executable detection rather than hardcoding only one path.

Support:

```text
Commands
Scripts
Interactive applications
Ctrl+C
Ctrl+D
Ctrl+L
Copy
Paste
Tab completion
ANSI colors
Resize
Environment variables
Long-running processes
```

Interactive applications such as:

```text
vim
nvim
ssh
python
npm
git
```

must not be broken.

The terminal must be a genuine PTY.

Do not implement a fake shell.

---

# 17. PTY LIFECYCLE

When opening a document:

```text
Load document
      ↓
Read saved CWD
      ↓
Spawn PowerShell
      ↓
Set initial CWD
      ↓
Create xterm.js
      ↓
Connect xterm ↔ PTY
```

When switching documents:

Prefer keeping the previous PTY alive if it is reliable and resource usage is reasonable.

If this creates unnecessary complexity, terminate the old PTY and recreate it later.

For MVP:

> Reliability is more important than keeping many PTYs alive.

Never persist the actual PTY process.

---

# 18. CWD TRACKING

CWD tracking is important because it must survive restart.

Do NOT scrape visible terminal text to determine CWD.

Use PowerShell prompt integration and OSC 9;9.

The shell should emit the current filesystem path whenever the prompt is rendered.

Microsoft documents OSC 9;9 as a mechanism for communicating the current working directory from PowerShell to a terminal.

Implement:

```text
PowerShell
    ↓
OSC 9;9
    ↓
xterm parser OSC handler
    ↓
CwdTracker
    ↓
SQLite
```

Use:

```ts
terminal.parser.registerOscHandler(9, handler)
```

Do not modify the user's permanent PowerShell profile.

Inject the prompt customization only for the terminal-save PTY session.

The application must not overwrite the user's PowerShell configuration.

---

# 19. COMMAND HISTORY

This is one of the most important features.

The user expects:

```text
Today:
git status
dotnet build
git pull

Shutdown PC

Tomorrow:
Arrow + Up
→ git pull

Arrow + Up
→ dotnet build

Arrow + Up
→ git status
```

The history must survive:

```text
Closing terminal-save
Windows shutdown
Computer restart
Opening terminal-save again
```

Do NOT depend on PowerShell's in-memory history.

Use SQLite.

---

# 20. COMMAND CAPTURE

Do NOT save PTY output.

Do NOT save every terminal character to SQLite.

Capture user-entered command input separately.

Use xterm's keyboard/input events.

Maintain a lightweight current-input buffer.

Conceptually:

```text
User types:
git status

input buffer:
"git status"

User presses Enter:

save:
{
    documentId,
    command: "git status",
    cwd,
    createdAt
}
```

Then clear the buffer.

This is best-effort command capture.

Do not attempt to build a complete PowerShell parser.

---

# 21. INTERACTIVE PROGRAM SAFETY

Do not record terminal UI keystrokes as commands when the user enters interactive programs.

Examples:

```text
vim
nvim
ssh
python
```

Once an interactive program starts, temporarily suspend app-level command capture.

Resume normal capture when control returns to the top-level PowerShell prompt.

Do not break:

```text
Ctrl+C
Arrow keys
Function keys
Mouse input
ANSI escape sequences
```

---

# 22. HISTORY NAVIGATION

There are two history systems.

## Normal shell history

PowerShell handles:

```text
Arrow Up
Arrow Down
```

Do not interfere with normal PowerShell behavior.

## terminal-save persistent history

terminal-save handles:

```text
Arrow + Up
Arrow + Down
```

These must read from SQLite.

Use xterm's keyboard interception capability to detect these shortcuts before xterm sends them to the PTY. xterm.js provides `attachCustomKeyEventHandler` specifically for custom keyboard handling.

When the user presses:

```text
Arrow + Up
```

load the previous command from SQLite.

When:

```text
Arrow + Down
```

load the next command.

The recalled command must appear as editable text in the current PowerShell prompt.

Do not simply execute the command automatically.

The user must press Enter to execute it.

IMPORTANT:

If the current terminal input contains unsaved text, do not silently destroy it.

Choose a safe behavior such as:

```text
replace only when current input is empty
```

or maintain a temporary input state.

Document the chosen behavior.

---

# 23. NOTES

Right panel.

One plain-text note per document.

Example:

```text
NOTES

API Project

TODO:

□ Fix authentication
□ Update API endpoint
□ Add unit tests

Environment:

API_URL=http://localhost:5000
DB_HOST=localhost
```

Use a simple:

```html
<textarea>
```

No rich text editor.

Autosave with debounce.

Recommended:

```text
300-500ms
```

Do not write to SQLite on every keystroke.

Show a subtle state:

```text
Autosaved
Saving...
```

---

# 24. TOOLBAR

Keep toolbar simple.

Example:

```text
terminal-save

[ + New ] [ Save ]

[ Layout: Standard ]

[ Document List ]
[ Notes ]

[ Settings ]
```

Do not create a complex ribbon.

---

# 25. KEYBOARD SHORTCUTS

```text
Ctrl + N
New document

Ctrl + S
Save current document

Ctrl + W
Close current document

Ctrl + Shift + B
Toggle Document List

Ctrl + Shift + N
Toggle Notes
```

Inside the terminal, preserve:

```text
Ctrl+C
Ctrl+V
Ctrl+L
Ctrl+D
Arrow keys
Tab
Function keys
```

Do not globally intercept normal terminal shortcuts.

---

# 26. PERSISTENCE

Persist:

```text
Documents
Document names
Shell
CWD
Notes
Command history
Last opened document
Selected layout
Document List visibility
Notes visibility
```

Startup sequence:

```text
Application starts
        ↓
Open SQLite
        ↓
Run migrations
        ↓
Load settings
        ↓
Load documents
        ↓
Restore layout
        ↓
Open last document
        ↓
Spawn PTY
        ↓
Restore CWD
        ↓
Load persistent history
        ↓
Render UI
```

The application should feel continuous across restarts.

---

# 27. STARTUP / SHUTDOWN SAFETY

On application shutdown:

1. Persist current document metadata.
2. Persist latest known CWD.
3. Persist layout state.
4. Persist panel visibility.
5. Persist notes if pending.
6. Gracefully terminate PTY processes.
7. Close SQLite connection.

Do not block shutdown unnecessarily.

Use debounced persistence during normal operation so shutdown is not the only moment data is saved.

---

# 28. ERROR HANDLING

Handle:

```text
PowerShell unavailable
cmd unavailable
Invalid CWD
PTY crash
SQLite failure
Database migration failure
Native module loading failure
IPC failure
Document missing
Permission errors
```

Show useful user-facing messages.

Do not silently swallow errors.

Log technical details for debugging.

---

# 29. PERFORMANCE

Keep the app lightweight.

Rules:

- Minimal dependencies
- No framework unless needed
- No Redux
- No cloud service
- No unnecessary polling
- No terminal-output database logging
- Debounce notes
- Prepared SQLite statements
- Small IPC payloads
- Avoid unnecessary DOM updates
- Use xterm fit addon when layout changes
- Do not recreate the terminal unnecessarily

---

# 30. TESTING REQUIREMENTS

Every phase must include basic validation.

At minimum:

```text
npm install
npm run dev
npm run typecheck
npm run build
```

If scripts do not exist, create them.

For later phases also test:

```text
Create document
Open document
Rename document
Delete document
Save document
Restart application
Restart Windows
Restore CWD
Restore notes
Restore command history
Show/hide panels
Switch layouts
```

For terminal functionality test:

```text
echo
cd
Get-Location
git
npm
dotnet
Ctrl+C
copy/paste
Arrow keys
Tab completion
```

Test at least one interactive application where available.

---

# 31. PHASES

## PHASE 1 — Project Foundation

ONLY do this phase first.

Create:

```text
Electron
TypeScript
electron-vite
Vite
SQLite
better-sqlite3
Preload
IPC skeleton
Light UI
Migration system
```

Create the basic three-panel layout:

```text
Document List | Terminal | Notes
```

The panels do not need to be functional yet.

### Phase 1 validation

All must pass:

```text
npm install
native module rebuild
npm run dev
npm run typecheck
npm run build
```

Electron must actually launch.

SQLite must actually open.

Preload and IPC must actually work.

Then STOP.

---

## PHASE 2 — Real PowerShell Terminal

Build exactly ONE terminal.

Implement:

```text
xterm.js
node-pty
PowerShell
xterm fit
Light terminal theme
Resize
Ctrl+C
Copy/paste
```

Do not build documents yet.

Make the terminal reliable first.

Then test it.

STOP.

---

## PHASE 3 — Documents

Implement:

```text
New
Open
Rename
Save
Delete
```

Create the Document List.

Persist documents in SQLite.

STOP.

---

## PHASE 4 — CWD Persistence

Implement:

```text
OSC 9;9
CwdTracker
SQLite CWD updates
Restore CWD
```

Test:

```text
Open API
cd C:\Projects\Nexa\Api
Close application
Open application
Open API

Expected:
PowerShell starts in C:\Projects\Nexa\Api
```

STOP.

---

## PHASE 5 — Persistent Command History

Implement:

```text
Command capture
SQLite history
```

Test across application restart.

Then test across Windows restart if practical.

STOP.

---

## PHASE 6 — Notes

Implement:

```text
Notes panel
Textarea
Autosave
Load per document
Clear notes
```

STOP.

---

## PHASE 7 — Layout System

Implement:

```text
Standard
Focus Terminal
Terminal + Notes
```

Implement:

```text
Toggle Document List
Toggle Notes
```

Persist layout state.

STOP.

---

## PHASE 8 — Final UX Polish

Only now add:

- Better empty states
- Loading states
- Error states
- Context menus
- Small animations
- Toolbar refinement
- Keyboard shortcut polish
- Final light-theme refinement
- Installer configuration

Do not add new major features.

STOP.

---

# 32. PHASE COMPLETION REPORT

At the end of every phase report exactly:

```text
PHASE X COMPLETE

Implemented:
- ...

Files changed:
- ...

Dependencies:
- ...

Commands executed:
- ...

Validation:
- npm install: PASS/FAIL
- native rebuild: PASS/FAIL
- dev run: PASS/FAIL
- typecheck: PASS/FAIL
- build: PASS/FAIL
- feature tests: PASS/FAIL

Known issues:
- None
```

If something fails, do not report the phase as complete.

Fix it first.

---

# 33. IMPORTANT ANTI-PATTERNS

Never:

- Use `npm install --force` to hide dependency problems.
- Use `npm install --legacy-peer-deps` without explaining and fixing the root cause.
- Disable TypeScript errors.
- Use `any` everywhere.
- Put database logic in renderer code.
- Put PTY logic in renderer code.
- Expose Node.js directly to renderer.
- Store terminal output in SQLite.
- Modify the user's permanent PowerShell profile.
- Scrape terminal screen output to determine CWD.
- Reimplement PowerShell.
- Create fake terminal behavior.
- Automatically execute recalled history commands.
- Add features outside MVP without asking.

---

# 34. DEFINITION OF DONE

terminal-save MVP is successful when this scenario works:

```text
1. Open terminal-save.

2. Create document:
   "Nexa API"

3. Terminal starts:
   PS C:\Projects\Nexa\Api>

4. Run:
   git status
   dotnet build
   npm test

5. Write notes:
   "Fix authentication tomorrow."

6. Change directory:
   cd C:\Projects\Nexa\Api\src

7. Close terminal-save.

8. Restart Windows.

9. Open terminal-save.

10. "Nexa API" still exists.

11. Notes still exist.

12. Terminal starts in:
    C:\Projects\Nexa\Api\src

13. Press Arrow+Up.

14. Previous command appears.

15. Press Arrow+Up again.

16. Older command appears.

17. Nothing is automatically executed.

18. User presses Enter when ready.

19. Hide Document List.

20. Hide Notes.

21. Switch to Focus Terminal.

22. Close application.

23. Reopen it.

24. Layout is still restored.
```

If this scenario works reliably, the MVP foundation is correct.

---

# 35. FINAL PRINCIPLE

Do not build a complicated terminal product.

Build a **small, reliable, local-first desktop tool**.

The product should feel like:

> **Notepad++ + PowerShell + persistent workspace + notes.**

The most important characteristic is not visual complexity.

It is continuity:

> **Your terminal work should still be there tomorrow.**

START WITH **PHASE 1 ONLY**.