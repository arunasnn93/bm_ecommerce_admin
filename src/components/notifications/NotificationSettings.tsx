import React, { useState } from 'react';
import { Bell, Volume2, VolumeX, Settings, TestTube } from 'lucide-react';
import { useNotifications } from '@hooks/useNotifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSoundSettings, testSound, isConnected } = useNotifications();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSoundSettings(localSettings);
    onClose();
  };

  const handleTestSound = () => {
    testSound();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-3 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Connection Status</span>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Sound Notifications Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Sound Notifications
            </label>
            <button
              onClick={() => setLocalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.soundEnabled ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Play sound when new orders are received
          </p>
        </div>

        {/* Volume Control */}
        {localSettings.soundEnabled && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                {localSettings.volume > 0 ? (
                  <Volume2 className="h-4 w-4 mr-1" />
                ) : (
                  <VolumeX className="h-4 w-4 mr-1" />
                )}
                Volume
              </label>
              <span className="text-sm text-gray-600">
                {Math.round(localSettings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.volume}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )}

        {/* Sound Type Selection */}
        {localSettings.soundEnabled && (
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Notification Sound
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'default', label: 'Default' },
                { value: 'chime', label: 'Chime' },
                { value: 'bell', label: 'Bell' },
                { value: 'notification', label: 'Modern' },
              ].map((sound) => (
                <button
                  key={sound.value}
                  onClick={() => setLocalSettings(prev => ({ ...prev, soundType: sound.value as any }))}
                  className={`p-2 text-sm rounded-md border transition-colors ${
                    localSettings.soundType === sound.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {sound.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Test Sound Button */}
        {localSettings.soundEnabled && (
          <div className="mb-6">
            <button
              onClick={handleTestSound}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Sound
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
