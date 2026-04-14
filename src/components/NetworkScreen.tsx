import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wifi, Battery, Power, Activity, AlertTriangle, Settings, Radio, X } from 'lucide-react';

export function NetworkScreen({ onClose }: { onClose: () => void }) {
  const [cpuLoad, setCpuLoad] = useState(75);
  const [cpuTemp, setCpuTemp] = useState(55);
  const [ramUsed, setRamUsed] = useState(12);
  const [netDown, setNetDown] = useState(150);
  const [netUp, setNetUp] = useState(25);
  const [turboMode, setTurboMode] = useState(false);
  const [netHistory, setNetHistory] = useState<number[]>(Array(20).fill(25));
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(prev => Math.max(10, Math.min(100, prev + (Math.random() * 10 - 5))));
      setCpuTemp(prev => Math.max(30, Math.min(90, prev + (Math.random() * 4 - 2))));
      setRamUsed(prev => Math.max(4, Math.min(24, prev + (Math.random() * 2 - 1))));
      
      const newDown = Math.max(10, Math.min(1000, netDown + (Math.random() * 100 - 50)));
      setNetDown(newDown);
      setNetUp(prev => Math.max(5, Math.min(200, prev + (Math.random() * 20 - 10))));
      setLatency(prev => Math.max(2, Math.min(100, prev + (Math.random() * 4 - 2))));
      
      setNetHistory(prev => {
        const newHistory = [...prev.slice(1), newDown];
        return newHistory;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [netDown]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center p-4 overflow-y-auto custom-scrollbar"
    >
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 border border-gray-700 rounded-full text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full max-w-2xl flex flex-col items-center gap-6 mt-8 relative z-10 pb-20">
        <TopBar />
        <div className="flex w-full gap-6 justify-center items-center">
          <CenterWidget />
        </div>
        <div className="flex w-full gap-3 flex-col md:flex-row">
          <SystemMonitor cpuLoad={cpuLoad} cpuTemp={cpuTemp} ramUsed={ramUsed} />
          <DetailedMonitor cpuLoad={cpuLoad} cpuTemp={cpuTemp} ramUsed={ramUsed} netDown={netDown} netUp={netUp} turboMode={turboMode} setTurboMode={setTurboMode} netHistory={netHistory} latency={latency} />
        </div>
        <RouterControlPanel />
      </div>
    </motion.div>
  );
}

function TopBar() {
  return (
    <div className="w-full relative bg-[#1a1c23] border-2 border-[#2a2d35] rounded-lg p-2 shadow-2xl">
      {/* Screws */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gray-600 border border-gray-800" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gray-600 border border-gray-800" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-gray-600 border border-gray-800" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-gray-600 border border-gray-800" />

      <div className="flex justify-between items-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 aspect-[1/1.5] border-2 border-blue-500/50 rounded-md relative flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.2)_inset] bg-black/40">
            {/* Corner accents */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-blue-400" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-blue-400" />
            
            {i === 2 && <Wifi className="w-5 h-5 text-green-500 drop-shadow-[0_0_8px_#22c55e]" />}
            {i === 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center relative">
                <div className="w-4 h-4 rounded-full border border-blue-400 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
                </div>
                {/* Radar sweep */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-t-2 border-blue-300"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            )}
            {i === 4 && <Battery className="w-5 h-5 text-red-500 drop-shadow-[0_0_8px_#ef4444]" />}
          </div>
        ))}
      </div>
      
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#1a1c23] border-b-2 border-l-2 border-r-2 border-[#2a2d35] px-4 py-0.5 rounded-b-md text-[8px] font-mono text-gray-400 tracking-widest whitespace-nowrap">
        NERD LAUNCHER
      </div>
    </div>
  );
}

function CenterWidget() {
  return (
    <div className="relative w-72 h-72 flex items-center justify-center">
      {/* Outer Casing */}
      <div className="absolute inset-0 rounded-full bg-[#1a1c23] border-4 border-[#2a2d35] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
        {/* Screws and details */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <div key={deg} className="absolute w-full h-full flex justify-center" style={{ transform: `rotate(${deg}deg)` }}>
            <div className="w-3 h-3 mt-2 rounded-full bg-gray-700 border-2 border-gray-900 shadow-inner" />
          </div>
        ))}
        
        {/* Outer Cyan Ring */}
        <div className="absolute inset-4 rounded-full border-4 border-cyan-400/80 shadow-[0_0_15px_#22d3ee,inset_0_0_15px_#22d3ee]" />
        
        {/* Inner Dark Ring with Gears */}
        <div className="absolute inset-8 rounded-full bg-[#111] border-2 border-gray-700 overflow-hidden flex items-center justify-center">
           {/* Simulated Gears */}
           <motion.div 
             className="absolute w-full h-full opacity-30"
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           >
             {[...Array(12)].map((_, i) => (
               <div key={i} className="absolute top-0 left-1/2 w-4 h-full -ml-2" style={{ transform: `rotate(${i * 30}deg)` }}>
                 <div className="w-full h-4 bg-gray-500 rounded-sm" />
               </div>
             ))}
           </motion.div>

           {/* Inner Cyan Dashed Ring */}
           <motion.div 
             className="absolute inset-6 rounded-full border-[6px] border-dashed border-cyan-400/60"
             animate={{ rotate: -360 }}
             transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
           />

           {/* Center Core */}
           <div className="absolute inset-12 rounded-full bg-gradient-to-br from-cyan-900 to-purple-900 border-4 border-cyan-300 shadow-[0_0_20px_#22d3ee] flex flex-col items-center justify-center">
             <div className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-cyan-500 drop-shadow-[0_0_10px_#22d3ee]" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.8)' }}>
               N
             </div>
           </div>
        </div>

        {/* Bottom Text Panel */}
        <div className="absolute bottom-6 flex flex-col items-center bg-[#1a1c23]/80 backdrop-blur-sm px-4 py-1 rounded-full border border-cyan-500/30">
          <div className="text-2xl font-mono font-bold text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]">26</div>
          <div className="text-[7px] font-mono text-cyan-400 tracking-widest uppercase">System Launcher: Active</div>
        </div>

        {/* Top Text */}
        <div className="absolute top-5 text-[10px] font-mono font-bold text-gray-300 tracking-widest bg-[#1a1c23]/80 px-3 py-0.5 rounded-full">
          NERD LAUNCHER
        </div>

        {/* Side Icons */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-green-500/50 flex items-center justify-center bg-black/80 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
          <Settings className="w-4 h-4 text-green-500" />
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-yellow-500/50 flex items-center justify-center bg-black/80 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
          <span className="text-[10px] font-bold text-yellow-500">AI</span>
        </div>
      </div>
    </div>
  );
}

function SystemMonitor({ cpuLoad, cpuTemp, ramUsed }: any) {
  const cpuRadius = 28;
  const cpuCircumference = 2 * Math.PI * cpuRadius;
  const cpuOffset = cpuCircumference - (cpuLoad / 100) * cpuCircumference;

  const ramRadius = 28;
  const ramCircumference = 2 * Math.PI * ramRadius;
  const ramOffset = ramCircumference - ((ramUsed / 24) * ramCircumference);

  return (
    <div className="flex-1 bg-[#1a1c23] border border-[#2a2d35] rounded-lg p-3 relative shadow-xl flex flex-col min-w-[180px]">
      <div className="text-center mb-3">
        <div className="text-[10px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-purple-500">NERD LAUNCHER</div>
        <div className="text-[8px] font-mono text-cyan-400 tracking-widest">SYSTEM MONITOR</div>
      </div>

      {/* Venn Diagram Gauges */}
      <div className="relative h-24 flex items-center justify-center mb-4">
        {/* CPU Circle */}
        <div className="absolute left-2 w-[72px] h-[72px] rounded-full border-2 border-cyan-400/20 flex flex-col items-center justify-center bg-[#111]/90 backdrop-blur-md z-10 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="36" cy="36" r={cpuRadius} fill="none" stroke="#22d3ee" strokeWidth="3" strokeDasharray={cpuCircumference} strokeDashoffset={cpuOffset} className="transition-all duration-1000" />
          </svg>
          <span className="text-[7px] text-gray-400 font-mono mt-1">CPU</span>
          <span className="text-sm font-bold text-white leading-none">{Math.round(cpuLoad)}%</span>
          <span className="text-[5px] text-cyan-400 font-mono mt-1">{Math.round(cpuTemp)}°C / 3.8 GHz</span>
        </div>

        {/* RAM Circle */}
        <div className="absolute right-2 w-[72px] h-[72px] rounded-full border-2 border-red-500/20 flex flex-col items-center justify-center bg-[#111]/90 backdrop-blur-md z-0 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="36" cy="36" r={ramRadius} fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray={ramCircumference} strokeDashoffset={ramOffset} className="transition-all duration-1000" />
          </svg>
          <span className="text-[7px] text-gray-400 font-mono mt-1">RAM</span>
          <span className="text-sm font-bold text-white leading-none">{Math.round((ramUsed/24)*100)}%</span>
          <span className="text-[5px] text-orange-400 font-mono mt-1">{ramUsed.toFixed(1)} GB / 24 GB</span>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex justify-between items-end mt-auto">
        <div className="flex gap-1.5">
          <div className="w-7 h-9 bg-black border border-cyan-500/50 rounded flex flex-col items-center justify-center shadow-[0_0_5px_rgba(34,211,238,0.2)]">
            <Power className="w-3 h-3 text-cyan-400" />
            <span className="text-[5px] text-cyan-400 mt-1 font-mono">PWR</span>
          </div>
          <div className="w-7 h-9 bg-black border border-purple-500/50 rounded flex flex-col items-center justify-center shadow-[0_0_5px_rgba(168,85,247,0.2)]">
            <Activity className="w-3 h-3 text-purple-400" />
            <span className="text-[5px] text-purple-400 mt-1 font-mono">NET</span>
          </div>
          <div className="w-7 h-9 bg-black border border-yellow-500/50 rounded flex flex-col items-center justify-center shadow-[0_0_5px_rgba(234,179,8,0.2)]">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <span className="text-[5px] text-yellow-400 mt-1 font-mono">TEMP</span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-gray-600 shadow-[0_2px_5px_rgba(0,0,0,0.5)] relative flex items-center justify-center">
           <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700" />
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-2 bg-orange-500 rounded-full shadow-[0_0_5px_#f97316]" />
        </div>
      </div>
    </div>
  );
}

function DetailedMonitor({ cpuLoad, cpuTemp, ramUsed, netDown, netUp, turboMode, setTurboMode, netHistory, latency }: any) {
  const cpuRadius = 14;
  const cpuCircumference = 2 * Math.PI * cpuRadius;
  const cpuOffset = cpuCircumference - (cpuLoad / 100) * cpuCircumference;

  // Generate SVG polyline points from history
  const maxNet = Math.max(...netHistory, 100);
  const points = netHistory.map((val: number, i: number) => {
    const x = (i / (netHistory.length - 1)) * 100;
    const y = 30 - ((val / maxNet) * 30);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex-1 bg-[#1a1c23] border border-[#2a2d35] rounded-lg p-3 relative shadow-xl flex flex-col font-mono min-w-[180px]">
      <div className="text-center mb-3">
        <div className="text-[8px] text-gray-300 tracking-widest border-b border-gray-700 pb-1 inline-block px-4">NERD LAUNCHER</div>
      </div>

      {/* CPU Section */}
      <div className="mb-3">
        <div className="text-[6px] text-gray-400 mb-1">CPU</div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span className="text-[4px] text-blue-400 whitespace-nowrap">TURBO MODE</span>
            <button onClick={() => setTurboMode(!turboMode)} className={`w-6 h-3 rounded-full mt-0.5 relative transition-colors ${turboMode ? 'bg-blue-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${turboMode ? 'left-3.5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="w-9 h-9 rounded-full border-2 border-blue-400/30 flex flex-col items-center justify-center relative bg-black/50">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="16" cy="16" r={cpuRadius} fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray={cpuCircumference} strokeDashoffset={cpuOffset} className="transition-all duration-1000" />
            </svg>
            <span className="text-[4px] text-white">TEMP: {Math.round(cpuTemp)}°C</span>
            <span className="text-[4px] text-white">LOAD: {Math.round(cpuLoad)}%</span>
          </div>
          <div className="flex-1 h-3 bg-black border border-pink-500/50 rounded flex overflow-hidden p-0.5 gap-0.5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className={`flex-1 rounded-sm ${i < (cpuLoad / 10) ? 'bg-pink-500 shadow-[0_0_5px_#ec4899]' : 'bg-gray-800'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* RAM Section */}
      <div className="mb-3 border-t border-gray-800 pt-2">
        <div className="flex justify-between text-[6px] text-gray-400 mb-1">
          <span>RAM</span>
          <span>RAM</span>
        </div>
        <div className="flex items-end gap-2 h-10">
          <div className="flex flex-col gap-[1px] h-full justify-end">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`w-3 h-1 rounded-sm ${i >= 8 - (ramUsed / 3) ? 'bg-orange-500 shadow-[0_0_3px_#f97316]' : 'bg-gray-800'}`} />
            ))}
            <span className="text-[4px] text-orange-500 mt-1 text-center leading-tight">USED<br/>{ramUsed.toFixed(0)}GB</span>
          </div>
          <div className="flex flex-col gap-[1px] h-full justify-end">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`w-3 h-1 rounded-sm ${i >= 8 - ((24 - ramUsed) / 3) ? 'bg-orange-500 shadow-[0_0_3px_#f97316]' : 'bg-gray-800'}`} />
            ))}
            <span className="text-[4px] text-orange-500 mt-1 text-center leading-tight">FREE<br/>{(24 - ramUsed).toFixed(0)}GB</span>
          </div>
          
          <div className="flex-1 ml-2 flex flex-col justify-end h-full pb-1">
            <div className="text-[4px] text-orange-500 text-center mb-1">ALLOCATION</div>
            <div className="w-full h-3 bg-black border border-orange-500/50 rounded flex overflow-hidden p-0.5 gap-0.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`flex-1 rounded-sm ${i < (ramUsed / 4) ? 'bg-orange-500 shadow-[0_0_5px_#f97316]' : 'bg-gray-800'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NETWORK Section */}
      <div className="border-t border-gray-800 pt-2 mt-auto">
        <div className="text-[6px] text-gray-400 mb-1 flex justify-between">
          <span>NETWORK</span>
          <span>PING: {Math.round(latency)}ms</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border border-green-500/50 flex flex-col items-center justify-center relative bg-black/50">
            <Radio className="w-3 h-3 text-green-500 mb-0.5" />
            <span className="text-[3px] text-green-500">DOWN: {Math.round(netDown)}</span>
            <span className="text-[3px] text-green-500">UP: {Math.round(netUp)}</span>
            <motion.div className="absolute inset-0 rounded-full border border-green-400" animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <div className="flex-1 h-7 bg-black/50 border border-green-500/30 rounded relative overflow-hidden">
            {/* Dynamic line graph */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
              <polyline points={points} fill="none" stroke="#22c55e" strokeWidth="1" className="drop-shadow-[0_0_2px_#22c55e] transition-all duration-300" />
            </svg>
          </div>
          <div className="w-6 h-6 border border-green-500/50 rounded flex flex-col items-center justify-center bg-green-500/10 shadow-[0_0_5px_rgba(34,197,94,0.2)]">
            <div className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_5px_#22c55e]" />
            <span className="text-[3px] text-green-500 mt-0.5">VRACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RouterControlPanel() {
  const [ssid, setSsid] = useState('NERD_NET_5G');
  const [password, setPassword] = useState('********');
  const [security, setSecurity] = useState('WPA3-Personal');
  const [channel, setChannel] = useState('Auto');
  const [isRebooting, setIsRebooting] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'wireless' | 'devices'>('status');

  const devices = [
    { id: '1', name: 'Nerd-PC', ip: '192.168.1.10', mac: '00:1A:2B:3C:4D:5E', type: 'Desktop', status: 'Active' },
    { id: '2', name: 'Neural-Link', ip: '192.168.1.15', mac: 'A1:B2:C3:D4:E5:F6', type: 'IoT', status: 'Active' },
    { id: '3', name: 'Mobile-Comm', ip: '192.168.1.20', mac: '11:22:33:44:55:66', type: 'Mobile', status: 'Idle' },
  ];

  const handleReboot = () => {
    setIsRebooting(true);
    setTimeout(() => setIsRebooting(false), 5000);
  };

  return (
    <div className="w-full bg-[#1a1c23] border border-[#2a2d35] rounded-lg p-4 shadow-xl font-mono">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-cyan-400 tracking-widest">ROUTER CONTROL</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('status')} className={`text-[10px] px-2 py-1 rounded ${activeTab === 'status' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-500 hover:text-gray-300'}`}>STATUS</button>
          <button onClick={() => setActiveTab('wireless')} className={`text-[10px] px-2 py-1 rounded ${activeTab === 'wireless' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-500 hover:text-gray-300'}`}>WIRELESS</button>
          <button onClick={() => setActiveTab('devices')} className={`text-[10px] px-2 py-1 rounded ${activeTab === 'devices' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-500 hover:text-gray-300'}`}>DEVICES</button>
        </div>
      </div>

      <div className="min-h-[150px]">
        {activeTab === 'status' && (
          <div className="grid grid-cols-2 gap-4 text-[10px]">
            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-800 pb-1">
                <span className="text-gray-500">WAN IP</span>
                <span className="text-green-400">203.0.113.42</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-1">
                <span className="text-gray-500">LAN IP</span>
                <span className="text-gray-300">192.168.1.1</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-1">
                <span className="text-gray-500">MAC Address</span>
                <span className="text-gray-300">00:14:22:01:23:45</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-800 pb-1">
                <span className="text-gray-500">Uptime</span>
                <span className="text-gray-300">42 Days, 13:37:00</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-1">
                <span className="text-gray-500">Firmware</span>
                <span className="text-gray-300">v2.4.1-NERD</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={handleReboot}
                  disabled={isRebooting}
                  className={`px-3 py-1 rounded text-[10px] border transition-colors ${isRebooting ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/30'}`}
                >
                  {isRebooting ? 'REBOOTING...' : 'REBOOT ROUTER'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wireless' && (
          <div className="grid grid-cols-2 gap-4 text-[10px]">
            <div className="space-y-3">
              <div>
                <label className="block text-gray-500 mb-1">SSID (Network Name)</label>
                <input type="text" value={ssid} onChange={(e) => setSsid(e.target.value)} className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-cyan-400 focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-cyan-400 focus:outline-none focus:border-cyan-500" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-500 mb-1">Security Mode</label>
                <select value={security} onChange={(e) => setSecurity(e.target.value)} className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-cyan-400 focus:outline-none focus:border-cyan-500">
                  <option>WPA3-Personal</option>
                  <option>WPA2/WPA3-Mixed</option>
                  <option>WPA2-Personal</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Channel</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-cyan-400 focus:outline-none focus:border-cyan-500">
                  <option>Auto</option>
                  <option>36</option>
                  <option>40</option>
                  <option>44</option>
                  <option>48</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] text-left">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="pb-1 font-normal">Device Name</th>
                  <th className="pb-1 font-normal">IP Address</th>
                  <th className="pb-1 font-normal">MAC Address</th>
                  <th className="pb-1 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(device => (
                  <tr key={device.id} className="border-b border-gray-800/50">
                    <td className="py-1.5 text-cyan-400">{device.name}</td>
                    <td className="py-1.5 text-gray-300">{device.ip}</td>
                    <td className="py-1.5 text-gray-500">{device.mac}</td>
                    <td className="py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] ${device.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                        {device.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
