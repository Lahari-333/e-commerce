import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ message = "Loading items..." }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <p className="text-xs font-medium tracking-wide">{message}</p>
    </div>
  );
}
