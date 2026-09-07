import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

class VoiceService {
  static final VoiceService _instance = VoiceService._internal();
  factory VoiceService() => _instance;
  VoiceService._internal();

  final SpeechToText _speechToText = SpeechToText();
  final FlutterTts _flutterTts = FlutterTts();

  bool _isSpeechInitialized = false;
  bool _isListening = false;
  bool _isSpeaking = false;

  bool get isListening => _isListening;
  bool get isSpeaking => _isSpeaking;

  Future<bool> init() => initialize();

  Future<bool> initialize() async {
    // 1. Initialize Flutter TTS independently
    await _initTts();

    // 2. Initialize Speech-to-Text independently so STT permission does not block TTS
    try {
      if (!_isSpeechInitialized) {
        _isSpeechInitialized = await _speechToText.initialize(
          onError: (val) => debugPrint('[VoiceService] STT Error: $val'),
          onStatus: (val) => debugPrint('[VoiceService] STT Status: $val'),
        );
      }
    } catch (e) {
      debugPrint('[VoiceService] STT Initialization error (mic may be restricted): $e');
    }

    return true;
  }

  Future<void> _initTts() async {
    try {
      if (!kIsWeb) {
        await _flutterTts.awaitSynthCompletion(true);
      }
      await _flutterTts.setPitch(1.0);
      await _flutterTts.setSpeechRate(kIsWeb ? 0.9 : 0.48);

      _flutterTts.setStartHandler(() {
        _isSpeaking = true;
      });

      _flutterTts.setCompletionHandler(() {
        _isSpeaking = false;
      });

      _flutterTts.setErrorHandler((msg) {
        _isSpeaking = false;
        debugPrint('[VoiceService] TTS Error: $msg');
      });
    } catch (e) {
      debugPrint('[VoiceService] TTS Init warning: $e');
    }
  }

  /// Starts listening for multilingual speech (Hindi, Marathi, English)
  Future<void> startListening({
    required Function(String recognizedWords, bool isFinal) onResult,
    String? localeId,
  }) async {
    if (!_isSpeechInitialized) {
      await initialize();
    }

    _isListening = true;

    try {
      await _speechToText.listen(
        onResult: (SpeechRecognitionResult result) {
          onResult(result.recognizedWords, result.finalResult);
        },
        listenOptions: SpeechListenOptions(
          listenMode: ListenMode.confirmation,
          cancelOnError: true,
          partialResults: true,
        ),
      );
    } catch (e) {
      debugPrint('[VoiceService] Listen error: $e');
      _isListening = false;
    }
  }

  /// Stops speech listening
  Future<void> stopListening() async {
    _isListening = false;
    await _speechToText.stop();
  }

  /// Dynamically sets TTS locale and speaks the response text in the matching language
  Future<void> speak(String text, {String? languageCode}) async {
    if (text.trim().isEmpty) return;

    // Ensure TTS is initialized
    await _initTts();

    final targetLocale = languageCode ?? detectLocaleFromText(text);

    try {
      await _flutterTts.stop();
      debugPrint('[VoiceService] Speaking with locale: $targetLocale');
      try {
        await _flutterTts.setLanguage(targetLocale);
      } catch (langErr) {
        debugPrint('[VoiceService] setLanguage($targetLocale) fallback: $langErr');
        try {
          await _flutterTts.setLanguage('en-US');
        } catch (_) {}
      }
      await _flutterTts.speak(text);
      _isSpeaking = true;
    } catch (e) {
      debugPrint('[VoiceService] Speak error with locale $targetLocale: $e');
      try {
        await _flutterTts.speak(text);
        _isSpeaking = true;
      } catch (fallbackErr) {
        debugPrint('[VoiceService] Final speak fallback error: $fallbackErr');
      }
    }
  }

  /// Stops TTS speech
  Future<void> stopSpeaking() async {
    _isSpeaking = false;
    await _flutterTts.stop();
  }

  /// Deterministic language detector for setting TTS locale
  static String detectLocaleFromText(String text) {
    final t = text.trim();
    // Check for Devanagari script range (\u0900 - \u097F)
    final hasDevanagari = RegExp(r'[\u0900-\u097F]').hasMatch(t);

    if (!hasDevanagari) {
      // Latin script - check Marathi/Hindi Roman keywords or default English
      final lower = t.toLowerCase();
      if (lower.contains('aahe') || lower.contains('kuthe') || lower.contains('mala') || lower.contains('namaskar')) {
        return 'mr-IN';
      }
      if (lower.contains('hai') || lower.contains('kahan') || lower.contains('mujhe') || lower.contains('namaste')) {
        return 'hi-IN';
      }
      return 'en-IN';
    }

    // In Devanagari, distinguish Marathi from Hindi
    const marathiWords = ['आहे', 'नाही', 'मला', 'कसे', 'कुठे', 'करावे', 'जावे', 'गाडी', 'होते', 'स्नान', 'दर्शन', 'पाहिजे', 'नमस्कार', 'आहोत', 'कधी', 'जायचे', 'आपले', 'नियोजन'];
    const hindiWords = ['है', 'नहीं', 'मुझे', 'कैसे', 'कहाँ', 'करना', 'जाना', 'गाड़ी', 'गाड़ी', 'था', 'थी', 'चाहिए', 'नमस्ते', 'कृपया', 'हैं', 'हूँ', 'आपकी', 'योजना'];

    int mrScore = 0;
    for (final w in marathiWords) {
      if (t.contains(w)) mrScore++;
    }

    int hiScore = 0;
    for (final w in hindiWords) {
      if (t.contains(w)) hiScore++;
    }

    if (mrScore > hiScore) {
      return 'mr-IN';
    }
    return 'hi-IN';
  }
}
