import React from 'react';
import { Palette, Type, Text } from 'lucide-react';
import SettingItem from '../SettingItem';
import { SettingLoadingState } from '../../../types/settings';

interface AppearanceTabProps {
  settings: any;
  settingLoading: SettingLoadingState;
  onSettingChange: (key: string, value: any) => void;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({
  settings,
  settingLoading,
  onSettingChange,
}) => {
  return (
    <div>
      <SettingItem
        icon={<Palette className="w-5 h-5 text-blue-500" />}
        title="Theme"
        value={settings.theme}
        onChange={(value) => onSettingChange("theme", value)}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
        isLoading={settingLoading.theme}
      />
      <SettingItem
        icon={<Type className="w-5 h-5 text-blue-500" />}
        title="Font Family"
        value={settings.fontFamily || "inter"}
        onChange={(value) => onSettingChange("fontFamily", value)}
        options={[
          { value: "inter", label: "Inter" },
          { value: "roboto", label: "Roboto" },
          { value: "open-sans", label: "Open Sans" },
          { value: "poppins", label: "Poppins" },
        ]}
        isLoading={settingLoading.fontFamily}
      />
      <SettingItem
        icon={<Text className="w-5 h-5 text-blue-500" />}
        title="Font Size"
        value={settings.fontSize}
        onChange={(value) => onSettingChange("fontSize", value)}
        options={[
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ]}
        isLoading={settingLoading.fontSize}
      />
    </div>
  );
};

export default AppearanceTab; 