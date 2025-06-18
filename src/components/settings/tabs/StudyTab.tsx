import React from "react";
import { BookMarked, Clock, Volume2, Bell, HelpCircle } from "lucide-react";
import { Switch } from "@headlessui/react";
import SettingItem from "../SettingItem";
import SettingToggle from "../SettingToggle";
import { SettingLoadingState } from "../../../types/settings";

interface StudyTabProps {
  settings: any;
  settingLoading: SettingLoadingState;
  onSettingChange: (key: string, value: any) => void;
  onStudySettingChange: (key: string, value: any) => void;
}

const StudyTab: React.FC<StudyTabProps> = ({
  settings,
  settingLoading,
  onSettingChange,
  onStudySettingChange,
}) => {
  return (
    <div>
      <SettingItem
        icon={<BookMarked className="w-5 h-5 text-blue-500" />}
        title="Words Per Session"
        value={settings.studySessionSettings?.wordsPerSession || 20}
        onChange={(value) => onStudySettingChange("wordsPerSession", value)}
        options={[
          { value: 5, label: "5 words" },
          { value: 20, label: "20 words" },
          { value: 50, label: "50 words" },
        ]}
        isLoading={settingLoading.wordsPerSession}
      />
      <div className="bg-white dark:bg-secondary-800/50 border-b border-gray-200/80 dark:border-gray-600">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2.5">
            <div className="text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-800 dark:text-gray-100">
                Timer
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Set time limit for each word
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {settings.enableTimer && (
              <SettingItem
                value={settings.studySessionSettings?.timeLimit || 0}
                onChange={(value) => onStudySettingChange("timeLimit", value)}
                options={[
                  { value: 15, label: "15s" },
                  { value: 30, label: "30s" },
                  { value: 60, label: "60s" },
                ]}
                isLoading={settingLoading.timeLimit}
                hideIcon
                inline
              />
            )}
            <Switch
              checked={settings.enableTimer}
              onChange={async (value) => {
                try {
                  // Only update the timer state, don't automatically set time limit
                  await onSettingChange("enableTimer", value);
                  // Only update time limit if explicitly enabled
                  if (value) {
                    await onStudySettingChange(
                      "timeLimit",
                      settings.studySessionSettings?.timeLimit || 30
                    );
                  }
                } catch (error) {
                  console.error("Failed to update timer settings:", error);
                }
              }}
              className={`${
                settings.enableTimer
                  ? "bg-blue-600"
                  : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              disabled={settingLoading.enableTimer || settingLoading.timeLimit}
            >
              <span
                className={`${
                  settings.enableTimer ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        </div>
      </div>
      <SettingToggle
        icon={<Volume2 className="w-5 h-5" />}
        title="Sound Effects"
        description="Play sound effects for actions"
        value={settings.enableSound}
        onChange={(value) => onSettingChange("enableSound", value)}
        isLoading={settingLoading.enableSound}
      />
      <SettingToggle
        icon={<Bell className="w-5 h-5" />}
        title="Auto-Speak Words"
        description="Automatically speak words during practice"
        value={settings.enableAutoSpeak}
        onChange={(value) => onSettingChange("enableAutoSpeak", value)}
        isLoading={settingLoading.enableAutoSpeak}
      />
      <SettingToggle
        icon={<HelpCircle className="w-5 h-5" />}
        title="Hints"
        description="Show hints during practice"
        value={settings.enableHints}
        onChange={(value) => onSettingChange("enableHints", value)}
        isLoading={settingLoading.enableHints}
      />
    </div>
  );
};

export { StudyTab };
