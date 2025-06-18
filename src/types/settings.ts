import { ReactNode } from 'react';
import { ToastType } from '../components/Toast';

export type TabType = "appearance" | "study" | "wordlists" | "data" | "about";

export interface TabItem {
  id: TabType;
  label: string;
  icon: ReactNode;
}

export interface SettingItemProps {
  icon?: ReactNode;
  title?: string;
  value: any;
  onChange: (value: any) => void;
  options: { value: any; label: string }[];
  isLoading?: boolean;
  hideIcon?: boolean;
  inline?: boolean;
}

export interface SettingToggleProps {
  icon: ReactNode;
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  isLoading?: boolean;
}

export interface DangerButtonProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "warning" | "danger";
}

export interface ToastState {
  message: string;
  isVisible: boolean;
  type?: ToastType;
}

export interface SettingLoadingState {
  theme: boolean;
  fontSize: boolean;
  wordsPerSession: boolean;
  timeLimit: boolean;
  enableSound: boolean;
  enableHints: boolean;
  enableTimer: boolean;
  enableAutoSpeak: boolean;
  fontFamily: boolean;
}

export interface UserSettings {
  enableSound: boolean;
  enableAutoSpeak: boolean;
  fontSize: "small" | "medium" | "large";
  theme: "light" | "dark";
  studySessionSettings: {
    wordsPerSession: number; // Number of words per study session
    timeLimit: number; // Time limit in seconds (0 means no limit)
  };
}
