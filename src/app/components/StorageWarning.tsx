import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { getStorageStats } from "../utils/imageCompression";

export function StorageWarning() {
  const [stats, setStats] = useState(getStorageStats());
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Update stats periodically
    const interval = setInterval(() => {
      const newStats = getStorageStats();
      setStats(newStats);
      setShowWarning(parseFloat(newStats.usagePercent) > 80);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900 mb-1">Storage Warning</h3>
          <p className="text-sm text-amber-800 mb-2">
            You're using {stats.usagePercent}% of your browser storage ({stats.usedMB}MB / {stats.limitMB}MB).
          </p>
          <p className="text-xs text-amber-700">
            Consider removing some product images or creating fewer events to free up space.
          </p>
        </div>
      </div>
    </div>
  );
}
