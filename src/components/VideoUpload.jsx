import { useState, useRef, useCallback } from "react";
import { api } from "../api";
import AppIcon from "./AppIcon";
import { useIsAtVideoLimit } from "./UsageBanner";

const CONCURRENCY = 6;

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return "";
  if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${bytesPerSec.toFixed(0)} B/s`;
}

function formatEta(seconds) {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return "";
  if (seconds < 60) return `${Math.ceil(seconds)}s left`;
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  return `${m}m ${s}s left`;
}

function uploadPartXHR(url, blob, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        resolve(etag ? etag.replace(/"/g, "") : "");
      } else {
        reject(new Error(`Part upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during part upload"));
    xhr.send(blob);
  });
}

async function uploadPartWithRetry(url, blob, onProgress, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await uploadPartXHR(url, blob, onProgress);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
}

export default function VideoUpload({ targetType, targetId, onUploadComplete, onRemove }) {
  const atLimit = useIsAtVideoLimit();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const [dragover, setDragover] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(0);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const handleFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Please select a video file (MP4, MOV, WebM, MKV)");
      return;
    }

    setFile(selectedFile);
    setError("");
    setUploading(true);
    setProgress(0);
    setSpeed(0);
    setEta(0);

    try {
      const resp = await api.video.getUploadUrl({
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        size: selectedFile.size,
        targetType,
        targetId: targetId || "pending",
      });

      if (resp.multipart) {
        await doMultipartUpload(selectedFile, resp);
      } else {
        await doSingleUpload(selectedFile, resp.uploadUrl);
      }

      setUploaded(true);
      setUploading(false);
      onUploadComplete?.({
        videoKey: resp.key,
        videoSize: selectedFile.size,
        videoContentType: selectedFile.type,
        fileName: selectedFile.name,
      });
    } catch (err) {
      if (err.message === "Upload cancelled") {
        setError("");
      } else {
        setError(err.message || "Upload failed");
      }
      setUploading(false);
    }
  }, [targetType, targetId, onUploadComplete]);

  async function doSingleUpload(file, uploadUrl) {
    const startTime = Date.now();
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = (e.loaded / e.total) * 100;
          setProgress(pct);
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 0.5) {
            const bps = e.loaded / elapsed;
            setSpeed(bps);
            setEta((e.total - e.loaded) / bps);
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Upload failed - check your connection"));
      xhr.send(file);
    });
  }

  async function doMultipartUpload(file, { key, uploadId, chunkSize, parts }) {
    const totalSize = file.size;
    const partLoaded = new Array(parts.length).fill(0);
    let cancelled = false;
    const startTime = Date.now();

    abortRef.current = async () => {
      cancelled = true;
      try {
        await api.video.abortMultipart({ key, uploadId });
      } catch (_) {}
    };

    const completedParts = [];
    let nextIdx = 0;

    function updateProgress() {
      const loaded = partLoaded.reduce((a, b) => a + b, 0);
      const pct = (loaded / totalSize) * 100;
      setProgress(pct);
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 0.5) {
        const bps = loaded / elapsed;
        setSpeed(bps);
        setEta((totalSize - loaded) / bps);
      }
    }

    async function uploadNext() {
      while (nextIdx < parts.length) {
        if (cancelled) throw new Error("Upload cancelled");
        const idx = nextIdx++;
        const part = parts[idx];
        const start = idx * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const blob = file.slice(start, end);

        const etag = await uploadPartWithRetry(
          part.url,
          blob,
          (loaded) => {
            partLoaded[idx] = loaded;
            updateProgress();
          }
        );

        completedParts.push({ partNumber: part.partNumber, etag });
      }
    }

    const workers = [];
    const workerCount = Math.min(CONCURRENCY, parts.length);
    for (let i = 0; i < workerCount; i++) {
      workers.push(uploadNext());
    }
    await Promise.all(workers);

    if (cancelled) throw new Error("Upload cancelled");

    await api.video.completeMultipart({ key, uploadId, parts: completedParts });
    abortRef.current = null;
  }

  const handleCancel = async () => {
    if (abortRef.current) await abortRef.current();
    setUploading(false);
    setFile(null);
    setProgress(0);
    setSpeed(0);
    setEta(0);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragover(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleRemove = () => {
    setFile(null);
    setUploaded(false);
    setProgress(0);
    setError("");
    setSpeed(0);
    setEta(0);
    onRemove?.();
  };

  if (atLimit && !uploaded) {
    return (
      <div className="upload-zone" style={{ opacity: 0.6, cursor: "not-allowed" }}>
        <div className="upload-zone-icon"><AppIcon name="cross-mark" size={40} /></div>
        <p>Video limit reached</p>
        <span className="upload-hint">Delete existing videos to upload new ones.</span>
      </div>
    );
  }

  if (uploaded && file) {
    return (
      <div className="upload-complete">
        <div className="upload-complete-icon"><AppIcon name="check-mark-button" size={40} /></div>
        <div className="upload-complete-info">
          <div className="upload-complete-name">{file.name}</div>
          <div className="upload-complete-size">{formatBytes(file.size)}</div>
        </div>
        <button className="upload-remove-btn" onClick={handleRemove} title="Remove"><AppIcon name="cross-mark" size={18} /></button>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`upload-zone ${dragover ? "dragover" : ""} ${uploading ? "uploading" : ""}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {uploading ? (
          <div>
            <div className="upload-zone-icon" style={{ animation: "shimmer 1.5s ease infinite" }}><AppIcon name="outbox-tray" size={40} /></div>
            <p>Uploading {file?.name}...</p>
            <div className="upload-progress">
              <div className="upload-progress-bar">
                <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="upload-progress-text">
                {Math.round(progress)}% of {formatBytes(file?.size)}
                {speed > 0 ? ` \u00B7 ${formatSpeed(speed)}` : ""}
                {eta > 0 ? ` \u00B7 ${formatEta(eta)}` : ""}
              </div>
            </div>
            <button
              type="button"
              className="upload-cancel-btn"
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="upload-zone-icon"><AppIcon name="open-file-folder" size={40} /></div>
            <p>Drag & drop a video file or click to browse</p>
            <span className="upload-hint">MP4, MOV, WebM — up to 5 GB</span>
          </>
        )}
      </div>
      {error && <div className="login-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
