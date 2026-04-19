import React, { useState, useEffect, useCallback } from 'react';
import { Persona, useNeuralAuth, useNeuralUi } from '../context/NeuralContext';
import { fetchProtectedJson, getClientSafeMessage } from '../authClient';
import { Save, RefreshCw, Volume2, AlertTriangle, Info } from 'lucide-react';

const GEMINI_VOICES = [
  'Puck',
  'Charon',
  'Kore',
  'Fenrir',
  'Aoede',
  'Zephyr'
];

interface AiChatResponse {
  error?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: { data?: string };
      }>;
    };
  }>;
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { user } = useNeuralAuth();
  const {
    aiSettings,
    updateAISettings,
    hudSettings,
    updateHudSettings,
    effectiveHudMotionScale,
    setNeuralSurge,
  } = useNeuralUi();

  const [localAiSettings, setLocalAiSettings] = useState(aiSettings);
  const [localHudSettings, setLocalHudSettings] = useState(hudSettings);
  const [webVoices, setWebVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [geminiPreviewLoading, setGeminiPreviewLoading] = useState(false);

  useEffect(() => {
    setLocalAiSettings(aiSettings);
    setLocalHudSettings(hudSettings);
  }, [aiSettings, hudSettings]);

  useEffect(() => {
    const loadVoices = () => {
      setWebVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const showVoiceNote = useCallback((msg: string) => {
    setVoiceNote(msg);
    window.setTimeout(() => setVoiceNote(null), 5000);
  }, []);

  const playGeminiPreviewFromApi = useCallback(async (voiceName: string) => {
    setGeminiPreviewLoading(true);
    try {
      const data = await fetchProtectedJson<AiChatResponse>('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: `Say in a neutral tone: Voice check. This is ${voiceName}.` }] }],
          config: {
            responseModalities: ['AUDIO' as const],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        }),
      });

      const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        showVoiceNote('Server returned no audio for this preview.');
        return;
      }

      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i += 1) {
        view[i] = audioData.charCodeAt(i);
      }

      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffer = audioContext.createBuffer(1, view.length / 2, 24000);
      const channelData = audioBuffer.getChannelData(0);
      const int16View = new Int16Array(arrayBuffer);
      for (let i = 0; i < int16View.length; i += 1) {
        channelData[i] = int16View[i] / 32768;
      }
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      showVoiceNote('Playing Gemini TTS preview from server.');
    } catch (error) {
      showVoiceNote(getClientSafeMessage(error, 'Preview failed. Check sign-in and network.'));
    } finally {
      setGeminiPreviewLoading(false);
    }
  }, [showVoiceNote]);

  const handleSave = () => {
    updateAISettings(localAiSettings);
    updateHudSettings(localHudSettings);
    setNeuralSurge(true);
    window.setTimeout(() => setNeuralSurge(false), 500);
    onClose();
  };

  const handlePersonaVoiceChange = (persona: Persona, voice: string) => {
    setLocalAiSettings(prev => ({
      ...prev,
      personaVoices: {
        ...prev.personaVoices,
        [persona]: voice,
      },
    }));
  };

  const testVoice = (voiceName: string) => {
    if (GEMINI_VOICES.includes(voiceName)) {
      if (user && localHudSettings.geminiVoicePreviewUsesApi) {
        void playGeminiPreviewFromApi(voiceName);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(`Browser preview only — not ${voiceName} model voice.`);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      if (!user) {
        showVoiceNote('Sign in to run a real Gemini voice preview via the server.');
      } else {
        showVoiceNote('API preview disabled — turn on “Gemini voice preview uses server” below.');
      }
      return;
    }

    const voice = webVoices.find(v => v.voiceURI === voiceName);
    if (voice) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Testing local voice ${voice.name}`);
      utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
      showVoiceNote('Playing local Web Speech voice.');
    } else {
      showVoiceNote('Voice not found in this browser.');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar text-white font-mono text-xs">
      <div className="rounded border border-cyber-blue/25 bg-cyber-blue/5 px-3 py-2.5 flex gap-2 text-[10px] text-cyan-100/90 leading-relaxed">
        <Info className="w-4 h-4 shrink-0 text-cyber-blue mt-0.5" />
        <div>
          <span className="text-cyber-blue font-bold uppercase tracking-[0.14em]">Persistence</span>
          {' '}
          All settings on this screen are stored in <span className="text-white/90">localStorage</span> on this device
          (<span className="text-white/80">aiSettings</span>, <span className="text-white/80">neoHudSettings</span>). They are not synced to Supabase.
          Right-rail load bars remain decorative (not OS telemetry).
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-cyber-blue border-b border-cyber-blue/30 pb-1 uppercase tracking-widest">Assistant behavior</h3>
        <p className="text-[9px] text-gray-500 leading-relaxed">
          Used for protected AI chat requests (temperature, topP, topK) and appended to persona instructions.
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-gray-400 flex justify-between">
            <span>Temperature</span>
            <span className="text-cyber-blue">{localAiSettings.temperature.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={localAiSettings.temperature}
            onChange={(e) => setLocalAiSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full accent-cyber-blue"
          />
          <span className="text-[9px] text-gray-500">Higher values make output more random, lower values more deterministic.</span>
        </div>

        <div className="flex flex-col gap-1 mt-3">
          <label className="text-gray-400 flex justify-between">
            <span>Top P</span>
            <span className="text-cyber-blue">{localAiSettings.topP.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localAiSettings.topP}
            onChange={(e) => setLocalAiSettings(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
            className="w-full accent-cyber-blue"
          />
        </div>

        <div className="flex flex-col gap-1 mt-3">
          <label className="text-gray-400 flex justify-between">
            <span>Top K</span>
            <span className="text-cyber-blue">{localAiSettings.topK}</span>
          </label>
          <input
            type="range"
            min="1"
            max="40"
            step="1"
            value={localAiSettings.topK}
            onChange={(e) => setLocalAiSettings(prev => ({ ...prev, topK: parseInt(e.target.value, 10) }))}
            className="w-full accent-cyber-blue"
          />
        </div>
      </div>

      <div className="space-y-2 mt-2">
        <h3 className="text-neon-green border-b border-neon-green/30 pb-1 uppercase tracking-widest">Custom instructions</h3>
        <textarea
          value={localAiSettings.customInstructions}
          onChange={(e) => setLocalAiSettings(prev => ({ ...prev, customInstructions: e.target.value }))}
          placeholder="Append custom instructions to all personas..."
          className="w-full h-24 bg-black/50 border border-white/10 rounded p-2 focus:outline-none focus:border-neon-green/50 resize-none custom-scrollbar"
        />
      </div>

      <div className="space-y-2 mt-2">
        <h3 className="text-bio-orange border-b border-bio-orange/30 pb-1 uppercase tracking-widest">Scan &amp; overlay</h3>
        <p className="text-[9px] text-gray-500 leading-relaxed">
          Optional full-frame CRT-style scan overlay on the phone shell (decorative only — not camera output).
        </p>
        <label className="text-gray-400 flex justify-between items-center gap-2">
          <span>CRT overlay</span>
          <select
            value={localHudSettings.shellCrtOverlay}
            onChange={(e) =>
              setLocalHudSettings(prev => ({ ...prev, shellCrtOverlay: parseInt(e.target.value, 10) as 0 | 1 }))
            }
            className="flex-1 max-w-[140px] bg-black/50 border border-white/10 rounded p-1 focus:outline-none focus:border-bio-orange/50"
          >
            <option value={0}>Off</option>
            <option value={1}>On</option>
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 flex justify-between">
            <span>Overlay strength</span>
            <span className="text-bio-orange">{localHudSettings.crtOverlayOpacity.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0.12"
            max="0.55"
            step="0.01"
            value={localHudSettings.crtOverlayOpacity}
            onChange={(e) =>
              setLocalHudSettings(prev => ({ ...prev, crtOverlayOpacity: parseFloat(e.target.value) }))
            }
            className="w-full accent-bio-orange"
          />
        </div>
      </div>

      <div className="space-y-2 mt-2">
        <h3 className="text-cyber-blue border-b border-cyber-blue/30 pb-1 uppercase tracking-widest">Motion &amp; density</h3>
        <p className="text-[9px] text-gray-500 leading-relaxed">
          Calms hotspot halos, modal springs, and neural aura pulse on this device. Robot frame motion is unchanged.
        </p>
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 flex justify-between">
            <span>Shell motion intensity</span>
            <span className="text-cyber-blue">{localHudSettings.motionIntensity.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localHudSettings.motionIntensity}
            onChange={(e) =>
              setLocalHudSettings(prev => ({ ...prev, motionIntensity: parseFloat(e.target.value) }))
            }
            className="w-full accent-cyber-blue"
          />
          <span className="text-[9px] text-gray-500">
            Effective scale now: <span className="text-cyber-blue">{effectiveHudMotionScale.toFixed(2)}</span>
            {localHudSettings.respectOsReducedMotion &&
              typeof window !== 'undefined' &&
              window.matchMedia?.('(prefers-reduced-motion: reduce)').matches &&
              ' (OS prefers reduced motion — intensity forced to 0)'}
          </span>
        </div>
        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={localHudSettings.respectOsReducedMotion}
            onChange={(e) =>
              setLocalHudSettings(prev => ({ ...prev, respectOsReducedMotion: e.target.checked }))
            }
            className="rounded border-cyber-blue/40 text-cyber-blue focus:ring-cyber-blue/30"
          />
          <span>Respect OS “reduce motion”</span>
        </label>
      </div>

      <div className="space-y-2 mt-2">
        <h3 className="text-fuchsia-500 border-b border-fuchsia-500/30 pb-1 uppercase tracking-widest">Voice library</h3>
        <label className="flex items-start gap-2 text-[10px] text-gray-400 cursor-pointer leading-snug">
          <input
            type="checkbox"
            checked={localHudSettings.geminiVoicePreviewUsesApi}
            onChange={(e) =>
              setLocalHudSettings(prev => ({ ...prev, geminiVoicePreviewUsesApi: e.target.checked }))
            }
            className="mt-0.5 rounded border-fuchsia-500/40 text-fuchsia-500 focus:ring-fuchsia-500/30"
          />
          <span>
            Gemini voice preview uses server TTS (real preview when signed in; uses a short protected{' '}
            <code className="text-gray-300">/api/ai/chat</code> call).
          </span>
        </label>
        {voiceNote && (
          <div className="text-[10px] text-neon-green/90 border border-neon-green/20 bg-neon-green/5 px-2 py-1.5 rounded">
            {voiceNote}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-gray-400">Default voice</label>
          <div className="flex gap-2">
            <select
              value={localAiSettings.defaultVoice}
              onChange={(e) => setLocalAiSettings(prev => ({ ...prev, defaultVoice: e.target.value }))}
              className="flex-1 bg-black/50 border border-white/10 rounded p-1 focus:outline-none focus:border-fuchsia-500/50"
            >
              <optgroup label="Gemini high-fidelity voices">
                {GEMINI_VOICES.map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Local system voices">
                {webVoices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <button
              type="button"
              disabled={geminiPreviewLoading}
              onClick={() => testVoice(localAiSettings.defaultVoice)}
              className="p-1.5 bg-fuchsia-500/20 text-fuchsia-500 rounded hover:bg-fuchsia-500 hover:text-black transition-colors disabled:opacity-40"
              title="Test voice"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-gray-400">Persona overrides</label>
          {(['NEO', 'FRIDAY', 'EDITH', 'ULTRON'] as Persona[]).map(persona => (
            <div key={persona} className="flex items-center gap-2">
              <span className="w-16 text-[10px]">{persona}</span>
              <select
                value={localAiSettings.personaVoices[persona]}
                onChange={(e) => handlePersonaVoiceChange(persona, e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded p-1 text-[10px] focus:outline-none focus:border-fuchsia-500/50"
              >
                <optgroup label="Gemini high-fidelity voices">
                  {GEMINI_VOICES.map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Local system voices">
                  {webVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <button
                type="button"
                disabled={geminiPreviewLoading}
                onClick={() => testVoice(localAiSettings.personaVoices[persona])}
                className="p-1 bg-white/5 text-gray-400 rounded hover:text-white transition-colors disabled:opacity-40"
                title="Test voice"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 mt-4 rounded border border-orange-500/25 bg-orange-500/5 p-3">
        <h3 className="text-orange-400 border-b border-orange-500/30 pb-1 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          Not available in this build
        </h3>
        <ul className="list-disc pl-4 space-y-1.5 text-[10px] text-gray-400 leading-relaxed">
          <li>
            <span className="text-gray-300">Push / desktop notifications</span> — no notification permission or
            scheduling is implemented; the app does not register a service worker for alerts.
          </li>
          <li>
            <span className="text-gray-300">Thermal / performance governor</span> — no device thermal API or CPU
            throttling controls are wired; browser cannot expose real hardware thermal state here.
          </li>
          <li>
            <span className="text-gray-300">Network tool defaults</span> — search/maps tools are chosen per message in
            chat modes, not via a persisted “default network tool” setting.
          </li>
        </ul>
      </div>

      <div className="mt-auto pt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setLocalAiSettings(aiSettings);
            setLocalHudSettings(hudSettings);
          }}
          className="flex-1 py-2 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-400 rounded hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-2 flex items-center justify-center gap-2 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue rounded hover:bg-cyber-blue hover:text-black transition-colors shadow-[0_0_15px_rgba(0,255,255,0.2)]"
        >
          <Save className="w-4 h-4" /> Apply settings
        </button>
      </div>
    </div>
  );
}
