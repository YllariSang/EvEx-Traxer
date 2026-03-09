import { EditLogEntry } from "../types";
import { format } from "date-fns";
import { Clock, User, Edit } from "lucide-react";

interface EditLogProps {
  editLog: EditLogEntry[];
}

export function EditLog({ editLog }: EditLogProps) {
  if (!editLog || editLog.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Edit History
        </h2>
        <p className="text-gray-500 text-sm">No edit history available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Edit History
      </h2>
      
      <div className="space-y-4">
        {[...editLog].reverse().map((entry, index) => (
          <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="font-medium">{entry.user}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  {format(new Date(entry.timestamp), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 mt-2">
              <Edit className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                <p className="text-sm text-gray-600 mt-1">{entry.changes}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
