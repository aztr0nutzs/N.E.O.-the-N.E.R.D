// ON HOLD - NOT ACTIVE IN neo_no3d build
// This branch is 2D robot only
// Do not re-enable Robot3D
// Do not touch the center layout framing while polishing.

import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Float, 
  Environment,
  PresentationControls,
  ContactShadows,
  useGLTF,
  Html,
  PerspectiveCamera
} from '@react-three/drei';
import { Group, MathUtils, Mesh, MeshStandardMaterial } from 'three';
import { useNeural } from '../context/NeuralContext';
import { AlertTriangle } from 'lucide-react';

class ThreeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="flex flex-col items-center gap-2 bg-red-500/20 p-4 rounded border border-red-500/40 backdrop-blur-md text-red-500 font-mono text-[10px] uppercase tracking-widest">
            <AlertTriangle className="w-6 h-6 mb-1" />
            3D Engine Failure
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

function RobotModel() {
  const { userPosition, audioData, neuralSurge } = useNeural();
  const groupRef = useRef<Group>(null);
  
  const { scene } = useGLTF('/robot_model.glb', true);

  // Calculate audio intensity for reactive elements
  const { audioIntensity, audioAverage } = useMemo(() => {
    if (!audioData || !audioData.length) return { audioIntensity: 0, audioAverage: 0 };
    let sum = 0;
    let max = 0;
    for (let i = 0; i < audioData.length; i++) {
      const val = audioData[i] / 255;
      sum += val;
      if (val > max) max = val;
    }
    const avg = sum / audioData.length;
    // Non-linear boost to make subtle changes more apparent
    const intensity = Math.pow(max, 0.6);
    return { audioIntensity: intensity, audioAverage: avg };
  }, [audioData]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.getElapsedTime();
    
    // Frame-rate independent lerp factor for smooth, consistent movement
    const lerpFactor = 1 - Math.exp(-8 * delta);

    // 1. Nuanced Rotation
    // Base rotation from user tracking
    const targetRotX = -userPosition.y * 0.3;
    const targetRotY = userPosition.x * 0.5;
    const targetRotZ = userPosition.x * -0.1; // Slight tilt when looking sideways
    
    // Add micro-movements based on audio intensity (twitch/alertness)
    const audioTwitchX = Math.sin(t * 15) * audioIntensity * 0.1;
    const audioTwitchY = Math.cos(t * 12) * audioIntensity * 0.1;

    groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, targetRotX + audioTwitchX, lerpFactor);
    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, targetRotY + audioTwitchY, lerpFactor);
    groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, lerpFactor);

    // 2. Reactive Position
    // Base hover + audio-driven vertical boost
    const basePosY = -1;
    const hoverY = Math.sin(t * 2) * 0.1;
    const audioBoostY = audioIntensity * 0.2; // Rises up slightly when speaking
    
    const targetPosY = basePosY + hoverY + audioBoostY;
    const targetPosX = Math.cos(t * 1.5) * 0.05; // Subtle lateral drift

    groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, targetPosY, lerpFactor);
    groupRef.current.position.x = MathUtils.lerp(groupRef.current.position.x, targetPosX, lerpFactor);

    // 3. Scale Pulse
    // Slight expansion when speaking loudly, plus an organic breathing pulse based on average audio
    const baseScale = 2;
    const organicPulse = Math.sin(t * 4) * (audioAverage * 0.03);
    const targetScale = baseScale + (audioIntensity * 0.05) + organicPulse;
    groupRef.current.scale.setScalar(MathUtils.lerp(groupRef.current.scale.x, targetScale, lerpFactor * 1.5));

    // 4. Emissive Reactivity
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        if (mesh.material && 'emissive' in mesh.material) {
          const mat = mesh.material as MeshStandardMaterial;
          // Dynamically responsive to subtle changes
          const targetEmissive = (neuralSurge ? 2 : 0.2) + (audioIntensity * 6) + (audioAverage * 4);
          mat.emissiveIntensity = MathUtils.lerp(
            mat.emissiveIntensity, 
            targetEmissive, 
            lerpFactor * 3
          );
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]} scale={2}>
      <primitive object={scene} />
    </group>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 bg-black/80 p-6 rounded-lg border border-cyber-blue/30 backdrop-blur-md">
        <div className="w-12 h-12 border-4 border-cyber-blue border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00ffff]" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-mono text-cyber-blue animate-pulse uppercase tracking-[0.2em]">
            Awaiting Neural Asset
          </span>
        </div>
      </div>
    </Html>
  );
}

export function Robot3D() {
  return (
    <div className="w-full h-full min-h-[400px] relative group cursor-grab active:cursor-grabbing">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ff00ff" />
        <pointLight position={[10, 5, 5]} intensity={1} color="#00ffff" />
        
        <Suspense fallback={<LoadingFallback />}>
          <ThreeErrorBoundary>
            <PresentationControls
              global
              snap
              rotation={[0, 0, 0]}
              polar={[-Math.PI / 3, Math.PI / 3]}
              azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
            >
              <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <RobotModel />
              </Float>
            </PresentationControls>
          </ThreeErrorBoundary>
        </Suspense>

        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
        <Environment preset="city" />
      </Canvas>
      
      {/* Overlay UI elements */}
      <div className="absolute inset-0 pointer-events-none border border-cyber-blue/10 rounded-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-blue/20 to-transparent animate-scanline" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-50" />
      </div>
    </div>
  );
}
