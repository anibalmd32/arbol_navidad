
import React, { useState, useRef, memo } from 'react';
import { useCursor, Text, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Gift } from '../types';

interface GiftBoxProps {
  gift: Gift;
  position: [number, number, number];
  rotation: [number, number, number];
  onClick: (gift: Gift) => void;
  isUnlocked: boolean;
}

const GiftBox: React.FC<GiftBoxProps> = memo(({ gift, position, rotation, onClick, isUnlocked }) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  useCursor(hovered);

  // Robust color fallback
  const boxColor = gift?.color || '#d32f2f';
  const recipientName = gift?.recipientName || 'Amigo';

  useFrame((state) => {
    if (groupRef.current) {
      const targetScale = hovered ? 1.15 : 1;
      const targetY = hovered ? 0.25 : 0;
      const bounce = Math.sin(state.clock.elapsedTime * 2 + (position[0] * position[2])) * 0.05;

      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY + bounce, 0.1);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <group ref={groupRef}>
        {/* Invisible Hitbox for Precise Interaction */}
        <mesh
          visible={false}
          onClick={(e) => {
            e.stopPropagation();
            onClick(gift);
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[1.1, 1, 1.1]} />
        </mesh>
        {/* Box Base */}
        <mesh castShadow>
          <boxGeometry args={[1, 0.8, 1]} />
          <meshStandardMaterial color={boxColor} roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Ribbon Vertical - Only visible if closed */}
        {!gift.isOpened && (
          <>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[1.05, 0.82, 0.2]} />
              <meshStandardMaterial color="#ffd700" roughness={0.1} metalness={0.5} />
            </mesh>
            {/* Ribbon Horizontal */}
            <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <boxGeometry args={[1.05, 0.82, 0.2]} />
              <meshStandardMaterial color="#ffd700" roughness={0.1} metalness={0.5} />
            </mesh>
          </>
        )}

        {/* Inner Void / Magic Effect (Visible when opened) */}
        {/* Inner Void / Magic Effect (Visible when opened) */}
        {gift.isOpened && (
          <group position={[0, 0.401, 0]}>
            {/* Void - simulating empty dark box interior - strictly on top face */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.98, 0.98]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            {/* Magical Glow */}
            <pointLight color="#ffaa00" intensity={2} distance={2} decay={2} position={[0, 0.2, 0]} />
            <Sparkles count={20} scale={1.2} size={3} speed={0.4} opacity={1} color="#ffffaa" position={[0, 0.5, 0]} />
          </group>
        )}

        {/* Lid - Interactive Position based on 'isOpened' */}
        <group
          position={gift.isOpened ? [0.95, -0.4, 0] : [0, 0.45, 0]}
          rotation={gift.isOpened ? [0, 0, Math.PI / 1.7] : [0, 0, 0]}
        >
          <mesh castShadow>
            <boxGeometry args={[1.1, 0.2, 1.1]} />
            <meshStandardMaterial color={boxColor} roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Lid Ribbon */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.15, 0.21, 0.2]} />
            <meshStandardMaterial color="#ffd700" roughness={0.1} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[1.15, 0.21, 0.2]} />
            <meshStandardMaterial color="#ffd700" roughness={0.1} metalness={0.5} />
          </mesh>
        </group>

        {/* Text Label */}
        <Text
          position={[0, 0.75, 0.6]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
          font="https://fonts.gstatic.com/s/quicksand/v30/6xKtdSZaM9iE8KbpRA_hK1QN.woff"
        >
          {`Para: ${recipientName}`}
        </Text>
      </group>
    </group>
  );
});

export default GiftBox;
