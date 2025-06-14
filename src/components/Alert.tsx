import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

interface AlertProps {
  type: "error" | "success" | "info" | "warning";
  title: string;
  message: string;
}

const icons = {
  error: <XCircle className="h-5 w-5 text-red-400" />,
  success: <CheckCircle className="h-5 w-5 text-green-400" />,
  info: <Info className="h-5 w-5 text-blue-400" />,
  warning: <AlertCircle className="h-5 w-5 text-yellow-400" />,
};

const styles = {
  error: "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300",
  success:
    "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300",
  info: "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
  warning:
    "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
};

export const Alert: React.FC<AlertProps> = ({ type, title, message }) => {
  return (
    <div className={`rounded-md p-4 ${styles[type]}`}>
      <div className="flex">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="mt-2 text-sm opacity-90">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
