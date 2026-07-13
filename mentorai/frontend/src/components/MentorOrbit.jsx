import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function OrbitalScene() {
  const world = useRef();
  const ringOne = useRef();
  const ringTwo = useRef();
  const particles = useRef();

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    if (world.current) {
      world.current.rotation.y += (state.pointer.x * 0.22 - world.current.rotation.y) * 0.035;
      world.current.rotation.x += (-state.pointer.y * 0.14 - world.current.rotation.x) * 0.035;
      world.current.position.y = Math.sin(time * 1.15) * 0.12;
    }
    if (ringOne.current) ringOne.current.rotation.z += delta * 0.26;
    if (ringTwo.current) ringTwo.current.rotation.z -= delta * 0.16;
    if (particles.current) particles.current.rotation.y += delta * 0.55;
  });

  return (
    <group ref={world}>
      <ambientLight intensity={1.5} />
      <pointLight position={[3, 2, 4]} color="#41e8ff" intensity={22} distance={8} />
      <pointLight position={[-3, -1, 2]} color="#c084fc" intensity={15} distance={7} />
      <mesh>
        <sphereGeometry args={[1.32, 64, 64]} />
        <meshPhysicalMaterial color="#182765" emissive="#192f8e" emissiveIntensity={0.65} roughness={0.16} metalness={0.28} transmission={0.32} transparent opacity={0.92} />
      </mesh>
      <mesh scale={1.04}>
        <sphereGeometry args={[1.32, 32, 32]} />
        <meshBasicMaterial color="#3ee9ff" transparent opacity={0.07} side={2} />
      </mesh>
      <group rotation={[1.13, 0.2, 0.12]}>
        <mesh ref={ringOne}><torusGeometry args={[1.75, 0.018, 10, 100]} /><meshBasicMaterial color="#55eaff" transparent opacity={0.75} /></mesh>
        <mesh ref={ringTwo} rotation={[0, 0, 1.1]}><torusGeometry args={[1.98, 0.012, 10, 100]} /><meshBasicMaterial color="#d18cff" transparent opacity={0.58} /></mesh>
        <mesh rotation={[0, 0, 2.1]}><torusGeometry args={[1.56, 0.009, 10, 100]} /><meshBasicMaterial color="#ff70ba" transparent opacity={0.42} /></mesh>
      </group>
      <group ref={particles}>
        <Particle position={[2.15, 0.18, 0.15]} color="#3ee9ff" size={0.12} />
        <Particle position={[-1.76, 0.78, 0.25]} color="#c084fc" size={0.1} />
        <Particle position={[0.46, -1.83, 0.35]} color="#ff70ba" size={0.1} />
        <Particle position={[-0.5, 1.95, -0.2]} color="#3ee9ff" size={0.065} />
      </group>
    </group>
  );
}

function Particle({ position, color, size }) {
  return <mesh position={position}><sphereGeometry args={[size, 20, 20]} /><meshBasicMaterial color={color} /><pointLight color={color} intensity={3} distance={1.5} /></mesh>;
}

export default function MentorOrbit({ percent }) {
  return (
    <div className="mentor-orbit" aria-label={`${percent}% roadmap progress`}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <OrbitalScene />
      </Canvas>
      <div className="mentor-orbit-label">
        <span>MOMENTUM</span>
        <strong>{percent}%</strong>
        <small>roadmap complete</small>
      </div>
      <div className="float-badge badge-top"><span>⚡</span> learning live</div>
      <div className="float-badge badge-bottom"><span>✦</span> AI powered</div>
    </div>
  );
}
