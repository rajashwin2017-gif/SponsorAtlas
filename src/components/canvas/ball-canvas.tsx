'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function Ball({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.5
  })

  const c = new THREE.Color(color)

  return (
    <Float speed={1.6} rotationIntensity={0.6} floatIntensity={1.8}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <pointLight position={[-3, -3, -3]} color={color} intensity={1.5} />
      <mesh ref={meshRef} castShadow scale={2.6}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.25}
          flatShading
        />
      </mesh>
    </Float>
  )
}

export function BallCanvas({ color }: { color: string }) {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <Suspense fallback={null}>
        <OrbitControls enableZoom={false} enablePan={false} />
        <Ball color={color} />
      </Suspense>
    </Canvas>
  )
}
