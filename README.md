# terminal-save

Aplikasi terminal Windows yang menyimpan dokumen, folder kerja, riwayat perintah, catatan, dan layout.

Panduan ini mencakup menjalankan aplikasi untuk pengembangan dan membuat paket release (`release/`).

<img width="1182" height="386" alt="image" src="https://github.com/user-attachments/assets/deaf1c3a-cc35-4bda-b1bf-cfcdce562da2" />

## Kebutuhan

Membangun release membutuhkan:

- Windows 64-bit
- Node.js 22.12 atau lebih baru
- npm
- Visual Studio Build Tools dengan workload **Desktop development with C++**

`better-sqlite3` dan `node-pty` dikompilasi ulang untuk Electron saat `npm install`. Tanpa toolchain C++, install akan gagal.

Menjalankan installer yang sudah jadi hanya membutuhkan Windows 64-bit. Node.js tidak diperlukan.

## Menjalankan untuk development

Dari folder proyek, pasang dependensi sekali:

```powershell
npm install
```

`npm install` juga mengompilasi ulang `better-sqlite3` dan `node-pty` untuk Electron. Langkah ini membutuhkan Visual Studio Build Tools.

Jalankan aplikasi dalam mode development:

```powershell
npm run dev
```

Perintah itu membuka jendela Electron dengan hot reload. Perubahan di kode renderer langsung terlihat; perubahan di proses main atau preload membutuhkan restart proses development.

Perintah lain yang berguna saat pengembangan:

```powershell
npm run typecheck
npm run build
```

`npm run typecheck` memeriksa tipe TypeScript tanpa menghasilkan file. `npm run build` mengompilasi main, preload, dan renderer ke folder `out/` tanpa membuat installer.

## Membuat paket

Dari folder proyek:

```powershell
npm install
npm run dist
```

`npm run dist` memakai sertifikat yang dipercaya Windows saat mengunduh Electron, NSIS, dan alat penandatanganan. Proxy perusahaan memasang sertifikat sendiri yang ditolak oleh penyimpanan bawaan Node, dan tanpa langkah ini pengemasan berhenti dengan `self-signed certificate in certificate chain`.

Hasilnya:

```text
release/terminal-save-Setup-1.0.0.exe
```

Angka versi mengikuti `version` di `package.json`.

Installer ini meminta lokasi pemasangan, lalu membuat shortcut desktop dan Start Menu.

## Menjalankan installer

1. Buka `release/terminal-save-Setup-1.0.0.exe`.
2. Pilih folder instalasi, lalu selesaikan pemasangan.
3. Jalankan **terminal-save** dari shortcut desktop, Start Menu, atau folder instalasi.

Uninstall tidak menghapus data aplikasi.

## Menjalankan tanpa installer

Untuk mencoba hasil build tanpa memasang:

```powershell
npm run dist:dir
```

Hasilnya folder:

```text
release/win-unpacked/
```

Jalankan:

```powershell
.\release\win-unpacked\terminal-save.exe
```

## Data tersimpan

Dokumen, catatan, riwayat perintah, dan layout disimpan di:

```text
%APPDATA%\terminal-save
```

Database SQLite ada di file `terminal-save.db` di folder itu. Menutup aplikasi atau menghapus instalasi tidak menghapus folder ini.

