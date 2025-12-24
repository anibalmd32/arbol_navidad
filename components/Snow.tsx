
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Snow: React.FC = () => {
  const count = 1000;
  const mesh = useRef<THREE.Points>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = Math.random() * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
      vel[i] = 0.05 + Math.random() * 0.1;
    }
    return [pos, vel];
  }, [count]);

  useFrame(() => {
    if (!mesh.current) return;
    const posAttr = mesh.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i);
      y -= velocities[i];
      if (y < -10) y = 40;
      posAttr.setY(i, y);
      
      // Slight swaying
      let x = posAttr.getX(i);
      x += Math.sin(Date.now() * 0.001 + i) * 0.01;
      posAttr.setX(i, x);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

export default Snow;
