import { useVideoUsage } from "../hooks/useApiQuery";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function UsageBanner({ compact = false }) {
  const { data, isLoading } = useVideoUsage();

  if (isLoading || !data?.usage) return null;

  const { videoCount, storageUsed, videoLimit, storageLimitBytes } = data.usage;
  const videoPct = Math.min((videoCount / videoLimit) * 100, 100);
  const storagePct = Math.min((storageUsed / storageLimitBytes) * 100, 100);
  const isWarning = videoPct >= 80 || storagePct >= 80;
  const isAtLimit = videoPct >= 100 || storagePct >= 100;

  if (compact && !isWarning) return null;

  return (
    <div className={`usage-banner ${isAtLimit ? "usage-banner--danger" : isWarning ? "usage-banner--warning" : ""}`}>
      <div className="usage-banner-row">
        <div className="usage-meter">
          <div className="usage-meter-label">
            <span>Videos</span>
            <span className="usage-meter-value">{videoCount} / {videoLimit}</span>
          </div>
          <div className="usage-bar">
            <div
              className={`usage-bar-fill ${videoPct >= 100 ? "usage-bar-fill--full" : videoPct >= 80 ? "usage-bar-fill--warn" : ""}`}
              style={{ width: `${videoPct}%` }}
            />
          </div>
        </div>
        <div className="usage-meter">
          <div className="usage-meter-label">
            <span>Storage</span>
            <span className="usage-meter-value">{formatBytes(storageUsed)} / {formatBytes(storageLimitBytes)}</span>
          </div>
          <div className="usage-bar">
            <div
              className={`usage-bar-fill ${storagePct >= 100 ? "usage-bar-fill--full" : storagePct >= 80 ? "usage-bar-fill--warn" : ""}`}
              style={{ width: `${storagePct}%` }}
            />
          </div>
        </div>
      </div>
      {isAtLimit && (
        <p className="usage-banner-msg">
          You've reached your limit. Delete existing videos to upload new ones.
        </p>
      )}
    </div>
  );
}

export function useIsAtVideoLimit() {
  const { data } = useVideoUsage();
  if (!data?.usage) return false;
  const { videoCount, videoLimit, storageUsed, storageLimitBytes } = data.usage;
  return videoCount >= videoLimit || storageUsed >= storageLimitBytes;
}
