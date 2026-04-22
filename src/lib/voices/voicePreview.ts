import { fetchProtectedJson, getClientSafeMessage } from '../../authClient';
import { VoiceLibraryEntry } from './voiceLibrary';

interface AiChatResponse {
  error?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { data?: string };
      }>;
    };
  }>;
}

export interface VoicePreviewResult {
  ok: boolean;
  message: string;
}

const decodePcm16 = (audioBase64: string): Int16Array => {
  const audioData = atob(audioBase64);
  const arrayBuffer = new ArrayBuffer(audioData.length);
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < audioData.length; i += 1) {
    bytes[i] = audioData.charCodeAt(i);
  }
  return new Int16Array(arrayBuffer);
};

const playPcm16Audio = (pcm16Data: Int16Array) => {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const audioBuffer = audioContext.createBuffer(1, pcm16Data.length, 24000);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < pcm16Data.length; i += 1) {
    channelData[i] = pcm16Data[i] / 32768;
  }

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
};

export const previewVoice = async (voice: VoiceLibraryEntry): Promise<VoicePreviewResult> => {
  if (!voice.previewSupported) {
    return {
      ok: false,
      message: voice.previewUnavailableReason ?? voice.availabilityReason ?? 'Preview unavailable for this voice in current environment.',
    };
  }

  if (voice.previewMode === 'server') {
    try {
      const data = await fetchProtectedJson<AiChatResponse>('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: `Say in a neutral tone: Voice check. This is ${voice.name}.` }] }],
          config: {
            responseModalities: ['AUDIO' as const],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice.value },
              },
            },
          },
        }),
      });

      const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return { ok: false, message: 'Server returned no audio for this preview.' };
      }

      const pcm16Data = decodePcm16(base64Audio);
      playPcm16Audio(pcm16Data);
      return { ok: true, message: 'Playing Gemini TTS preview from server.' };
    } catch (error) {
      return { ok: false, message: getClientSafeMessage(error, 'Preview failed. Check sign-in and network.') };
    }
  }

  if (voice.previewMode === 'browser') {
    if (!window.speechSynthesis) {
      return { ok: false, message: 'Browser speech synthesis is unavailable on this device.' };
    }

    const availableVoice = window.speechSynthesis.getVoices().find((item) => item.voiceURI === voice.value);
    if (!availableVoice) {
      return { ok: false, message: 'Voice not found in this browser.' };
    }

    const utterance = new SpeechSynthesisUtterance(`Testing local voice ${availableVoice.name}`);
    utterance.voice = availableVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return { ok: true, message: 'Playing local Web Speech voice.' };
  }

  return { ok: false, message: 'Preview unavailable for this voice.' };
};
