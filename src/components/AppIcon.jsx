import {
  Bell,
  Check,
  CheckCircle2,
  ClipboardList,
  Clapperboard,
  GraduationCap,
  Home,
  Info,
  Lock,
  LogOut,
  Maximize2,
  Minimize2,
  Pencil,
  Pause,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  StickyNote,
  Swords,
  TrendingUp,
  Upload,
  UserRound,
  Users,
  Video,
  Volume1,
  Volume2,
  VolumeX,
  X,
  FolderOpen,
} from "lucide-react";

/** Semantic names preserved from the old Fluent/emoji layer for minimal call-site churn. */
const ICON_MAP = {
  bell: Bell,
  "busts-in-silhouette": Users,
  clipboard: ClipboardList,
  gear: Settings,
  "bust-in-silhouette": UserRound,
  house: Home,
  lock: Lock,
  "log-out": LogOut,
  "clapper-board": Clapperboard,
  memo: StickyNote,
  "movie-camera": Video,
  "check-mark": Check,
  "chart-increasing": TrendingUp,
  "cross-mark": X,
  pencil: Pencil,
  information: Info,
  "muted-speaker": VolumeX,
  "speaker-medium-volume": Volume1,
  "speaker-high-volume": Volume2,
  "play-button": Play,
  "pause-button": Pause,
  "fast-reverse-button": SkipBack,
  "fast-forward-button": SkipForward,
  "outbox-tray": Upload,
  "open-file-folder": FolderOpen,
  "check-mark-button": CheckCircle2,
  "graduation-cap": GraduationCap,
  "martial-arts-uniform": Swords,
  "up-right-arrow": Maximize2,
  "down-left-arrow": Minimize2,
};

const DEFAULT_STROKE = 1.65;

/**
 * Unified flat stroke icons (Lucide). Single weight and style app-wide.
 *
 * @param {string} name - Key from ICON_MAP (legacy semantic ids)
 */
export default function AppIcon({ name, size = 20, className = "", strokeWidth = DEFAULT_STROKE, ...rest }) {
  const Icon = ICON_MAP[name];
  if (!Icon) {
    console.warn(`AppIcon: unknown name "${name}"`);
    return null;
  }
  const cls = className ? `app-icon ${className}` : "app-icon";
  return <Icon size={size} strokeWidth={strokeWidth} className={cls} aria-hidden {...rest} />;
}
