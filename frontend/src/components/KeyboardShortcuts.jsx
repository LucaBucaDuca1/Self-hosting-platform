import React from 'react';
import './KeyboardShortcuts.css';

const KeyboardShortcuts = ({ onClose }) => {
  const shortcuts = [
    { key: 'Space / K', action: 'Play/Pause' },
    { key: '←', action: 'Rewind 10 seconds' },
    { key: '→', action: 'Forward 10 seconds' },
    { key: 'J', action: 'Rewind 10 seconds' },
    { key: 'L', action: 'Forward 10 seconds' },
    { key: '↑', action: 'Volume up' },
    { key: '↓', action: 'Volume down' },
    { key: 'M', action: 'Mute/Unmute' },
    { key: 'F', action: 'Fullscreen' },
    { key: '0-9', action: 'Jump to 0%-90% of video' },
    { key: 'C', action: 'Toggle captions' },
    { key: 'Shift + N', action: 'Next episode' },
    { key: 'Shift + P', action: 'Previous episode' },
    { key: '?', action: 'Show keyboard shortcuts' },
    { key: 'Esc', action: 'Close/Exit' }
  ];

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="shortcuts-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="shortcuts-content">
          <div className="shortcuts-grid">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="shortcut-item">
                <div className="shortcut-key">{shortcut.key}</div>
                <div className="shortcut-action">{shortcut.action}</div>
              </div>
            ))}
          </div>

          <div className="shortcuts-tip">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p>Press <kbd>?</kbd> anytime to view these shortcuts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
