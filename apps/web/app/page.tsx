"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial } from "@react-three/drei";

export function Hero3D() {
  return (
    <Canvas className="w-full h-[500px] rounded-xl shadow-lg">
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 2]} />
      <Sphere args={[1, 100, 200]} scale={2}>
        <MeshDistortMaterial
          color="#6366f1" // Indigo-500
          distort={0.3}
          speed={2}
        />
      </Sphere>
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center bg-gray-50">
      {/* Hero Section */}
      <section className="w-full py-20">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Xin chào, tôi là Hiếu 👋
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Full-stack Developer | Yêu thích công nghệ & sáng tạo
        </p>
        <a
          href="#contact"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow transition transform hover:scale-105 hover:bg-indigo-700"
        >
          Liên hệ ngay
        </a>
      </section>

      {/* 3D Section */}
      <section className="w-full max-w-4xl px-4">
        <Hero3D />
      </section>
    </main>
  );
}
