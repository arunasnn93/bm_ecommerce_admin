import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, TestTube, Mic, MicOff, X } from 'lucide-react';
import { useNotifications } from '@hooks/useNotifications';
import { speechNotificationService } from '@services/speechNotification';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSoundSettings, testSound, testSpeech, isConnected } = useNotifications();
  const [localSettings, setLocalSettings] = useState(settings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeTab, setActiveTab] = useState<'sound' | 'speech'>('sound');

  const handleSave = () => {
    updateSoundSettings(localSettings);
    onClose();
  };

  const handleTestSound = () => {
    testSound();
  };

  const handleTestSpeech = () => {
    testSpeech();
  };

  // Load available voices when component mounts
  useEffect(() => {
    if (isOpen) {
      const voices = speechNotificationService.getAvailableVoices();
      setAvailableVoices(voices);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sound')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sound'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Volume2 className="h-4 w-4 inline mr-2" />
            Sound Notifications
          </button>
          <button
            onClick={() => setActiveTab('speech')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'speech'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mic className="h-4 w-4 inline mr-2" />
            Speech Notifications
          </button>
        </div>

        {/* Connection Status */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Sound Notifications Tab */}
          {activeTab === 'sound' && (
            <div className="space-y-6">
              {/* Sound Notifications Toggle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Enable Sound Notifications
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
                <div>
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
                <div>
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
                <div>
                  <button
                    onClick={handleTestSound}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Sound
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Speech Notifications Tab */}
          {activeTab === 'speech' && (
            <div className="space-y-6">
              {/* Speech Notifications Toggle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Enable Speech Notifications
                  </label>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, speechEnabled: !prev.speechEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.speechEnabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.speechEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Announce new orders using text-to-speech
                </p>
              </div>

              {/* Speech Settings */}
              {localSettings.speechEnabled && (
                <>
                  {/* Voice Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Voice
                    </label>
                    <select
                      value={localSettings.speechVoice}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, speechVoice: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="default">Default Voice</option>
                      {availableVoices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speech Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Speech Rate
                      </label>
                      <span className="text-sm text-gray-600">
                        {localSettings.speechRate.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={localSettings.speechRate}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, speechRate: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Speech Pitch */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Speech Pitch
                      </label>
                      <span className="text-sm text-gray-600">
                        {localSettings.speechPitch.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={localSettings.speechPitch}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, speechPitch: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Speech Volume */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        {localSettings.speechVolume > 0 ? (
                          <Mic className="h-4 w-4 mr-1" />
                        ) : (
                          <MicOff className="h-4 w-4 mr-1" />
                        )}
                        Speech Volume
                      </label>
                      <span className="text-sm text-gray-600">
                        {Math.round(localSettings.speechVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={localSettings.speechVolume}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, speechVolume: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Test Speech Button */}
                  <div>
                    <button
                      onClick={handleTestSpeech}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Speech
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200">
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
    </div>
  );
};

export default NotificationSettings;
