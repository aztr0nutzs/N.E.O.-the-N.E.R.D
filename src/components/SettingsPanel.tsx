import React, { useState, useEffect } from 'react';
import { useNeural, Persona } from '../context/NeuralContext';
import { Panel } from './Panel';
import { Save, RefreshCw, Volume2 } from 'lucide-react';

const GEMINI_VOICES = [
  'Puck',
  'Charon',
  'Kore',
  'Fenrir',
  'Aoede',
  'Zephyr'
];

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { aiSettings, updateAISettings, setNeuralSurge } = useNeural();
  const [localSettings, setLocalSettings] = useState(aiSettings);
  const [webVoices, setWebVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      setWebVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleSave = () => {
    updateAISettings(localSettings);
    setNeuralSurge(true);
    setTimeout(() => setNeuralSurge(false), 500);
    onClose();
  };

  const handlePersonaVoiceChange = (persona: Persona, voice: string) => {
    setLocalSettings(prev => ({
      ...prev,
      personaVoices: {
        ...prev.personaVoices,
        [persona]: voice
      }
    }));
  };

  const testVoice = (voiceName: string) => {
    if (GEMINI_VOICES.includes(voiceName)) {
      // It's a Gemini voice, we can't easily test it directly here without an API call,
      // but we could just use a generic web voice for preview or skip.
      // For now, we'll try to find a matching web voice to preview, or just use default.
      const utterance = new SpeechSynthesisUtterance(`Testing voice ${voiceName}`);
      window.speechSynthesis.speak(utterance);
    } else {
      const voice = webVoices.find(v => v.voiceURI === voiceName);
      if (voice) {
        const utterance = new SpeechSynthesisUtterance(`Testing voice ${voice.name}`);
        utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar text-white font-mono text-xs">
      
      <div className="space-y-2">
        <h3 className="text-cyber-blue border-b border-cyber-blue/30 pb-1 uppercase tracking-widest">Model Parameters</h3>
        
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 flex justify-between">
            <span>Temperature</span>
            <span className="text-cyber-blue">{localSettings.temperature.toFixed(1)}</span>
          </label>
          <input 
            type="range" min="0" max="2" step="0.1" 
            value={localSettings.temperature}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full accent-cyber-blue"
          />
          <span className="text-[9px] text-gray-500">Higher values make output more random, lower values more deterministic.</span>
        </div>

        <div className="flex flex-col gap-1 mt-3">
          <label className="text-gray-400 flex justify-between">
            <span>Top P</span>
            <span className="text-cyber-blue">{localSettings.topP.toFixed(2)}</span>
          </label>
          <input 
            type="range" min="0" max="1" step="0.05" 
            value={localSettings.topP}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
            className="w-full accent-cyber-blue"
          />
        </div>

        <div className="flex flex-col gap-1 mt-3">
          <label className="text-gray-400 flex justify-between">
            <span>Top K</span>
            <span className="text-cyber-blue">{localSettings.topK}</span>
          </label>
          <input 
            type="range" min="1" max="40" step="1" 
            value={localSettings.topK}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, topK: parseInt(e.target.value) }))}
            className="w-full accent-cyber-blue"
          />
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <h3 className="text-neon-green border-b border-neon-green/30 pb-1 uppercase tracking-widest">Custom Instructions</h3>
        <textarea 
          value={localSettings.customInstructions}
          onChange={(e) => setLocalSettings(prev => ({ ...prev, customInstructions: e.target.value }))}
          placeholder="Append custom instructions to all personas..."
          className="w-full h-24 bg-black/50 border border-white/10 rounded p-2 focus:outline-none focus:border-neon-green/50 resize-none custom-scrollbar"
        />
      </div>

      <div className="space-y-2 mt-4">
        <h3 className="text-fuchsia-500 border-b border-fuchsia-500/30 pb-1 uppercase tracking-widest">Voice Library</h3>
        
        <div className="flex flex-col gap-2">
          <label className="text-gray-400">Default Voice</label>
          <div className="flex gap-2">
            <select 
              value={localSettings.defaultVoice}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultVoice: e.target.value }))}
              className="flex-1 bg-black/50 border border-white/10 rounded p-1 focus:outline-none focus:border-fuchsia-500/50"
            >
              <optgroup label="Gemini High-Fidelity Voices">
                {GEMINI_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
              </optgroup>
              <optgroup label="Local System Voices">
                {webVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
              </optgroup>
            </select>
            <button onClick={() => testVoice(localSettings.defaultVoice)} className="p-1.5 bg-fuchsia-500/20 text-fuchsia-500 rounded hover:bg-fuchsia-500 hover:text-black transition-colors">
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-gray-400">Persona Overrides</label>
          {(['NEO', 'FRIDAY', 'EDITH', 'ULTRON'] as Persona[]).map(persona => (
            <div key={persona} className="flex items-center gap-2">
              <span className="w-16 text-[10px]">{persona}</span>
              <select 
                value={localSettings.personaVoices[persona]}
                onChange={(e) => handlePersonaVoiceChange(persona, e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded p-1 text-[10px] focus:outline-none focus:border-fuchsia-500/50"
              >
                <optgroup label="Gemini High-Fidelity Voices">
                  {GEMINI_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                </optgroup>
                <optgroup label="Local System Voices">
                  {webVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
                </optgroup>
              </select>
              <button onClick={() => testVoice(localSettings.personaVoices[persona])} className="p-1 bg-white/5 text-gray-400 rounded hover:text-white transition-colors">
                <Volume2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 flex gap-2">
        <button 
          onClick={() => setLocalSettings(aiSettings)}
          className="flex-1 py-2 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-400 rounded hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 py-2 flex items-center justify-center gap-2 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue rounded hover:bg-cyber-blue hover:text-black transition-colors shadow-[0_0_15px_rgba(0,255,255,0.2)]"
        >
          <Save className="w-4 h-4" /> Apply Settings
        </button>
      </div>

    </div>
  );
}
