import { log } from '../utils/logger';

export interface SpeechSettings {
  enabled: boolean;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

class SpeechNotificationService {
  private speechSynthesis: SpeechSynthesis;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private settings: SpeechSettings = {
    enabled: true,
    voice: 'default',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  };

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.loadSettings();
    this.loadVoices();
    
    // Load voices when they become available
    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('speechNotificationSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      log.error('Failed to load speech settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('speechNotificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      log.error('Failed to save speech settings:', error);
    }
  }

  private loadVoices(): void {
    this.availableVoices = this.speechSynthesis.getVoices();
    log.info('Loaded speech voices:', {
      count: this.availableVoices.length,
      voices: this.availableVoices.map(v => ({ name: v.name, lang: v.lang }))
    });
  }

  public isEnabled(): boolean {
    return this.settings.enabled && 'speechSynthesis' in window;
  }

  public setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
    log.info('Speech notifications enabled:', enabled);
  }

  public getSettings(): SpeechSettings {
    return { ...this.settings };
  }

  public updateSettings(settings: Partial<SpeechSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
    log.info('Speech settings updated:', this.settings);
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return [...this.availableVoices];
  }

  public getDefaultVoice(): SpeechSynthesisVoice | null {
    // Try to find a good default voice
    const preferredVoices = [
      'Google UK English Female',
      'Google US English Female', 
      'Microsoft Zira Desktop',
      'Microsoft Hazel Desktop',
      'Alex',
      'Samantha'
    ];

    // First try preferred voices
    for (const preferred of preferredVoices) {
      const voice = this.availableVoices.find(v => v.name.includes(preferred));
      if (voice) return voice;
    }

    // Fallback to first English voice
    const englishVoice = this.availableVoices.find(v => 
      v.lang.startsWith('en') && v.default
    );
    if (englishVoice) return englishVoice;

    // Fallback to first available voice
    return this.availableVoices[0] || null;
  }

  public speak(text: string, options?: {
    voice?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isEnabled()) {
        log.info('Speech notifications disabled, skipping:', text);
        resolve();
        return;
      }

      if (!this.speechSynthesis) {
        log.error('Speech synthesis not available');
        reject(new Error('Speech synthesis not available'));
        return;
      }

      // Cancel any ongoing speech
      this.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      if (options?.voice) {
        const voice = this.availableVoices.find(v => v.name === options.voice);
        if (voice) {
          utterance.voice = voice;
        }
      } else if (this.settings.voice !== 'default') {
        const voice = this.availableVoices.find(v => v.name === this.settings.voice);
        if (voice) {
          utterance.voice = voice;
        }
      } else {
        // Use default voice
        const defaultVoice = this.getDefaultVoice();
        if (defaultVoice) {
          utterance.voice = defaultVoice;
        }
      }

      // Set speech parameters
      utterance.rate = options?.rate ?? this.settings.rate;
      utterance.pitch = options?.pitch ?? this.settings.pitch;
      utterance.volume = options?.volume ?? this.settings.volume;

      // Set up event handlers
      utterance.onstart = () => {
        log.info('Speech started:', { text, voice: utterance.voice?.name });
      };

      utterance.onend = () => {
        log.info('Speech completed:', text);
        resolve();
      };

      utterance.onerror = (event) => {
        log.error('Speech error:', { error: event.error, text });
        reject(new Error(`Speech error: ${event.error}`));
      };

      // Speak the text
      this.speechSynthesis.speak(utterance);
      
      log.info('Speaking text:', {
        text,
        voice: utterance.voice?.name,
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume
      });
    });
  }

  public speakNewOrder(customerName?: string): Promise<void> {
    const message = customerName 
      ? `New order received from ${customerName}`
      : 'New order received';
    
    return this.speak(message);
  }

  public speakOrderUpdate(message: string): Promise<void> {
    return this.speak(`Order update: ${message}`);
  }

  public speakGeneric(message: string): Promise<void> {
    return this.speak(message);
  }

  public stop(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      log.info('Speech stopped');
    }
  }

  public testSpeech(): Promise<void> {
    return this.speak('Speech notifications are working correctly');
  }
}

// Create singleton instance
export const speechNotificationService = new SpeechNotificationService();
