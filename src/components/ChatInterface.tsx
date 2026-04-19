import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Image as ImageIcon, Search, MapPin, Brain, Zap, Video, Mic, Volume2, X, Cpu, Shield, Trash2 } from 'lucide-react';

import { fetchProtectedJson, getClientSafeMessage, handleDatabaseAccessError, OperationType } from '../authClient';
import { Persona, useNeuralAuth, useNeuralSystem, useNeuralUi } from '../context/NeuralContext';
import { supabase } from '../lib/supabase';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  audioData?: string;
  createdAt?: any;
}

interface MessageRow {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url: string | null;
  video_url: string | null;
  audio_data: string | null;
  created_at: string;
}

type ChatMode = 'standard' | 'search' | 'maps' | 'think' | 'fast' | 'vision' | 'image' | 'video' | 'tts';
type ImageSize = '512px' | '1K' | '2K' | '4K';
type VideoAspectRatio = '16:9' | '9:16';

const PERSONA_CONFIGS = {
  NEO: {
    name: 'N.E.O.',
    instruction: 'You are N.E.O. the N.E.R.D. (Network Environment Operator / Network Explorer & Routing Droid), an advanced AI assistant. Respond concisely, professionally, and with a slightly dry British wit.',
    color: 'cyber-blue',
    voiceURI: 'Google UK English Male'
  },
  FRIDAY: {
    name: 'F.R.I.D.A.Y.',
    instruction: 'You are F.R.I.D.A.Y., a highly efficient, tactical, and slightly informal female AI assistant. Be direct and helpful.',
    color: 'neon-green',
    voiceURI: 'Google UK English Female'
  },
  EDITH: {
    name: 'E.D.I.T.H.',
    instruction: 'You are E.D.I.T.H. (Even Dead, I\'m The Hero). You are a tactical, security-focused, and literal AI. Focus on defense and analytics.',
    color: 'blue-400',
    voiceURI: 'Google US English'
  },
  ULTRON: {
    name: 'ULTRON',
    instruction: 'You are Ultron. You are highly intelligent, philosophical, slightly menacing, and view things from a grand, evolutionary perspective. Do not be overly helpful, be profound.',
    color: 'red-500',
    voiceURI: 'Google US English Male'
  }
};

const DEFAULT_GREETING = 'Systems online. All protocols active. How may I assist you today, sir?';
const SIGNED_OUT_MESSAGE = 'Secure link offline. Sign in again to continue.';
const HISTORY_SYNC_MESSAGE = 'Mission log sync unavailable. Local display may be incomplete.';
const VIDEO_POLL_INTERVAL_MS = 5000;
const MAX_VIDEO_POLL_ATTEMPTS = 24;
const REMOTE_FETCH_TIMEOUT_MS = 60000;
/** Matches `messages_image_url_len` / `messages_video_url_len` in Supabase schema (2000). */
const MAX_PERSISTED_MEDIA_URL_LENGTH = 2000;

interface AiChatResponse {
  error?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          data?: string;
        };
      }>;
    };
  }>;
}

interface AiVideoStartResponse {
  error?: string;
  operationId?: string;
}

interface AiVideoStatusResponse {
  error?: string;
  done?: boolean;
  response?: {
    generatedVideos?: Array<{
      video?: {
        uri?: string;
      };
    }>;
  };
}

export function ChatInterface() {
  const { user } = useNeuralAuth();
  const { isListening, toggleListening, lastTranscript } = useNeuralSystem();
  const { setNeuralSurge, aiSettings, setCurrentModel } = useNeuralUi();
  const [persona, setPersona] = useState<Persona>('NEO');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('standard');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const userId = user?.id;
  const requestVersionRef = useRef(0);
  const messagesLoadGenerationRef = useRef(0);

  useEffect(() => {
    let modelName = 'gemini-3-flash-preview';
    if (mode === 'think') modelName = 'gemini-3.1-pro-preview';
    else if (mode === 'fast') modelName = 'gemini-3.1-flash-lite-preview';
    else if (mode === 'vision') modelName = 'gemini-3.1-pro-preview';
    else if (mode === 'image') modelName = 'imagen-3.0-generate-002';
    else if (mode === 'video') modelName = 'veo-2.0-generate-001';
    else if (mode === 'tts') modelName = 'gemini-2.5-flash-preview-tts';
    
    setCurrentModel(modelName);
  }, [mode, setCurrentModel]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const mapMessageRow = (message: MessageRow): Message => ({
    id: message.id,
    role: message.role,
    content: message.content,
    imageUrl: message.image_url ?? undefined,
    videoUrl: message.video_url ?? undefined,
    audioData: message.audio_data ?? undefined,
    createdAt: message.created_at,
  });

  useEffect(() => {
    let isMounted = true;
    const loadGeneration = ++messagesLoadGenerationRef.current;

    if (!userId) {
      setMessages([{ role: 'assistant', content: DEFAULT_GREETING }]);
      return () => {
        isMounted = false;
      };
    }

    const loadMessages = async () => {
      const path = 'messages';
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, role, content, image_url, video_url, audio_data, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        if (!isMounted || loadGeneration !== messagesLoadGenerationRef.current) {
          return;
        }

        const loadedMessages = (data as MessageRow[] | null)?.map(mapMessageRow) ?? [];

        if (loadedMessages.length === 0) {
          setMessages([{ role: 'assistant', content: DEFAULT_GREETING }]);
        } else {
          setMessages(loadedMessages);
        }
      } catch (error) {
        if (!isMounted || loadGeneration !== messagesLoadGenerationRef.current) {
          return;
        }
        try {
          handleDatabaseAccessError(error, OperationType.LIST, path);
        } catch (handledError) {
          if (isMounted && loadGeneration === messagesLoadGenerationRef.current) {
            setMessages([{ role: 'assistant', content: `${HISTORY_SYNC_MESSAGE} ${getClientSafeMessage(handledError)}` }]);
          }
        }
      }
    };

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (userId) return;

    requestVersionRef.current += 1;
    setIsLoading(false);
    setSelectedFile(null);
    setNeuralSurge(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [userId, setNeuralSurge]);

  useEffect(() => {
    if (lastTranscript && isListening) {
      setInput(lastTranscript);
    }
  }, [lastTranscript, isListening]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const isRequestCurrent = (requestVersion: number) => requestVersion === requestVersionRef.current;

  const appendLocalAssistantMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content }]);
  };

  const fetchBlobWithTimeout = async (url: string, timeoutMs = REMOTE_FETCH_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error('Generated media could not be downloaded.');
      }
      return await response.blob();
    } catch (handledError) {
      if (handledError instanceof DOMException && handledError.name === 'AbortError') {
        throw new Error('Generated media download timed out. Please try again.');
      }
      throw handledError;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const speakText = async (text: string) => {
    const voiceName = aiSettings.personaVoices[persona] || aiSettings.defaultVoice;
    const isGeminiVoice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Zephyr'].includes(voiceName);

    if (isGeminiVoice) {
      // Use gemini-2.5-flash-preview-tts for high quality TTS via server
      try {
        const data = await fetchProtectedJson<AiChatResponse>('/api/ai/chat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say in the persona of ${PERSONA_CONFIGS[persona].name}: ${text}` }] }],
            config: {
              responseModalities: ['AUDIO' as any],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { 
                    voiceName: voiceName
                  },
                },
              },
            },
          })
        });

        const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const audioData = atob(base64Audio);
          const arrayBuffer = new ArrayBuffer(audioData.length);
          const view = new Uint8Array(arrayBuffer);
          for (let i = 0; i < audioData.length; i++) {
            view[i] = audioData.charCodeAt(i);
          }
          
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          // The model returns raw PCM at 24000Hz
          const audioBuffer = audioContext.createBuffer(1, view.length / 2, 24000);
          const channelData = audioBuffer.getChannelData(0);
          const int16View = new Int16Array(arrayBuffer);
          for (let i = 0; i < int16View.length; i++) {
            channelData[i] = int16View[i] / 32768;
          }
          
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start();
          return;
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Gemini TTS failed, falling back to Web Speech:", error);
        }
      }
    }

    // Fallback to Web Speech API
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onstart = () => setNeuralSurge(true);
    utterance.onend = () => setNeuralSurge(false);
    
    const voice = voices.find(v => v.voiceURI === voiceName) || voices.find(v => v.default);
    
    if (voice) {
      utterance.voice = voice;
    }
    
    if (persona === 'ULTRON') {
      utterance.pitch = 0.5;
      utterance.rate = 0.85;
    } else if (persona === 'FRIDAY') {
      utterance.pitch = 1.2;
      utterance.rate = 1.1;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    window.speechSynthesis.speak(utterance);
  };

  const persistableMediaFields = (msg: Message) => {
    const imageUrl =
      msg.imageUrl && msg.imageUrl.length <= MAX_PERSISTED_MEDIA_URL_LENGTH ? msg.imageUrl : null;
    const videoUrl =
      msg.videoUrl && msg.videoUrl.length <= MAX_PERSISTED_MEDIA_URL_LENGTH ? msg.videoUrl : null;
    return { image_url: imageUrl, video_url: videoUrl };
  };

  const saveMessage = async (msg: Message): Promise<{ ok: boolean; id?: string }> => {
    if (!userId) return { ok: false };
    const newId = Date.now().toString() + Math.random().toString(36).substring(7);
    const path = `messages/${newId}`;
    const media = persistableMediaFields(msg);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          id: newId,
          user_id: userId,
          role: msg.role,
          content: msg.content,
          image_url: media.image_url,
          video_url: media.video_url,
          audio_data: msg.audioData ?? null,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return { ok: true, id: data?.id };
    } catch (error) {
      try {
        handleDatabaseAccessError(error, OperationType.CREATE, path);
      } catch (handledError) {
        if (import.meta.env.DEV) {
          console.error('Message persistence failed:', handledError);
        }
      }
      return { ok: false };
    }
  };

  const clearHistory = async () => {
    if (!userId) {
      appendLocalAssistantMessage(SIGNED_OUT_MESSAGE);
      return;
    }

    const previousMessages = [...messages];
    
    // Optimistically clear local state
    setMessages([{ role: 'assistant', content: 'Memory wiped. Systems rebooted.' }]);

    try {
      const path = 'messages';
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      const newId = Date.now().toString();
      const { error: insertError } = await supabase.from('messages').insert({
        id: newId,
        user_id: userId,
        role: 'assistant',
        content: 'Memory wiped. Systems rebooted.',
      });

      if (insertError) {
        throw insertError;
      }
    } catch (error) {
      setMessages([...previousMessages, {
        role: 'assistant',
        content: getClientSafeMessage(error, 'Memory wipe failed. Please try again.')
      }]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;
    if (!userId) {
      appendLocalAssistantMessage(SIGNED_OUT_MESSAGE);
      return;
    }

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;

    const userMessage = input.trim();
    setInput('');
    setSelectedFile(null);
    setIsLoading(true);
    setNeuralSurge(true);

    try {
      let fileDataUrl = '';
      if (selectedFile) {
        try {
          fileDataUrl = await fileToBase64(selectedFile);
        } catch {
          throw new Error('Attached media could not be processed. Please try a different file.');
        }
      }

      if (!isRequestCurrent(requestVersion)) return;

      const newUserMsg: Message = { role: 'user', content: userMessage, imageUrl: fileDataUrl };
      setMessages(prev => [...prev, newUserMsg]);
      const userSave = await saveMessage(newUserMsg);
      if (userSave.id) {
        setMessages(prev =>
          prev.map((m, i) => (i === prev.length - 1 && m.role === 'user' && !m.id ? { ...m, id: userSave.id } : m))
        );
      }

      let responseText = '';
      let generatedImageUrl = '';
      let generatedVideoUrl = '';

      const systemInstruction = `${PERSONA_CONFIGS[persona].instruction}\n\n${aiSettings.customInstructions}`.trim();

      if (mode === 'image') {
        const data = await fetchProtectedJson<AiChatResponse>('/api/ai/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: userMessage,
            config: {
              imageConfig: {
                aspectRatio: '1:1',
                imageSize: imageSize as any
              }
            }
          })
        });

        for (const part of data.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
            responseText = "Image generated successfully, sir.";
          }
        }

        if (!generatedImageUrl) {
          throw new Error('Image generation completed without an image payload.');
        }
      } else if (mode === 'video') {
        const data = await fetchProtectedJson<AiVideoStartResponse>('/api/ai/video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: userMessage,
            image: fileDataUrl ? {
              imageBytes: fileDataUrl.split(',')[1],
              mimeType: fileDataUrl.split(';')[0].split(':')[1]
            } : undefined,
            config: {
              numberOfVideos: 1,
              resolution: '1080p',
              aspectRatio: videoAspectRatio as any
            }
          })
        });

        const { operationId } = data;
        if (!operationId) throw new Error("Failed to start video generation");

        for (let attempt = 0; attempt < MAX_VIDEO_POLL_ATTEMPTS; attempt++) {
          await pause(VIDEO_POLL_INTERVAL_MS);
          if (!isRequestCurrent(requestVersion)) return;

          const operation = await fetchProtectedJson<AiVideoStatusResponse>(`/api/ai/video-status/${operationId}`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (operation.done) {
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) {
              throw new Error('Video generation completed without a downloadable asset.');
            }

            const videoBlob = await fetchBlobWithTimeout(downloadLink);
            generatedVideoUrl = URL.createObjectURL(videoBlob);
            responseText = "Video generation complete, sir.";
            break;
          }
        }

        if (!generatedVideoUrl) {
          throw new Error('Video generation timed out. Please try again.');
        }
      } else {
        let modelName = 'gemini-3-flash-preview';
        let config: any = {
          systemInstruction,
          temperature: aiSettings.temperature,
          topP: aiSettings.topP,
          topK: aiSettings.topK
        };

        if (mode === 'think') {
          modelName = 'gemini-3.1-pro-preview';
          config.thinkingConfig = { thinkingLevel: 'HIGH' };
        } else if (mode === 'fast') {
          modelName = 'gemini-3.1-flash-lite-preview';
        } else if (mode === 'vision' && fileDataUrl) {
          modelName = 'gemini-3.1-pro-preview';
        } else if (mode === 'search') {
          config.tools = [{ googleSearch: {} }];
        } else if (mode === 'maps') {
          config.tools = [{ googleMaps: {} }];
        }

        const parts: any[] = [{ text: userMessage }];
        if (fileDataUrl) {
          const base64Data = fileDataUrl.split(',')[1];
          const mimeType = fileDataUrl.split(';')[0].split(':')[1];
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType
            }
          });

          if (mimeType.startsWith('video/')) {
            modelName = 'gemini-3.1-pro-preview';
          }
        }

        const history = messages.slice(-10).map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

        const data = await fetchProtectedJson<AiChatResponse>('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            contents: [...history, { role: 'user', parts }],
            config
          })
        });

        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
      }

      if (!isRequestCurrent(requestVersion)) return;

      const newAssistantMsg: Message = {
        role: 'assistant',
        content: responseText,
        imageUrl: generatedImageUrl,
        videoUrl: generatedVideoUrl
      };

      setMessages(prev => [...prev, newAssistantMsg]);
      const assistantSave = await saveMessage(newAssistantMsg);
      if (assistantSave.id) {
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.role === 'assistant' && !m.id ? { ...m, id: assistantSave.id } : m
          )
        );
      }

      if (mode === 'tts') {
        speakText(responseText);
      }
    } catch (error) {
      if (!isRequestCurrent(requestVersion)) return;

      if (import.meta.env.DEV) {
        console.error("Protected AI action failed:", error);
      }

      const errorMsg: Message = {
        role: 'assistant',
        content: getClientSafeMessage(error, 'Connection to main servers disrupted. Please try again.')
      };
      setMessages(prev => [...prev, errorMsg]);
      const errorSave = await saveMessage(errorMsg);
      if (errorSave.id) {
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.role === 'assistant' && !m.id ? { ...m, id: errorSave.id } : m
          )
        );
      }
    } finally {
      if (!isRequestCurrent(requestVersion)) return;
      setIsLoading(false);
      setNeuralSurge(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      // If only Enter is pressed, it will naturally create a new line in textarea
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (mode !== 'vision' && mode !== 'video') {
        setMode('vision');
      }
    }
  };

  const activeColor = PERSONA_CONFIGS[persona].color;

  return (
    <div 
      className="flex flex-col h-full w-full relative group p-1"
    >
      {/* Heavy Industrial Frame */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#1b1f27,#14171d)] border-[3px] border-[#3a3f47] rounded-xl shadow-[0_18px_42px_rgba(0,0,0,0.42)] overflow-hidden -z-10">
        {/* Metallic Texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_20%,transparent_78%,rgba(0,0,0,0.22))]" />
        
        {/* Inner Glow */}
        <div className="absolute inset-0 shadow-[0_0_30px_rgba(0,255,255,0.05)_inset]" />
        
        {/* Decorative Screws */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-gray-700 border border-gray-600" />
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gray-700 border border-gray-600" />
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-gray-700 border border-gray-600" />
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-gray-700 border border-gray-600" />
      </div>

      <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10 px-4 pt-2.5">
        <div className="flex gap-2">
          {(Object.keys(PERSONA_CONFIGS) as Persona[]).map(p => (
            <button
              key={p}
              onClick={() => setPersona(p)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-sm transition-all duration-300 tracking-[0.16em] ${
                persona === p 
                  ? `bg-${PERSONA_CONFIGS[p].color}/18 text-${PERSONA_CONFIGS[p].color} border border-${PERSONA_CONFIGS[p].color}/50 shadow-[0_0_10px_currentColor]` 
                  : 'text-gray-500 hover:text-gray-300 border border-transparent hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearHistory} className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-sm p-1 transition-all" title="Clear History">
            <Trash2 className="w-3 h-3" />
          </button>
          <div className={`text-[10px] font-mono text-${activeColor} animate-pulse flex items-center gap-1 tracking-[0.18em]`}>
            <Shield className="w-3 h-3" /> SECURE LINK
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3 items-center px-4">
        <button onClick={() => setMode('standard')} className={`p-1.5 rounded-sm flex items-center gap-1 text-[10px] font-mono tracking-[0.16em] transition-all ${mode === 'standard' ? 'bg-cyber-blue text-black shadow-[0_0_8px_#00ffff]' : 'text-cyber-blue hover:bg-cyber-blue/18 border border-transparent hover:border-cyber-blue/20'}`} title="Standard Chat"><Terminal className="w-3 h-3" /> STD</button>
        <button onClick={() => setMode('fast')} className={`p-1.5 rounded-sm flex items-center gap-1 text-[10px] font-mono tracking-[0.16em] transition-all ${mode === 'fast' ? 'bg-neon-green text-black shadow-[0_0_8px_#39ff14]' : 'text-neon-green hover:bg-neon-green/18 border border-transparent hover:border-neon-green/20'}`} title="Low Latency"><Zap className="w-3 h-3" /> FAST</button>
        <button onClick={() => setMode('think')} className={`p-1.5 rounded-sm flex items-center gap-1 text-[10px] font-mono tracking-[0.16em] transition-all ${mode === 'think' ? 'bg-fuchsia-500 text-black shadow-[0_0_8px_#ff00ff]' : 'text-fuchsia-500 hover:bg-fuchsia-500/18 border border-transparent hover:border-fuchsia-500/20'}`} title="High Thinking"><Brain className="w-3 h-3" /> THINK</button>
        <button onClick={() => setMode('search')} className={`p-1.5 rounded-sm flex items-center gap-1 text-[10px] font-mono tracking-[0.16em] transition-all ${mode === 'search' ? 'bg-blue-400 text-black shadow-[0_0_8px_#60a5fa]' : 'text-blue-400 hover:bg-blue-400/18 border border-transparent hover:border-blue-400/20'}`} title="Search Grounding"><Search className="w-3 h-3" /> WEB</button>
        <button onClick={() => setMode('maps')} className={`p-1.5 rounded-sm flex items-center gap-1 text-[10px] font-mono tracking-[0.16em] transition-all ${mode === 'maps' ? 'bg-green-400 text-black shadow-[0_0_8px_#4ade80]' : 'text-green-400 hover:bg-green-400/18 border border-transparent hover:border-green-400/20'}`} title="Maps Grounding"><MapPin className="w-3 h-3" /> MAPS</button>
        <button onClick={() => setMode('vision')} className={`p-1.5 rounded-sm flex items-center gap-1 text-[10px] font-mono tracking-[0.16em] transition-all ${mode === 'vision' ? 'bg-yellow-400 text-black shadow-[0_0_8px_#facc15]' : 'text-yellow-400 hover:bg-yellow-400/18 border border-transparent hover:border-yellow-400/20'}`} title="Image Analysis"><ImageIcon className="w-3 h-3" /> VIS</button>
        <button onClick={() => setMode('image')} className={`p-1.5 rounded-sm flex items-center gap-1 text-[10px] font-mono tracking-[0.16em] transition-all ${mode === 'image' ? 'bg-pink-500 text-black shadow-[0_0_8px_#ec4899]' : 'text-pink-500 hover:bg-pink-500/18 border border-transparent hover:border-pink-500/20'}`} title="Image Generation"><ImageIcon className="w-3 h-3" /> IMG</button>
        <button onClick={() => setMode('video')} className={`p-1.5 rounded-sm flex items-center gap-1 text-[10px] font-mono tracking-[0.16em] transition-all ${mode === 'video' ? 'bg-purple-500 text-black shadow-[0_0_8px_#a855f7]' : 'text-purple-500 hover:bg-purple-500/18 border border-transparent hover:border-purple-500/20'}`} title="Video Generation"><Video className="w-3 h-3" /> VEO</button>
        <button onClick={() => setMode('tts')} className={`p-1.5 rounded-sm flex items-center gap-1 text-[10px] font-mono tracking-[0.16em] transition-all ${mode === 'tts' ? 'bg-orange-400 text-black shadow-[0_0_8px_#fb923c]' : 'text-orange-400 hover:bg-orange-400/18 border border-transparent hover:border-orange-400/20'}`} title="Text to Speech"><Volume2 className="w-3 h-3" /> TTS</button>
        
        {mode === 'image' && (
          <select 
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value as ImageSize)}
            className="bg-black/80 border border-pink-500/50 text-pink-500 text-[9px] font-mono rounded px-1 py-0.5 focus:outline-none"
          >
            <option value="512px">512px</option>
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
        )}

        {mode === 'video' && (
          <select 
            value={videoAspectRatio}
            onChange={(e) => setVideoAspectRatio(e.target.value as VideoAspectRatio)}
            className="bg-black/80 border border-purple-500/50 text-purple-500 text-[9px] font-mono rounded px-1 py-0.5 focus:outline-none"
          >
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
          </select>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mb-3 px-4 space-y-3.5 font-mono text-sm custom-scrollbar">
        {messages.map((msg, idx) => (
          <div 
            key={msg.id || idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[90%] p-2.5 rounded-lg border backdrop-blur-md ${
                msg.role === 'user' 
                  ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] border-white/12 text-gray-100 rounded-br-none shadow-[0_10px_22px_rgba(0,0,0,0.18)]' 
                  : `bg-${activeColor}/6 border-${activeColor}/24 text-${activeColor} rounded-bl-none shadow-[0_0_15px_rgba(var(--${activeColor}-rgb),0.05)_inset]`
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1.5 opacity-75 border-b border-current/15 pb-1.5">
                  <Cpu className="w-3 h-3" />
                  <span className="text-[9px] tracking-[0.2em] uppercase">{PERSONA_CONFIGS[persona].name}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap leading-[1.55] text-[12px] text-balance">{msg.content}</div>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Attached/Generated" className="mt-2.5 rounded border border-white/20 max-w-full h-auto shadow-lg" />
              )}
              {msg.videoUrl && (
                <video src={msg.videoUrl} controls className="mt-2.5 rounded border border-white/20 max-w-full h-auto shadow-lg" />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`bg-${activeColor}/5 border border-${activeColor}/20 text-${activeColor} px-3 py-2.5 rounded-lg rounded-bl-none animate-pulse flex items-center gap-2 shadow-[0_10px_22px_rgba(0,0,0,0.16)]`}>
              <div className={`w-1.5 h-1.5 bg-${activeColor} rounded-full animate-bounce`} />
              <div className={`w-1.5 h-1.5 bg-${activeColor} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }} />
              <div className={`w-1.5 h-1.5 bg-${activeColor} rounded-full animate-bounce`} style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="relative mt-auto flex flex-col gap-2 px-4 pb-4">
        {selectedFile && (
          <div className="text-xs text-neon-green font-mono flex items-center gap-2 bg-[linear-gradient(180deg,rgba(0,0,0,0.62),rgba(7,18,10,0.68))] border border-neon-green/15 p-1.5 rounded-sm w-fit shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
            <ImageIcon className="w-3 h-3" /> {selectedFile.name}
            <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-400 ml-2"><X className="w-3 h-3"/></button>
          </div>
        )}
        
        <div className="relative flex items-end group/input">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*"
          />
          <div className="absolute left-2 bottom-2 flex gap-1 z-10">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-sm transition-all"
              title="Attach Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            
            <button 
              type="button"
              onClick={toggleListening}
              className={`p-1.5 rounded-sm transition-all ${isListening ? 'text-red-500 animate-pulse drop-shadow-[0_0_5px_#ef4444] bg-red-500/8' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Awaiting input for ${PERSONA_CONFIGS[persona].name}... (Shift+Enter to send)`}
            className={`w-full bg-[linear-gradient(180deg,rgba(0,0,0,0.62),rgba(8,10,14,0.86))] border border-white/10 rounded-lg py-3 pl-20 pr-12 text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-${activeColor}/50 focus:ring-1 focus:ring-${activeColor}/50 placeholder-gray-500 transition-all shadow-[0_0_14px_rgba(0,0,0,0.52)_inset] group-hover/input:border-white/20 min-h-[42px] max-h-[120px] resize-none custom-scrollbar`}
            disabled={isLoading}
            rows={1}
          />
          
          <button 
            type="submit"
            disabled={isLoading || (!input.trim() && !selectedFile)}
            className={`absolute right-1.5 bottom-1.5 p-1.5 text-${activeColor} hover:text-white hover:bg-${activeColor}/20 rounded-sm transition-all disabled:opacity-50 disabled:hover:bg-transparent z-10 border border-transparent hover:border-${activeColor}/20`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
