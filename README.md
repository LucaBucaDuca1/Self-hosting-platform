# 🎬 Zeloz Streaming Platform

A private, self-hosted streaming service built from scratch. Your personal Netflix + Plex that runs entirely on your PC with no cloud dependencies.

**Handcrafted by Zeloz** ♥

## ✨ Features

### 🎥 Modern Streaming Experience
- **Netflix-like UI**: Beautiful, responsive interface for desktop and mobile
- **Video Player**: HTML5 player with resume playback and auto-play next episode
- **Large File Support**: Stream videos up to 10GB with HTTP range requests
- **Smooth Playback**: Optimized streaming with progress tracking

### 📚 Content Management
- **Movies & TV Shows**: Organize your media library
- **Collections**: Group related content together
- **Auto Metadata**: Automatically extract titles and years from filenames
- **Posters & Backgrounds**: Custom artwork for your content
- **Search & Filters**: Find content by genre, year, or type

### 👤 User Features
- **Multi-User Support**: Create accounts for family and friends
- **Profiles**: Multiple profiles per user
- **My List**: Save favorites to watch later
- **Continue Watching**: Pick up where you left off
- **Watch History**: Track what you've watched
- **Recently Added**: See new content
- **Trending**: Most-watched content

### 🔐 Security & Access Control
- **Admin Accounts**: First user becomes admin
- **Upload Restrictions**: Only admins can upload (local network only)
- **JWT Authentication**: Secure token-based auth
- **Profile System**: Personal watch history per profile

### 📤 Upload System (Admin Only)
- **Drag & Drop**: Easy file uploads
- **Progress Bars**: Real-time upload progress
- **Auto-Fill Metadata**: Extracts info from filenames
- **Large File Support**: Upload videos up to 10GB
- **Batch Upload**: Upload multiple files

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

## 🚀 Quick Start

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

### 4. Create Your Account

1. Open `http://localhost:5173` (or `http://localhost:5000` in production)
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
