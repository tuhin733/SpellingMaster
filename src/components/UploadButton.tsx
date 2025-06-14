import React from "react";
import { Upload } from "lucide-react";
import Tooltip from "./Tooltip";

interface UploadButtonProps {
  onClick: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onClick }) => {
  return (
    <Tooltip content="Upload a new wordlist" position="top">
      <button
        onClick={onClick}
        className="inline-flex items-center justify-center p-2 sm:p-2.5 rounded-full 
        bg-gradient-to-r from-primary-500 to-primary-600
        text-white hover:from-primary-600 hover:to-primary-700
        transition-all duration-300 ease-in-out
        transform hover:scale-105 active:scale-95
        shadow-md hover:shadow-lg
        dark:from-primary-400 dark:to-primary-500
        dark:hover:from-primary-500 dark:hover:to-primary-600"
        aria-label="Upload Wordlist"
      >
        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </Tooltip>
  );
};

export default UploadButton;
