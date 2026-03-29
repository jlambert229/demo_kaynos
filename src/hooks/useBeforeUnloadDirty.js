import { useEffect } from "react";

/** Warn before closing tab when the form has unsaved edits (browser-native prompt). */
export function useBeforeUnloadDirty(isDirty) {
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);
}
