# 🎬 Zeloz Streaming Platform

A private, self-hosted streaming service built from scratch. Your personal Netflix + Plex that runs entirely on your PC with no cloud dependencies.

**Handcrafted by Zeloz** ♥

## ✨ Features

### 🎥 Premium Streaming Experience
- **Netflix-like UI**: Polished, responsive interface that feels professional
- **Smooth Animations**: Fade-in, slide-in transitions throughout
- **Skeleton Loading**: No blank screens - elegant loading states everywhere
- **Video Player**: HTML5 player with resume playback and auto-play next episode
- **Large File Support**: Stream videos up to 10GB with HTTP range requests
- **Progress Tracking**: Visual progress bars on Continue Watching
- **Hover Previews**: Detailed info cards with descriptions on hover

### 📚 Advanced Content Discovery
- **Smart Home Page**: Continue Watching, My List, Trending, Recently Added
- **Collections**: Group related content with custom collections
- **Global Search**: Search across titles, descriptions, and genres
- **Advanced Filters**: Filter by genre, year, type
- **Multiple Sort Options**: A-Z, year (newest/oldest), recently added
- **Auto Metadata**: Automatically extract titles and years from filenames
- **Posters & Backgrounds**: Custom artwork for your content

### 👤 Personalized Experience
- **Multi-User Support**: Create accounts for family and friends
- **Profile System**: Multiple profiles per user with separate watch history
- **My List**: Save favorites to watch later (synced per profile)
- **Continue Watching**: Pick up exactly where you left off
- **Watch Progress**: Automatic progress tracking every 10 seconds
- **Recently Added**: Stay up to date with new content
- **Trending Now**: See what's popular (most watched in last 7 days)

### 🎨 Modern UI/UX
- **Staggered Animations**: Content loads with beautiful staggered timing
- **Smooth Hover Effects**: Cards scale and show details on hover
- **Loading Shimmer**: Professional skeleton states while loading
- **Empty States**: Helpful messages when content is empty
- **Results Count**: See how many items match your filters
- **Responsive Design**: Perfect on desktop, tablet, and mobile

### 🔐 Enterprise-Grade Security
- **LAN-Only Uploads**: Uploads restricted to local network only
- **Rate Limiting**: Login (5/15min), uploads (10/hour) protection
- **Session Management**: Track and manage all logged-in devices
- **Audit Logging**: Complete trail of uploads and sensitive actions
- **File Validation**: MIME type + extension verification
- **Admin-Only Uploads**: Only admin users can upload content
- **JWT Authentication**: Secure token-based auth
- **Device Management**: View and logout from specific devices
- **Profile Isolation**: Each profile has separate watch history and list

### 📤 Upload System (Admin Only)
- **Drag & Drop**: Easy file uploads with visual feedback
- **Progress Bars**: Real-time upload progress
- **Auto-Fill Metadata**: Extracts info from filenames (title, year, season, episode)
- **Large File Support**: Upload videos up to 10GB
- **Image Upload**: Add custom posters and backgrounds
- **Batch Upload**: Upload multiple files at once

## 🛠️ Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (file-based, no setup required)
- **Frontend**: React + Vite
- **Streaming**: HTTP range requests for efficient video delivery
- **Authentication**: JWT tokens + bcrypt
- **File Upload**: Multer with progress tracking

## 📋 Prerequisites

- Node.js 16+ installed
- At least 20GB free disk space (for content)
- Modern browser (Chrome, Firefox, Safari, Edge)

## 🚀 One-Click Quick Start ⚡

### The Fastest Way (Recommended)

**macOS / Linux:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

Or just **double-click** `start.sh` (Mac/Linux) or `start.bat` (Windows) in your file manager!

The startup script will automatically:
- ✓ Check if Node.js is installed
- ✓ Install dependencies (first run only, 2-5 minutes)
- ✓ Create `.env` file if needed
- ✓ Check port availability
- ✓ Start backend + frontend servers
- ✓ Open your browser to `http://localhost:5173`

See [QUICKSTART.md](QUICKSTART.md) for detailed one-click setup guide.

---

### Manual Setup (Alternative)

<details>
<summary>Click to expand manual installation steps</summary>

### 1. Install Dependencies

```bash
# Install all dependencies (root, backend, and frontend)
npm run setup
```

Or install manually:

```bash
# Root
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
cd ..
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and update the settings:

```env
PORT=5000
JWT_SECRET=your-super-secret-random-key-here
MAX_FILE_SIZE=10737418240
```

**IMPORTANT**: Change `JWT_SECRET` to a random string for security!

### 3. Start the Application

#### Development Mode (Recommended for first run)

```bash
# Start both backend and frontend
npm run dev
```

This will:
- Start the backend server on `http://localhost:5000`
- Start the frontend dev server on `http://localhost:5173`
- Open your browser automatically

#### Production Mode

```bash
# Build frontend
npm run build

# Start server
npm start
```

The app will be available at `http://localhost:5000`

### 4. Start the Application

```bash
npm run dev
```

</details>

---

### Create Your Account

1. Browser opens automatically to `http://localhost:5173`
2. Click "Sign up now"
3. Create your account (first account becomes admin)
4. Create a profile
5. Start uploading content!

## 📖 Usage Guide

### For Admins

#### Uploading Content

1. Navigate to **Upload** in the menu
2. Fill in the metadata (or let it auto-fill from filename)
3. Drag and drop your video file
4. Wait for upload to complete

**Filename Tips**: The system auto-extracts metadata from filenames:
- `Movie Name (2024).mp4` → Title: "Movie Name", Year: 2024
- `Show S01E01.mp4` → Season 1, Episode 1
- `Movie.Name.2024.1080p.mp4` → Title: "Movie Name", Year: 2024

#### Adding Posters/Backgrounds (Future Enhancement)

Currently, you can upload images through the API. UI support coming soon!

### For Regular Users

1. **Browse**: Explore movies and TV shows
2. **Search**: Use the search bar and filters
3. **My List**: Add favorites by clicking the + icon on any title
4. **Watch**: Click any title to start watching
5. **Resume**: Your progress is saved automatically

### Managing Content

**Edit Metadata**: Use the media API endpoints (UI coming soon)

**Delete Content**: Admin can delete via API (UI coming soon)

## 🌐 Network Access

### Local Network Only (Default)

By default, the service only works on your local network:
- Same WiFi network
- `http://YOUR-PC-IP:5000`

### Internet Access (Advanced)

To access from anywhere:
1. Set up port forwarding on your router (port 5000)
2. Use a dynamic DNS service (like DuckDNS)
3. **⚠️ Important**: Set up HTTPS with Let's Encrypt
4. Update CORS settings in `.env`

**Security Warning**: Only expose to the internet with proper security (HTTPS, strong passwords, firewall).

## 📁 Project Structure

```
zeloz-streaming/
├── backend/                 # Backend server
│   ├── config/             # Database configuration
│   ├── middleware/         # Auth middleware
│   ├── routes/             # API routes
│   ├── utils/              # Utilities (metadata extraction)
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service
│   │   └── App.jsx         # Main app component
│   └── vite.config.js      # Vite configuration
├── storage/                # Uploaded content
│   ├── videos/             # Video files
│   ├── posters/            # Poster images
│   └── backgrounds/        # Background images
├── database/               # SQLite database
│   └── streaming.db        # Main database file
├── .env                    # Environment variables
└── package.json            # Root package file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `JWT_SECRET` | Secret for JWT tokens | (required) |
| `MAX_FILE_SIZE` | Max upload size in bytes | 10737418240 (10GB) |
| `DB_PATH` | Database location | ./database/streaming.db |
| `ALLOWED_ORIGINS` | CORS origins | http://localhost:5173 |

### Storage Paths

All content is stored locally in the `storage/` directory:
- Videos: `storage/videos/`
- Posters: `storage/posters/`
- Backgrounds: `storage/backgrounds/`

**Backup Recommendation**: Regularly backup these folders and the database!

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Change the port in .env
PORT=3000
```

### Upload Fails

- Check file size (max 10GB by default)
- Ensure you're an admin
- Verify storage folder permissions
- Check available disk space

### Video Won't Play

- Ensure video format is supported (MP4, MKV, WebM)
- Check browser console for errors
- Verify file was uploaded completely
- Try a different browser

### Can't Access from Other Devices

- Check firewall settings
- Ensure devices are on same network
- Use your PC's IP address: `http://192.168.X.X:5000`
- Check if server is running

## 🆕 What's New

### Phase 2 - Enterprise Security + One-Click Startup! 🔐

#### Production-Ready Security
- ✅ **LAN-Only Uploads**: Automatically blocks uploads from non-local networks
- ✅ **Rate Limiting**: Login attempts (5/15min), uploads (10/hour), images (20/hour)
- ✅ **Session Management**: Track all logged-in devices with full details
- ✅ **Audit Logging**: Complete trail of uploads and sensitive actions
- ✅ **Enhanced File Validation**: MIME type + extension verification
- ✅ **Device Management UI**: View and logout from specific devices

#### One-Click Deployment
- ✅ **Automatic Setup Scripts**: `start.sh` (Mac/Linux) and `start.bat` (Windows)
- ✅ **Dependency Checking**: Auto-detects Node.js and npm
- ✅ **Auto-Install**: Installs dependencies on first run
- ✅ **Port Validation**: Checks if ports are available
- ✅ **Browser Auto-Open**: Opens your browser automatically
- ✅ **Professional Output**: Color-coded, clear console messages

#### New Features
- ✅ **Settings Page**: Manage devices, view sessions, account info
- ✅ **Session Tracking**: See device type, IP, login time, last active
- ✅ **Logout Devices**: Remove specific devices or logout all
- ✅ **Current Device Badge**: Highlights your current session

### Phase 1 - Premium Streaming Experience! 🎬

### Premium Streaming Experience
- ✅ **Skeleton Loading States**: No more blank screens - elegant loading animations everywhere
- ✅ **Smooth Animations**: Fade-in, slide-in, and staggered animations throughout
- ✅ **Enhanced Hover Effects**: Cards show detailed info with smooth transitions
- ✅ **Progress Bars**: Visual progress tracking on Continue Watching cards

### Advanced Features
- ✅ **Collections System**: Create custom collections to group related content
- ✅ **Advanced Sorting**: Sort by title (A-Z), year, or recently added
- ✅ **Enhanced Search**: Search across titles, descriptions, and genres simultaneously
- ✅ **Better Filters**: Multiple filters (genre, year, type) with "All" options
- ✅ **Results Count**: See how many titles match your current filters

### Home Page Improvements
- ✅ **Continue Watching**: Automatically shows your in-progress content with progress bars
- ✅ **My List Integration**: Quick access to your saved favorites
- ✅ **Trending Now**: See what's most popular (last 7 days)
- ✅ **Recently Added**: Stay up to date with new uploads
- ✅ **Dynamic Collections**: Collections automatically appear on home page

### UI/UX Polish
- ✅ **Staggered Load Animations**: Content appears with beautiful timing
- ✅ **Loading Shimmer**: Professional loading placeholders
- ✅ **Better Empty States**: Helpful messages when content is empty
- ✅ **Responsive Everywhere**: Perfect experience on all devices
- ✅ **Smooth Transitions**: Every interaction feels polished

All features are production-ready and fully integrated! The platform now feels like a professional streaming service.

## 🎯 Future Enhancements

- [ ] Subtitle support (.srt, .vtt)
- [ ] Transcoding for unsupported formats
- [ ] Mobile apps (iOS/Android)
- [ ] Chromecast/AirPlay support
- [ ] Download for offline viewing
- [ ] User permissions system
- [ ] Content recommendations
- [ ] Parental controls
- [ ] Watch together feature
- [ ] Better series organization
- [ ] Automatic poster/metadata fetching from TMDB

## 🤝 Contributing

This is a personal project, but feel free to:
- Report bugs
- Suggest features
- Fork and customize for your needs

## 📝 License

MIT License - Feel free to use and modify for personal use.

## ⚠️ Disclaimer

This software is for personal use only. Ensure you have the legal right to host and stream any content you upload. The author is not responsible for any misuse.

---

**Made with ♥ by Zeloz**

Enjoy your personal streaming service! 🎬🍿
