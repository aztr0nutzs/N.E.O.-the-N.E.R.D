import { GEMINI_VOICE_CATALOG, VoiceProvider, VoiceType } from './voiceCatalog';

export type VoiceAvailability = 'available' | 'limited' | 'unavailable';

export interface VoiceLibraryEntry {
  /** Stable setting value used by AI settings. Gemini uses voice name; browser uses voiceURI. */
  value: string;
  name: string;
  provider: VoiceProvider;
  type: VoiceType;
  locale: string | null;
  descriptor: string;
  availability: VoiceAvailability;
  availabilityReason: string | null;
  previewSupported: boolean;
  previewUnavailableReason: string | null;
  previewMode: 'server' | 'browser' | 'none';
}

interface BuildVoiceLibraryOptions {
  browserVoices: SpeechSynthesisVoice[];
  hasSpeechSynthesis: boolean;
  canUseServerVoices: boolean;
  canPreviewServerVoices: boolean;
}

export const buildVoiceLibrary = ({
  browserVoices,
  hasSpeechSynthesis,
  canUseServerVoices,
  canPreviewServerVoices,
}: BuildVoiceLibraryOptions): VoiceLibraryEntry[] => {
  const geminiVoices: VoiceLibraryEntry[] = GEMINI_VOICE_CATALOG.map((voice) => ({
    value: voice.name,
    name: voice.name,
    provider: 'gemini',
    type: 'server',
    locale: null,
    descriptor: voice.style,
    availability: canUseServerVoices ? 'available' : 'limited',
    availabilityReason: canUseServerVoices ? null : 'Requires sign-in to use protected server routes.',
    previewSupported: canPreviewServerVoices,
    previewUnavailableReason: canUseServerVoices
      ? 'Enable “Gemini voice preview uses server TTS” to preview this voice.'
      : 'Sign in to preview Gemini voices with protected server routes.',
    previewMode: canPreviewServerVoices ? 'server' : 'none',
  }));

  const browserVoiceEntries: VoiceLibraryEntry[] = browserVoices.map((voice) => {
    const browserAvailability: VoiceAvailability = hasSpeechSynthesis ? 'available' : 'unavailable';
    const browserAvailabilityReason = hasSpeechSynthesis
      ? null
      : 'Browser speech synthesis is unavailable in this environment.';

    return {
      value: voice.voiceURI,
      name: voice.name,
      provider: 'browser',
      type: 'system',
      locale: voice.lang || null,
      descriptor: voice.localService ? 'Local voice' : 'Remote voice',
      availability: browserAvailability,
      availabilityReason: browserAvailabilityReason,
      previewSupported: hasSpeechSynthesis,
      previewUnavailableReason: hasSpeechSynthesis ? null : browserAvailabilityReason,
      previewMode: hasSpeechSynthesis ? 'browser' : 'none',
    };
  });

  return [...geminiVoices, ...browserVoiceEntries].sort((a, b) => {
    if (a.provider !== b.provider) {
      return a.provider.localeCompare(b.provider);
    }
    return a.name.localeCompare(b.name);
  });
};

export const groupVoiceLibraryByProvider = (library: VoiceLibraryEntry[]): Record<VoiceProvider, VoiceLibraryEntry[]> => ({
  gemini: library.filter((voice) => voice.provider === 'gemini'),
  browser: library.filter((voice) => voice.provider === 'browser'),
});
