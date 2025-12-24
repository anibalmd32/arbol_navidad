import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

interface PhotoOrnamentProps {
    position: [number, number, number];
    photoUrl: string;
    onClick: () => void;
}

const PhotoOrnament: React.FC<PhotoOrnamentProps> = ({ position, photoUrl, onClick }) => {
    const meshRef = useRef<THREE.Group>(null);
    const texture = useTexture(photoUrl);
    const [hovered, setHovered] = useState(false);

    // Twinkling effect state
    const [intensity, setIntensity] = useState(0);

    useFrame((state) => {
        if (meshRef.current) {
            // Gentle rotation
            meshRef.current.rotation.y += 0.01;

            // Twinkling effect calculation
            const time = state.clock.getElapsedTime();
            const t = Math.sin(time * 3 + position[0] * 10) * 0.5 + 0.5; // Randomize phase by position
            setIntensity(t);
        }
    });

    return (
        <group
            ref={meshRef}
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            onPointerOver={() => {
                document.body.style.cursor = 'pointer';
                setHovered(true);
            }}
            onPointerOut={() => {
                document.body.style.cursor = 'default';
                setHovered(false);
            }}
        >


            {/* Outer Frosted Glass Shell */}
            <Sphere args={[0.25, 32, 32]}>
                <meshPhysicalMaterial
                    color={hovered ? "#ffaaaa" : "#ffffff"}
                    roughness={0.4}
                    transmission={0.6} // Glass-like transmission
                    thickness={0.1} // Refraction
                    transparent
                    opacity={0.8}
                    clearcoat={1}
                />
            </Sphere>

            {/* Inner Photo Sphere */}
            <Sphere args={[0.2, 32, 32]}>
                <meshStandardMaterial
                    map={texture}
                    toneMapped={false}
                    emissive="#ffaaaa" // Warm glow
                    emissiveIntensity={intensity * 0.5} // Twinkle
                />
            </Sphere>

            {/* Halo/Glow sprite for extra "magic" */}
            <mesh scale={1.2}>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshBasicMaterial
                    color="#ffdddd"
                    transparent
                    opacity={intensity * 0.3}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
};

export default PhotoOrnament;
