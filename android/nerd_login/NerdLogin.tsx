import React, { useEffect, useRef } from 'react';

interface NerdLoginProps {
  supabaseStatus: string;
  supabaseDetail: string;
  onLogin: () => void;
}

export function NerdLogin({ supabaseStatus, supabaseDetail, onLogin }: NerdLoginProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 360, H = 780;

    const particles = Array.from({length:60},()=>({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*1.5+0.3,
      vx: (Math.random()-0.5)*0.4,
      vy: -(Math.random()*0.6+0.2),
      color: ['#ff3cac','#00eaff','#3ddc84','#ffae00','#c8ff00','#ff6000'][Math.floor(Math.random()*6)],
      alpha: Math.random()
    }));

    const scanY = {v:0};
    let reqId: number;

    function draw(){
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#000';
      ctx.fillRect(0,0,W,H);

      ctx.strokeStyle='rgba(0,255,136,0.04)';
      ctx.lineWidth=0.5;
      for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

      particles.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy;
        p.alpha+=0.01;
        if(p.y<0){p.y=H;p.x=Math.random()*W;p.alpha=0;}
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.color+(Math.floor(Math.abs(Math.sin(p.alpha))*99+1).toString(16).padStart(2,'0'));
        ctx.fill();
      });

      scanY.v = (scanY.v+1.2)%H;
      const sg = ctx.createLinearGradient(0,scanY.v-20,0,scanY.v+20);
      sg.addColorStop(0,'rgba(0,200,255,0)');
      sg.addColorStop(0.5,'rgba(0,200,255,0.06)');
      sg.addColorStop(1,'rgba(0,200,255,0)');
      ctx.fillStyle=sg;
      ctx.fillRect(0,scanY.v-20,W,40);

      reqId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(reqId);
  }, []);

  return (
    <div className="nerd-login-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
        .nerd-login-wrapper {
          display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:'Orbitron',monospace;
          overflow: hidden; position: relative; background: #000;
        }
        
        /* The WebGL Iframe Background */
        .lego-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          z-index: 0;
          opacity: 0.6; /* Dim it slightly so the UI pops */
        }

        .screen {
          width:360px;
          min-height:780px;
          display:flex;
          flex-direction:column;
          align-items:center;
          padding:50px 24px 40px;
          position:relative;
          z-index: 10;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          overflow:hidden;
          box-shadow: 0 0 50px rgba(0,255,255,0.1), 0 0 100px rgba(61,220,132,0.1);
          border-radius: 40px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .logo-container {
          position:relative;
          z-index:2;
          width:280px;
          height:280px;
          margin-bottom:24px;
        }
        
        .steel-frame {
          width:100%;
          height:100%;
          border-radius:36px;
          background:linear-gradient(145deg,#1a1a1a,#0a0a0a,#1a1a1a);
          border:3px solid #333;
          position:relative;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
        }
        
        .orange-glow-ring {
          position:absolute;
          inset:-4px;
          border-radius:40px;
          border:3px solid transparent;
          background:linear-gradient(#000,#000) padding-box,
                     linear-gradient(90deg,#ff6000,#ff3000,#ff8800,#ff6000) border-box;
          animation:spin-border 3s linear infinite;
        }
        
        @keyframes spin-border{
          0%{background:linear-gradient(#000,#000) padding-box, linear-gradient(0deg,#ff6000,#ff3000,#ff8800,#ff6000) border-box;}
          100%{background:linear-gradient(#000,#000) padding-box, linear-gradient(360deg,#ff6000,#ff3000,#ff8800,#ff6000) border-box;}
        }
        
        .bolt{position:absolute;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle,#4488ff,#1133aa);border:2px solid #66aaff;box-shadow:0 0 8px #4488ff;}
        .bolt.tl{top:12px;left:12px;} .bolt.tr{top:12px;right:12px;}
        .bolt.bl{bottom:12px;left:12px;} .bolt.br{bottom:12px;right:12px;}
        
        .pcb-inner {
          width:200px;height:200px;
          border-radius:16px;
          background:#050a05;
          border:1px solid #1a3a1a;
          display:flex;align-items:center;justify-content:center;
          position:relative;overflow:hidden;
        }
        
        .pcb-lines {position:absolute;inset:0;opacity:0.25;}
        
        .nerd-logo-text { position:relative;z-index:2;text-align:center;line-height:1.1; }
        .lego-row {display:flex;gap:3px;justify-content:center;align-items:center;}
        .lego {
          display:inline-flex;align-items:center;justify-content:center;
          width:36px;height:36px;border-radius:6px;
          font-family:'Orbitron',monospace;font-size:18px;font-weight:900;
          position:relative;color:#fff;
          text-shadow:0 2px 0 rgba(0,0,0,0.5);
          box-shadow:0 4px 0 rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .lego::before {
          content:'';position:absolute;top:-5px;left:50%;transform:translateX(-50%);
          width:14px;height:6px;border-radius:3px;
          background:inherit;filter:brightness(0.85);
          box-shadow:0 -2px 0 rgba(0,0,0,0.4);
        }
        
        .lN{background:#e63b8a;} .lE{background:#00c8ff;} .lO{background:#22c55e;}
        .lT{background:#f59e0b;font-size:11px;width:28px;height:22px;border-radius:4px;}
        .lT::before{display:none;}
        .lN2{background:#22c55e;} .lE2{background:#f59e0b;} .lR{background:#e63b8a;} .lD{background:#c8ff00;color:#1a2a00;}
        
        .the-label { font-family:'Orbitron',monospace;font-size:9px; color:#888;letter-spacing:4px;margin:4px 0; }
        
        .brand-section {z-index:2;text-align:center;margin-bottom:8px;}
        .nerd-title {
          font-family:'Orbitron',monospace;font-size:36px;font-weight:900;
          letter-spacing:6px;
          background:linear-gradient(90deg,#ff3cac,#00eaff,#3ddc84,#ffae00,#ff3cac);
          background-size:300%;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
          animation:shimmer 4s linear infinite;
        }
        @keyframes shimmer{0%{background-position:0%}100%{background-position:300%}}
        
        .nerd-sub {font-family:'Orbitron',monospace;font-size:8px;letter-spacing:3px;color:#3ddc84;margin-top:4px;}
        .nerd-sub2 {font-family:'Orbitron',monospace;font-size:8px;letter-spacing:3px;color:#3ddc84;margin-top:2px;}
        
        .divider {
          z-index:2;width:90%;height:2px;margin:24px 0;
          background:linear-gradient(90deg,transparent,#ff6000,#ff3000,#ff6000,transparent);
          position:relative;
        }
        .divider::before {
          content:'';position:absolute;inset:-4px 20%;
          background:inherit;filter:blur(8px);opacity:0.6;
        }
        
        .btn-google {
          z-index:2;width:100%;padding:16px;border-radius:12px;border:none;
          background:linear-gradient(135deg,#00c8ff,#0088dd);
          color:#000;font-family:'Orbitron',monospace;font-size:11px;font-weight:700;
          letter-spacing:2px;cursor:pointer;display:flex;align-items:center;
          justify-content:center;gap:12px;margin-bottom:14px;
          text-transform:uppercase;
          box-shadow:0 0 20px rgba(0,200,255,0.4),0 0 40px rgba(0,200,255,0.2);
          animation:pulse-blue 2s ease-in-out infinite;
          position:relative;
          transition: transform 0.2s;
        }
        @keyframes pulse-blue{
          0%,100%{box-shadow:0 0 20px rgba(0,200,255,0.4),0 0 40px rgba(0,200,255,0.2);}
          50%{box-shadow:0 0 30px rgba(0,200,255,0.6),0 0 60px rgba(0,200,255,0.3);}
        }
        .btn-google:hover { transform: scale(1.02); }
        
        .btn-account {
          z-index:2;width:100%;padding:16px;border-radius:12px;
          border:2px solid #3ddc84;background:rgba(0,0,0,0.5);
          color:#3ddc84;font-family:'Orbitron',monospace;font-size:11px;
          font-weight:700;letter-spacing:2px;cursor:pointer;text-transform:uppercase;
          box-shadow:0 0 20px rgba(61,220,132,0.2),inset 0 0 20px rgba(61,220,132,0.05);
          animation:pulse-green 2.5s ease-in-out infinite;
          transition: transform 0.2s, background 0.2s;
        }
        @keyframes pulse-green{
          0%,100%{box-shadow:0 0 20px rgba(61,220,132,0.2),inset 0 0 20px rgba(61,220,132,0.05);}
          50%{box-shadow:0 0 35px rgba(61,220,132,0.5),inset 0 0 30px rgba(61,220,132,0.1);}
        }
        .btn-account:hover { transform: scale(1.02); background:rgba(61,220,132,0.1); }
        
        .ver {z-index:2;font-family:'Orbitron',monospace;font-size:7px;color:#1a3a1a;letter-spacing:2px;margin-top:24px;}
        
        .error-block {
          position: relative; z-index: 20; width: 100%; margin-bottom: 20px; font-family: monospace;
          background: rgba(255, 0, 0, 0.3); border: 1px solid rgba(255, 0, 0, 0.8); padding: 10px; border-radius: 8px;
          backdrop-filter: blur(4px);
        }
        .error-block.orange {
          background: rgba(255, 165, 0, 0.3); border-color: rgba(255, 165, 0, 0.8);
        }
      `}} />
      
      {/* Infinite LEGO plate WebGL rendering in background */}
      <iframe src="/login_bg/index-1.html" className="lego-bg" title="Infinite LEGO Plate" />

      <div className="screen">
        <canvas id="bg" ref={canvasRef} width="360" height="780" style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: '40px' }}></canvas>
        <div className="logo-container">
          <div className="steel-frame">
            <div className="orange-glow-ring"></div>
            <div className="bolt tl"></div><div className="bolt tr"></div>
            <div className="bolt bl"></div><div className="bolt br"></div>

            <div className="pcb-inner">
              <svg className="pcb-lines" viewBox="0 0 200 200">
                <path d="M10 70 L50 70 L50 40 L90 40" fill="none" stroke="#3ddc84" strokeWidth="1.5"/>
                <circle cx="50" cy="70" r="4" fill="#3ddc84"/>
                <path d="M190 70 L150 70 L150 40 L110 40" fill="none" stroke="#3ddc84" strokeWidth="1.5"/>
                <circle cx="150" cy="70" r="4" fill="#3ddc84"/>
                <path d="M10 140 L40 140 L40 170 L80 170" fill="none" stroke="#00c8ff" strokeWidth="1.5"/>
                <circle cx="40" cy="140" r="4" fill="#00c8ff"/>
                <path d="M190 140 L160 140 L160 170 L120 170" fill="none" stroke="#00c8ff" strokeWidth="1.5"/>
                <circle cx="160" cy="140" r="4" fill="#00c8ff"/>
                <path d="M100 5 L100 30" fill="none" stroke="#ffae00" strokeWidth="1.5"/>
                <circle cx="100" cy="30" r="4" fill="#ffae00"/>
                <path d="M100 195 L100 170" fill="none" stroke="#ffae00" strokeWidth="1.5"/>
                <circle cx="100" cy="170" r="4" fill="#ffae00"/>
                <polygon points="80,40 120,40 130,55 120,70 80,70 70,55" fill="none" stroke="#1a3a1a" strokeWidth="1"/>
                <polygon points="80,130 120,130 130,145 120,160 80,160 70,145" fill="none" stroke="#1a3a1a" strokeWidth="1"/>
              </svg>

              <div className="nerd-logo-text">
                <div className="lego-row">
                  <div className="lego lN">N</div>
                  <div className="lego lE">E</div>
                  <div className="lego lO">O</div>
                </div>
                <div className="the-label">· THE ·</div>
                <div className="lego-row">
                  <div className="lego lN2">N</div>
                  <div className="lego lE2">E</div>
                  <div className="lego lR">R</div>
                  <div className="lego lD">D</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="brand-section">
          <div className="nerd-title">N.E.R.D.</div>
          <div className="nerd-sub">NEURAL ENVIRONMENT</div>
          <div className="nerd-sub2">ROBOTIC DIRECTOR</div>
        </div>

        <div className="divider"></div>

        {supabaseStatus === 'missing' && (
          <div className="error-block z-20">
            <div className="text-red-400 font-bold uppercase mb-1 text-[10px]">CRITICAL_CONFIG_ERROR</div>
            <div className="text-slate-300 text-[10px]">Credentials missing. Verify VITE_SUPABASE_URL.</div>
          </div>
        )}
        {supabaseStatus === 'rls_error' && (
          <div className="error-block orange z-20">
            <div className="text-orange-400 font-bold uppercase mb-1 text-[10px]">PERMISSION_DENIED_403</div>
            <div className="text-slate-300 text-[10px] mb-2">Supabase RLS is blocking access.</div>
            <div className="bg-black/80 p-2 rounded text-[9px] text-orange-300">Run <span className="font-bold">supabase_setup.sql</span></div>
          </div>
        )}
        {supabaseStatus === 'error' && (
          <div className="error-block z-20">
            <div className="text-red-400 font-bold uppercase mb-1 text-[10px]">DATABASE_ERROR</div>
            <div className="text-slate-300 text-[10px] break-words">{supabaseDetail}</div>
          </div>
        )}

        <button className="btn-google" onClick={onLogin}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#000" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Sign in with Google
        </button>
        <button className="btn-account" onClick={onLogin}>Create Account</button>
        <div className="ver">N.E.O. THE N.E.R.D. · v2.0</div>
      </div>
    </div>
  );
}
