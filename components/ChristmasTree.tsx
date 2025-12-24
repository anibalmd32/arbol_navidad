import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshWobbleMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import PhotoOrnament from './PhotoOrnament';
import { getMemories } from '../services/storage';
import { Memory } from '../types';

interface ChristmasTreeProps {
  onPhotoClick?: (memory: { photoUrl: string; message?: string }) => void;
  refreshTrigger?: number; // Prop to trigger re-fetch when new photo added
}

// Tree geometry definition for easier calculations
const TREE_LAYERS = [
  { scale: 2.8, y: 2.0, height: 3.0, color: '#0f5132' },  // Base Layer
  { scale: 2.3, y: 3.8, height: 2.5, color: '#156639' },  // Middle 1
  { scale: 1.8, y: 5.3, height: 2.0, color: '#1c7b40' },  // Middle 2
  { scale: 1.2, y: 6.5, height: 1.5, color: '#24904d' },  // Top
];

const ChristmasTree: React.FC<ChristmasTreeProps> = ({ onPhotoClick, refreshTrigger }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    const fetchMemories = async () => {
      const data = await getMemories();
      setMemories(data);
    };
    fetchMemories();
  }, [refreshTrigger]);

  // Helper to calculate the tree's surface radius at a given Y height
  const getTreeRadiusAtY = (y: number) => {
    // Find which layer covers this Y.
    for (const layer of TREE_LAYERS) {
      const bottomY = layer.y - layer.height / 2;
      const topY = layer.y + layer.height / 2;
      // Allow slight overlap for placement
      if (y >= bottomY + 0.2 && y <= topY - 0.2) {
        // Linear interpolation for cone radius
        const ratio = (topY - y) / layer.height; // 1 at bottom, 0 at top
        const r = layer.scale * ratio;
        return r;
      }
    }
    return 1.0;
  };

  // Generate random positions for regular ornaments
  const ornaments = useMemo(() => {
    const items: any[] = [];
    const layers = TREE_LAYERS;
    layers.forEach((layer, i) => {
      const count = 12 - i * 2;
      const bottomY = layer.y - layer.height / 2 + 0.3;
      const topY = layer.y + layer.height / 2 - 0.3;
      for (let j = 0; j < count; j++) {
        const y = bottomY + Math.random() * (topY - bottomY);
        const ratio = (layer.y + layer.height / 2 - y) / layer.height;
        const r = layer.scale * ratio + 0.05;
        const angle = Math.random() * Math.PI * 2;
        items.push({
          position: [Math.sin(angle) * r, y, Math.cos(angle) * r] as [number, number, number],
          color: Math.random() > 0.6 ? '#d4af37' : (Math.random() > 0.5 ? '#c92a2a' : '#ffffff'),
          scale: 0.12 + Math.random() * 0.08
        });
      }
    });
    return items;
  }, []);

  // Calculate dynamic positions for Memories fetched from DB
  const photoOrnaments = useMemo(() => {
    if (memories.length === 0) return [];

    return memories.map((memory, i) => {
      // Golden Angle distribution for organic placement without overlap
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      // Distribute vertically from y=2 to y=6.5
      // If many memories, step is smaller to fit them all.
      const minHeight = 1.8;
      const maxHeight = 6.8;
      const heightRange = maxHeight - minHeight;

      // Even distributions based on index
      const normalizedPos = i / (memories.length > 1 ? memories.length - 1 : 1);
      const y = minHeight + (normalizedPos * heightRange);

      const angle = i * goldenAngle * 5; // Rotate around tree

      const r = getTreeRadiusAtY(y) + 0.25; // Sit on surface

      return {
        id: memory.id,
        photoUrl: memory.photoUrl,
        message: memory.message,
        position: [
          Math.sin(angle) * r,
          y,
          Math.cos(angle) * r
        ] as [number, number, number]
      };
    });
  }, [memories]);


  useFrame((state) => {
    if (groupRef.current) {
      // Gentle rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 2.5, 8]} />
        <meshStandardMaterial color="#463125" roughness={0.9} />
      </mesh>

      {/* Tree Layers */}
      {TREE_LAYERS.map((layer, i) => (
        <mesh key={i} position={[0, layer.y, 0]}>
          <coneGeometry args={[layer.scale, layer.height, 32]} />
          <meshStandardMaterial
            color={layer.color}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Star - Fixed alignment */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
        <group position={[0, 7.5, 0]}>
          <mesh>
            <octahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2.0} toneMapped={false} />
          </mesh>
          <pointLight color="#ffd700" intensity={2} distance={8} decay={2} />
          <Sparkles count={20} scale={2} size={3} speed={0.4} opacity={0.7} color="#ffffaa" />
        </group>
      </Float>

      {/* Regular Ornaments */}
      {ornaments.map((ornament, i) => (
        <Sphere
          key={i}
          args={[ornament.scale, 16, 16]}
          position={ornament.position}
        >
          <MeshWobbleMaterial
            color={ornament.color}
            factor={0.05}
            speed={1}
            roughness={0.1}
            metalness={0.8}
            emissive={ornament.color}
            emissiveIntensity={0.2}
          />
        </Sphere>
      ))}

      {/* Photo Ornaments */}
      {photoOrnaments.map((ornament) => (
        <PhotoOrnament
          key={`photo-${ornament.id}`}
          position={ornament.position}
          photoUrl={ornament.photoUrl}
          onClick={() => onPhotoClick?.({ photoUrl: ornament.photoUrl, message: ornament.message })}
        />
      ))}

      {/* General Tree Sparkles */}
      <Sparkles
        count={80}
        scale={7}
        size={4}
        speed={0.3}
        opacity={0.4}
        color="#ffffff"
        position={[0, 3.5, 0]}
      />
    </group>
  );
};

export default ChristmasTree;
