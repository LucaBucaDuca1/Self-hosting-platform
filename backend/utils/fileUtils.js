const path = require('path');

// Extract title and year from filename
function extractMetadata(filename) {
  // Remove extension
  const nameWithoutExt = path.basename(filename, path.extname(filename));

  // Try to extract year (YYYY)
  const yearMatch = nameWithoutExt.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0]) : null;

  // Extract title (everything before year, or entire name if no year)
  let title = nameWithoutExt;
  if (year) {
    title = nameWithoutExt.substring(0, nameWithoutExt.indexOf(year.toString())).trim();
  }

  // Try to extract season/episode (S01E01 or 1x01 format)
  const seasonEpisodeMatch = nameWithoutExt.match(/S(\d+)E(\d+)|(\d+)x(\d+)/i);
  let season = null;
  let episode = null;

  if (seasonEpisodeMatch) {
    season = parseInt(seasonEpisodeMatch[1] || seasonEpisodeMatch[3]);
    episode = parseInt(seasonEpisodeMatch[2] || seasonEpisodeMatch[4]);

    // Remove season/episode from title
    title = title.replace(/S\d+E\d+|\d+x\d+/gi, '').trim();
  }

  // Clean up title: replace dots, underscores with spaces, trim
  title = title
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: title || 'Untitled',
    year,
    season,
    episode
  };
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Check if file is video
function isVideoFile(filename) {
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
  const ext = path.extname(filename).toLowerCase();
  return videoExtensions.includes(ext);
}

module.exports = {
  extractMetadata,
  formatFileSize,
  isVideoFile
};
