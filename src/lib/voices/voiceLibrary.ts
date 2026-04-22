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
  previewMode: 'server' | 'browser' | 'none';
}

interface BuildVoiceLibraryOptions {
  browserVoices: SpeechSynthesisVoice[];
  canUseServerVoices: boolean;
  canPreviewServerVoices: boolean;
}

export const buildVoiceLibrary = ({
  browserVoices,
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
    previewMode: canPreviewServerVoices ? 'server' : 'none',
  }));

  const browserVoiceEntries: VoiceLibraryEntry[] = browserVoices.map((voice) => ({
    value: voice.voiceURI,
    name: voice.name,
    provider: 'browser',
    type: 'system',
    locale: voice.lang || null,
    descriptor: voice.localService ? 'Local voice' : 'Remote voice',
    availability: 'available',
    availabilityReason: null,
    previewSupported: true,
    previewMode: 'browser',
  }));

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
