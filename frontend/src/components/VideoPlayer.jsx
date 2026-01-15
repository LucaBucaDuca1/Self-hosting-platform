import React, { useState, useEffect, useRef } from 'react';
import KeyboardShortcuts from './KeyboardShortcuts';
import './VideoPlayer.css';

const VideoPlayer = ({
  videoRef,
  streamUrl,
  onTimeUpdate,
  onEnded,
  onNextEpisode,
  hasNextEpisode,
  mediaData,
  subtitles = []
}) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10);
  const [showSettings, setShowSettings] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('off');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Handle "?" key for shortcuts
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // Handle Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showShortcuts) {
          setShowShortcuts(false);
        } else if (isFullscreen) {
          toggleFullscreen();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case ',':
          if (videoRef.current) {
            videoRef.current.currentTime -= 1/30; // Previous frame
          }
          break;
        case '.':
          if (videoRef.current) {
            videoRef.current.currentTime += 1/30; // Next frame
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (playing && showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playing, showControls]);

  // Next episode countdown
  useEffect(() => {
    if (showNextEpisode && nextEpisodeCountdown > 0) {
      const timer = setTimeout(() => {
        setNextEpisodeCountdown(nextEpisodeCountdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (showNextEpisode && nextEpisodeCountdown === 0) {
      onNextEpisode?.();
    }
  }, [showNextEpisode, nextEpisodeCountdown]);

  // Check for next episode trigger
  useEffect(() => {
    if (videoRef.current && hasNextEpisode) {
      const checkNextEpisode = () => {
        const timeLeft = duration - currentTime;
        if (timeLeft <= 30 && timeLeft > 0 && !showNextEpisode) {
          setShowNextEpisode(true);
        }
      };

      const interval = setInterval(checkNextEpisode, 1000);
      return () => clearInterval(interval);
    }
  }, [currentTime, duration, hasNextEpisode, showNextEpisode]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const changeVolume = (delta) => {
    if (videoRef.current) {
      const newVolume = Math.max(0, Math.min(1, volume + delta));
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume > 0) setMuted(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handlePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  };

  const handleSubtitleChange = (index) => {
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;

      // Disable all tracks
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'hidden';
      }

      // Enable selected track
      if (index !== 'off' && tracks[index]) {
        tracks[index].mode = 'showing';
        setCurrentSubtitle(index);
      } else {
        setCurrentSubtitle('off');
      }
      setShowSettings(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleVideoTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
    onTimeUpdate?.(e);
  };

  const handleVideoLoadedMetadata = (e) => {
    setDuration(e.target.duration);
  };

  const handleVideoPlay = () => setPlaying(true);
  const handleVideoPause = () => setPlaying(false);
  const handleVideoWaiting = () => setBuffering(true);
  const handleVideoCanPlay = () => setBuffering(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`custom-video-player ${showControls ? 'show-controls' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={streamUrl}
        className="video-element"
        autoPlay
        preload="auto"
        playsInline
        crossOrigin="anonymous"
        onTimeUpdate={handleVideoTimeUpdate}
        onLoadedMetadata={handleVideoLoadedMetadata}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onEnded={onEnded}
        onWaiting={handleVideoWaiting}
        onCanPlay={handleVideoCanPlay}
        onClick={togglePlay}
      >
        {subtitles && subtitles.map((subtitle, index) => (
          <track
            key={index}
            kind={subtitle.kind || 'subtitles'}
            label={subtitle.label}
            srcLang={subtitle.language}
            src={`/api/stream/subtitle/${subtitle.file}`}
            default={index === 0}
          />
        ))}
      </video>

      {buffering && (
        <div className="buffering-indicator">
          <div className="spinner"></div>
        </div>
      )}

      {/* Next Episode Overlay */}
      {showNextEpisode && hasNextEpisode && (
        <div className="next-episode-overlay">
          <div className="next-episode-content">
            <h3>Next Episode</h3>
            <p>{mediaData?.nextEpisodeTitle || 'Loading...'}</p>
            <div className="countdown-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  style={{
                    strokeDasharray: `${(nextEpisodeCountdown / 10) * 283} 283`,
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%'
                  }}
                />
              </svg>
              <span>{nextEpisodeCountdown}</span>
            </div>
            <div className="next-episode-buttons">
              <button onClick={() => setShowNextEpisode(false)} className="btn-cancel-next">
                Cancel
              </button>
              <button onClick={onNextEpisode} className="btn-play-next">
                Play Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Controls */}
      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
        {/* Progress Bar */}
        <div className="progress-container" onClick={handleSeek}>
          <div className="progress-bar">
            <div className="progress-filled" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="controls-row">
          <div className="controls-left">
            <button onClick={togglePlay} className="control-btn">
              {playing ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button onClick={() => skip(-10)} className="control-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
              <span className="skip-text">10</span>
            </button>

            <button onClick={() => skip(10)} className="control-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
              </svg>
              <span className="skip-text">10</span>
            </button>

            <button onClick={toggleMute} className="control-btn">
              {muted || volume === 0 ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : volume > 0.5 ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                </svg>
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value) - volume)}
              className="volume-slider"
            />

            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            <div className="settings-menu">
              <button onClick={() => setShowSettings(!showSettings)} className="control-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
              </button>

              {showSettings && (
                <div className="settings-dropdown">
                  <div className="settings-section">
                    <h4>Playback Speed</h4>
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRate(rate)}
                        className={playbackRate === rate ? 'active' : ''}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                  <div className="settings-section">
                    <h4>Quality</h4>
                    {['auto', '1080p', '720p', '480p'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={quality === q ? 'active' : ''}
                      >
                        {q.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="settings-section">
                    <h4>Subtitles</h4>
                    <button
                      onClick={() => handleSubtitleChange('off')}
                      className={currentSubtitle === 'off' ? 'active' : ''}
                    >
                      Off
                    </button>
                    {subtitles && subtitles.map((subtitle, index) => (
                      <button
                        key={index}
                        onClick={() => handleSubtitleChange(index)}
                        className={currentSubtitle === index ? 'active' : ''}
                      >
                        {subtitle.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} className="control-btn">
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      {!playing && (
        <div className="keyboard-hints">
          <p>Space: Play/Pause • ← →: Skip 10s • ↑ ↓: Volume • F: Fullscreen • M: Mute • ?: Shortcuts</p>
        </div>
      )}

      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
    </div>
  );
};

export default VideoPlayer;
