import { AlertCircle, CheckCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { storage } from "../lib/storage";

export function DataCorruptionWarning() {
  const [corruptionState, setCorruptionState] = useState(storage.getCorruptionState());
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check corruption state on mount
    const state = storage.getCorruptionState();
    setCorruptionState(state);
    setIsVisible(state.isCorrupted);
  }, []);

  if (!corruptionState.isCorrupted || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    storage.clearCorruptionState();
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${
        corruptionState.recoveredFromBackup
          ? "bg-blue-600"
          : "bg-red-600"
      } text-white shadow-lg`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {corruptionState.recoveredFromBackup ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm sm:text-base">
                {corruptionState.recoveredFromBackup
                  ? "Data Recovered"
                  : "Data Corruption Detected"}
              </p>
              <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                {corruptionState.message}
                {!corruptionState.recoveredFromBackup && (
                  <span className="block mt-1">
                    Use "Import from Excel" on the Dashboard to restore your data.
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss warning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
