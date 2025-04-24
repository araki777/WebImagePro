import { Loader } from "lucide-react";
import React from "react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader className="w-12 h-12 text-white animate-spin mb-4" />
        <h2 className="text-2xl font-medium text-white">
          Loading experience...
        </h2>
      </div>
    </div>
  );
};

export default LoadingScreen;
