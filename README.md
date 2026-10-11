# terminal-save

A Windows terminal application that remembers your documents, workspace folders, command history, notes, and layouts.

_Aplikasi terminal Windows yang menyimpan dokumen, folder kerja, riwayat perintah, catatan, dan layout._

<img width="1171" height="490" alt="image" src="https://github.com/user-attachments/assets/26bdaaee-2125-4191-86ea-7443f37fc859" />


## Prerequisites

Required for development and packaging:
- **Windows 64-bit**
- **Node.js 22.12+** & **npm**
- **Visual Studio Build Tools** with the **Desktop development with C++** workload (required to compile native modules `better-sqlite3` and `node-pty`)

> **Note:** End-users only need Windows 64-bit to run the application installer; Node.js is not required.

## Getting Started

### Development

```powershell
# Install dependencies and rebuild native modules
npm install

# Start app in development mode
npm run dev
```

Other development scripts:
- `npm run typecheck` - Run TypeScript type checking.
- `npm run build` - Compile code into `out/`.

### Packaging

```powershell
# Build installer (outputs to release/)
npm run dist

# Build unpacked folder without installer
npm run dist:dir
```

Artifacts are created in the `release/` folder:
- **Installer:** `release/terminal-save-Setup-<version>.exe`
- **Unpacked App:** `release/win-unpacked/terminal-save.exe`

## Data Storage

Application data (SQLite database, notes, and history) is stored in:

```text
%APPDATA%\terminal-save
```
