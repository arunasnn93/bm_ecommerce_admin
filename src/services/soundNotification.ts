import { log } from '@utils/logger';

export interface SoundNotificationOptions {
  volume?: number; // 0.0 to 1.0
  loop?: boolean;
  preload?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  volume: number;
  soundType: 'default' | 'chime' | 'bell' | 'notification';
}

class SoundNotificationService {
  private audioContext: AudioContext | null = null;
  private notificationSettings: NotificationSettings = {
    enabled: true,
    volume: 0.7,
    soundType: 'default'
  };
  private audioElements: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    this.loadSettings();
    this.initializeAudioContext();
    this.createAudioElements();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('notification-settings');
      if (saved) {
        this.notificationSettings = { ...this.notificationSettings, ...JSON.parse(saved) };
      }
    } catch (error) {
      log.error('Failed to load notification settings:', error);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('notification-settings', JSON.stringify(this.notificationSettings));
    } catch (error) {
      log.error('Failed to save notification settings:', error);
    }
  }

  private initializeAudioContext() {
    try {
      // Create AudioContext for better audio control
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      log.warn('AudioContext not supported, falling back to HTML5 Audio');
    }
  }

  private createAudioElements() {
    // Create different notification sounds
    const sounds = {
      default: this.createDefaultNotificationSound(),
      chime: this.createChimeSound(),
      bell: this.createBellSound(),
      notification: this.createNotificationSound()
    };

    Object.entries(sounds).forEach(([key, audio]) => {
      this.audioElements.set(key, audio);
    });
  }

  private createDefaultNotificationSound(): HTMLAudioElement {
    // Create a simple notification sound using data URL
    const audio = new Audio();
    const audioData = this.generateBeepSound(800, 0.3);
    audio.src = audioData;
    audio.preload = 'auto';
    return audio;
  }

  private createChimeSound(): HTMLAudioElement {
    const audio = new Audio();
    const audioData = this.generateBeepSound(523, 0.5);
    audio.src = audioData;
    audio.preload = 'auto';
    return audio;
  }

  private createBellSound(): HTMLAudioElement {
    const audio = new Audio();
    const audioData = this.generateBeepSound(1000, 0.4);
    audio.src = audioData;
    audio.preload = 'auto';
    return audio;
  }

  private createNotificationSound(): HTMLAudioElement {
    const audio = new Audio();
    const audioData = this.generateBeepSound(440, 0.3);
    audio.src = audioData;
    audio.preload = 'auto';
    return audio;
  }

  private generateBeepSound(frequency: number, duration: number): string {
    // Generate a simple beep sound as data URL
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate sine wave
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
      view.setInt16(44 + i * 2, sample * 32767, true);
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  public playNotificationSound(_type: 'new_order' | 'order_update' | 'info' = 'new_order') {
    if (!this.notificationSettings.enabled) {
      log.info('Sound notifications disabled');
      return;
    }

    try {
      const audio = this.audioElements.get(this.notificationSettings.soundType);
      if (audio) {
        audio.volume = this.notificationSettings.volume;
        audio.currentTime = 0;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            log.error('Failed to play notification sound:', error);
            // Fallback: try to play a simple beep
            this.playFallbackSound();
          });
        }
        
        log.info(`Playing ${this.notificationSettings.soundType} notification sound`);
      } else {
        this.playFallbackSound();
      }
    } catch (error) {
      log.error('Error playing notification sound:', error);
      this.playFallbackSound();
    }
  }

  private playFallbackSound() {
    try {
      // Fallback: use Web Audio API to generate a simple beep
      if (this.audioContext) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.value = this.notificationSettings.volume * 0.3;
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
      }
    } catch (error) {
      log.error('Fallback sound failed:', error);
    }
  }

  public setSettings(settings: Partial<NotificationSettings>) {
    this.notificationSettings = { ...this.notificationSettings, ...settings };
    this.saveSettings();
    log.info('Notification settings updated:', this.notificationSettings);
  }

  public getSettings(): NotificationSettings {
    return { ...this.notificationSettings };
  }

  public setEnabled(enabled: boolean) {
    this.setSettings({ enabled });
  }

  public setVolume(volume: number) {
    this.setSettings({ volume: Math.max(0, Math.min(1, volume)) });
  }

  public setSoundType(soundType: NotificationSettings['soundType']) {
    this.setSettings({ soundType });
  }

  public isEnabled(): boolean {
    return this.notificationSettings.enabled;
  }

  public getVolume(): number {
    return this.notificationSettings.volume;
  }

  public getSoundType(): NotificationSettings['soundType'] {
    return this.notificationSettings.soundType;
  }
}

// Create singleton instance
export const soundNotificationService = new SoundNotificationService();
export default soundNotificationService;
