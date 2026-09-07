import { SupportedLanguage } from '../types';

type SpeechCallback = (transcript: string, isFinal: boolean) => void;
type StatusCallback = (isListening: boolean) => void;

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isMuted: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onSpeakingChange: ((isSpeaking: boolean) => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      } catch (e) {
        console.warn('Speech recognition init error:', e);
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public stop() {
    this.stopSpeaking();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public onSpeakingStatus(callback: (isSpeaking: boolean) => void) {
    this.onSpeakingChange = callback;
  }

  public startListening(
    lang: SupportedLanguage,
    onResult: SpeechCallback,
    onStatusChange: StatusCallback
  ): boolean {
    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      return false;
    }

    try {
      this.stopSpeaking();

      const langCode = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
      this.recognition.lang = langCode;

      this.recognition.onstart = () => {
        this.isListening = true;
        onStatusChange(true);
      };

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        onResult(transcript, isFinal);
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        onStatusChange(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onStatusChange(false);
      };

      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('Speech start error:', err);
      this.isListening = false;
      onStatusChange(false);
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
  }

  public speak(text: string, lang: SupportedLanguage, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (this.isMuted) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
      utterance.lang = langCode;
      utterance.rate = 0.95; // Slightly clearer and measured for crowd clarity
      utterance.pitch = 1.0;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice =
        voices.find((v) => v.lang.startsWith(langCode.substring(0, 2))) ||
        voices.find((v) => v.lang.includes('hi') || v.lang.includes('IN')) ||
        voices[0];

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        if (this.onSpeakingChange) this.onSpeakingChange(true);
      };

      utterance.onend = () => {
        if (this.onSpeakingChange) this.onSpeakingChange(false);
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        if (this.onSpeakingChange) this.onSpeakingChange(false);
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (this.onSpeakingChange) this.onSpeakingChange(false);
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (this.onSpeakingChange) this.onSpeakingChange(false);
    this.currentUtterance = null;
  }
}

export const speechService = new SpeechService();
