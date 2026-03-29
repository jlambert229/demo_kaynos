import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "./Toast";
import { formatVideoClock } from "../utils/formatVideoTime";
import AppIcon from "./AppIcon";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const NOTE_MARKER_COLOR = "var(--accent)";

/** seekRequest: increment `token` each time you want to seek to `seconds` (HTML5 only). */
export default function VideoPlayer({
  src,
  vimeoId,
  notes = [],
  onTimeUpdate,
  onAddNote,
  seekRequest,
  title = "Session video",
}) {
  const toast = useToast();
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const containerRef = useRef(null);
  const lastSeekToken = useRef(0);

  const displayMode = src ? "html5" : vimeoId ? "vimeo" : "empty";

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hoveredNote, setHoveredNote] = useState(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteForm, setNoteForm] = useState({ text: "" });
  const [noteSaving, setNoteSaving] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef(null);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  const handlePlayerTap = useCallback((e) => {
    if (e.target.closest('.vp-controls') || e.target.closest('.vp-timeline') || e.target.closest('.vp-add-note')) return;
    const v = videoRef.current;
    if (!v) return;
    if (!showControls && !v.paused) {
      resetControlsTimer();
      return;
    }
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
      resetControlsTimer();
    } else {
      v.pause();
      setPlaying(false);
      setShowControls(true);
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    }
  }, [showControls, resetControlsTimer]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
      resetControlsTimer();
    } else {
      v.pause();
      setPlaying(false);
      setShowControls(true);
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    }
  }, [resetControlsTimer]);

  const seek = useCallback((e) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar || !v.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
  }, []);

  const seekTo = useCallback((seconds) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const skip = useCallback((delta) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  }, []);

  const handleAddNoteClick = useCallback(() => {
    const v = videoRef.current;
    if (v && !v.paused) {
      v.pause();
      setPlaying(false);
    }
    setNoteForm({ text: "" });
    setShowAddNote(true);
  }, []);

  const handleSaveNote = useCallback(async () => {
    if (!noteForm.text.trim() || !onAddNote) return;
    setNoteSaving(true);
    try {
      await onAddNote({
        timestampSeconds: Math.floor(currentTime),
        text: noteForm.text.trim(),
      });
      setShowAddNote(false);
      setNoteForm({ text: "" });
    } catch (err) {
      toast.error(err.message || "Could not save note");
    } finally {
      setNoteSaving(false);
    }
  }, [noteForm, onAddNote, currentTime, toast]);

  // External seek (from notes panel) — seekRequest null until first jump
  useEffect(() => {
    if (displayMode !== "html5" || seekRequest == null) return;
    if (seekRequest.token === lastSeekToken.current) return;
    lastSeekToken.current = seekRequest.token;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = seekRequest.seconds;
    setCurrentTime(seekRequest.seconds);
  }, [seekRequest, displayMode]);

  useEffect(() => {
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, []);

  useEffect(() => {
    if (displayMode !== "html5") return;
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [displayMode]);

  useEffect(() => {
    if (displayMode !== "html5") return;
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
        case "j":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
        case "l":
          e.preventDefault();
          skip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (videoRef.current) videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          if (videoRef.current) videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
          break;
        case "m":
          setMuted((prev) => {
            if (videoRef.current) videoRef.current.muted = !prev;
            return !prev;
          });
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "n":
          if (onAddNote) {
            e.preventDefault();
            handleAddNoteClick();
          }
          break;
        case "Escape":
          if (showAddNote) {
            e.preventDefault();
            setShowAddNote(false);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [displayMode, skip, togglePlay, toggleFullscreen, handleAddNoteClick, showAddNote, onAddNote]);

  if (displayMode === "vimeo") {
    return (
      <div className="vp-vimeo-wrap">
        <div className="video-container">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
            allow="autoplay; fullscreen; picture-in-picture"
            title={title}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </div>
        <p className="vp-vimeo-hint">
          Note timestamps are shown when you tap them in the list — scrub the Vimeo player to match that time.
        </p>
      </div>
    );
  }

  if (displayMode === "empty") {
    return (
      <div className="vp-no-video">
        <div className="vp-no-video-icon"><AppIcon name="movie-camera" size={40} /></div>
        <p>No video attached</p>
        <span className="vp-no-video-sub">You can still read and add notes below.</span>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const saveHint = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘+Enter to save" : "Ctrl+Enter to save";

  return (
    <div className={`vp-wrapper ${showControls ? '' : 'vp-controls-hidden'}`} ref={containerRef} onMouseMove={resetControlsTimer} onTouchStart={resetControlsTimer}>
      <div className="vp-player" onClick={handlePlayerTap} role="button" tabIndex={0} aria-label={playing ? "Pause" : "Play"} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePlay(); } }}>
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          playsInline
          title={title}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={(e) => {
            setCurrentTime(e.target.currentTime);
            onTimeUpdate?.(e.target.currentTime);
          }}
          onVolumeChange={(e) => {
            setVolume(e.target.volume);
            setMuted(e.target.muted);
          }}
          onPlay={() => { setPlaying(true); resetControlsTimer(); }}
          onPause={() => { setPlaying(false); setShowControls(true); }}
          onEnded={() => { setPlaying(false); setShowControls(true); }}
        />
        <div className={`vp-play-overlay ${playing && showControls ? 'vp-overlay-dim' : ''} ${playing && !showControls ? 'vp-overlay-hidden' : ''}`} aria-hidden>
          <div className="vp-play-btn">{playing ? <AppIcon name="pause-button" size={32} /> : <AppIcon name="play-button" size={32} />}</div>
        </div>
      </div>

      <div
        className="vp-timeline"
        ref={progressRef}
        onClick={seek}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={Math.round(currentTime)}
        aria-label="Seek through video"
        onKeyDown={(e) => {
          const v = videoRef.current;
          if (!v || !v.duration) return;
          const step = e.shiftKey ? 30 : 5;
          if (e.key === "ArrowRight") { v.currentTime = Math.min(v.currentTime + step, v.duration); e.preventDefault(); }
          else if (e.key === "ArrowLeft") { v.currentTime = Math.max(v.currentTime - step, 0); e.preventDefault(); }
          else if (e.key === "Home") { v.currentTime = 0; e.preventDefault(); }
          else if (e.key === "End") { v.currentTime = v.duration; e.preventDefault(); }
        }}
      >
        <div className="vp-timeline-progress" style={{ width: `${progress}%` }} />
        <div className="vp-timeline-thumb" style={{ left: `${progress}%` }} />
        {duration > 0 && notes.map((note) => {
          const pos = (note.timestamp_seconds / duration) * 100;
          return (
            <button
              key={note.id}
              type="button"
              className="vp-timeline-marker"
              style={{ left: `${pos}%`, background: NOTE_MARKER_COLOR }}
              onMouseEnter={() => setHoveredNote(note)}
              onMouseLeave={() => setHoveredNote(null)}
              onClick={(e) => { e.stopPropagation(); seekTo(note.timestamp_seconds); }}
              aria-label={`Note at ${formatVideoClock(note.timestamp_seconds)}`}
            >
              {hoveredNote?.id === note.id && (
                <div className="vp-marker-tooltip">
                  <span className="vp-marker-time">{formatVideoClock(note.timestamp_seconds)}</span>
                  <span className="vp-marker-text">{note.text.slice(0, 60)}{note.text.length > 60 ? "..." : ""}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="vp-controls">
        <div className="vp-controls-left">
          <button type="button" className="vp-btn" onClick={(e) => { e.stopPropagation(); togglePlay(); }} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <AppIcon name="pause-button" size={22} /> : <AppIcon name="play-button" size={22} />}
          </button>
          <button type="button" className="vp-btn" onClick={() => skip(-10)} aria-label="Back 10 seconds"><AppIcon name="fast-reverse-button" size={22} /></button>
          <button type="button" className="vp-btn" onClick={() => skip(10)} aria-label="Forward 10 seconds"><AppIcon name="fast-forward-button" size={22} /></button>
          <span className="vp-time" aria-live="polite">{formatVideoClock(currentTime)} / {formatVideoClock(duration)}</span>
        </div>
        <div className="vp-controls-right">
          {onAddNote && (
            <button type="button" className="vp-btn vp-note-btn" onClick={handleAddNoteClick} title="Add note (N)">
              <AppIcon name="memo" size={18} /> Note
            </button>
          )}
          <div className="vp-volume-group">
            <button type="button" className="vp-btn" aria-label={muted ? "Unmute" : "Mute"} onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !muted;
                setMuted(!muted);
              }
            }}
            >
              {muted || volume === 0 ? (
                <AppIcon name="muted-speaker" size={22} />
              ) : volume < 0.5 ? (
                <AppIcon name="speaker-medium-volume" size={22} />
              ) : (
                <AppIcon name="speaker-high-volume" size={22} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              className="vp-volume-slider"
              aria-label="Volume"
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (videoRef.current) {
                  videoRef.current.volume = v;
                  videoRef.current.muted = v === 0;
                }
              }}
            />
          </div>
          <div className="vp-speed-wrap">
            <button type="button" className="vp-btn vp-speed-btn" aria-haspopup="true" aria-expanded={showSpeedMenu} onClick={() => setShowSpeedMenu((p) => !p)}>
              {speed}x
            </button>
            {showSpeedMenu && (
              <div className="vp-speed-menu" role="menu">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="menuitem"
                    className={`vp-speed-option ${s === speed ? "active" : ""}`}
                    onClick={() => {
                      if (videoRef.current) videoRef.current.playbackRate = s;
                      setSpeed(s);
                      setShowSpeedMenu(false);
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="vp-btn" onClick={toggleFullscreen} aria-label="Fullscreen" title="Fullscreen (F)">
            {fullscreen ? <AppIcon name="down-left-arrow" size={22} /> : <AppIcon name="up-right-arrow" size={22} />}
          </button>
        </div>
      </div>

      <div className="vp-shortcuts-hint" aria-hidden>
        <span>Space play · J/L skip · N note · F full screen</span>
      </div>

      {showAddNote && onAddNote && (
        <div className="vp-add-note" onClick={(e) => e.stopPropagation()}>
          <div className="vp-add-note-header">
            <span>Add note at <strong>{formatVideoClock(currentTime)}</strong></span>
            <button type="button" className="vp-add-note-close" onClick={() => setShowAddNote(false)} aria-label="Close"><AppIcon name="cross-mark" size={20} /></button>
          </div>
          <div className="vp-add-note-body">
            <textarea
              className="vp-add-note-text"
              placeholder="Add a note for this moment in the video…"
              value={noteForm.text}
              onChange={(e) => setNoteForm((f) => ({ ...f, text: e.target.value }))}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSaveNote();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowAddNote(false);
                }
              }}
            />
            <div className="vp-add-note-actions">
              <span className="vp-add-note-hint">{saveHint} · Esc cancel</span>
              <button type="button" className="btn-secondary" onClick={() => setShowAddNote(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleSaveNote} disabled={noteSaving || !noteForm.text.trim()}>
                {noteSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
