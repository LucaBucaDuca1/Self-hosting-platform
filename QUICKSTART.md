# 🚀 Quick Start - One-Click Setup

Get your Zeloz Streaming Platform running in seconds!

## For macOS / Linux

### One-Click Start
```bash
./start.sh
```

Or double-click `start.sh` in your file manager.

## For Windows

### One-Click Start
Double-click `start.bat`

Or in Command Prompt:
```cmd
start.bat
```

## What It Does

The startup script will automatically:
1. ✓ Check if Node.js is installed
2. ✓ Check if npm is available
3. ✓ Install dependencies (first run only)
4. ✓ Create .env file if needed
5. ✓ Check if ports are available
6. ✓ Start backend server (port 5000)
7. ✓ Start frontend dev server (port 5173)
8. ✓ Open your browser automatically

## First Time Setup

When you first run the script:
- Dependencies will be installed (takes 2-5 minutes)
- A `.env` file will be created
- The browser will open to `http://localhost:5173`
- You'll see the registration page

## Create Your Account

1. Click "Sign up now"
2. Enter your email, username, and password
3. You'll automatically be an admin (first user)
4. Create a profile
5. Start uploading content!

## Requirements

- **Node.js 16+** (Download from https://nodejs.org)
- **At least 20GB free space** (for your content)
- **Modern browser** (Chrome, Firefox, Safari, Edge)

## Troubleshooting

### "Node.js is not installed"
Install Node.js from https://nodejs.org/ (LTS version recommended)

### "Port 5000 is already in use"
- Close any app using port 5000
- Or change `PORT=5000` in `.env` to another port

### Dependencies fail to install
```bash
# Clean and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm run setup
```

### Browser doesn't open automatically
Manually open: http://localhost:5173

## Next Steps

Once running:
- **Upload Content**: Click "Upload" in the menu (admin only)
- **Browse**: Use Movies, TV Shows, or search
- **My List**: Save favorites
- **Settings**: Manage logged-in devices

## Stopping the Server

Press `Ctrl+C` in the terminal to stop both servers.

---

**Made with ♥ by Zeloz**

For full documentation, see [README.md](README.md)
