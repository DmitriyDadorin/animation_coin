import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const StarMesh: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Очистка DOM
    containerRef.current.innerHTML = "";

    // === SCENE SETUP ===
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    // === CREATE STAR SHAPE ===
    const starShape = new THREE.Shape();
    const outerRadius = 0.5;
    const innerRadius = 0.25;
    const spikes = 5;

    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        starShape.moveTo(x, y);
      } else {
        starShape.lineTo(x, y);
      }
    }
    starShape.closePath();

    const starGeometry = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 5,
    });
    
    starGeometry.computeVertexNormals();
    starGeometry.center(); // важно — чтобы не было смещений и дырок

    const starMaterial = new THREE.MeshStandardMaterial({
      color: "#808080",
      metalness: 0.4,
      roughness: 0.6,
      side: THREE.DoubleSide, // временно для отладки
    });

    const starMesh = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(starMesh);

    // === LIGHTING ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(3, 3, 3);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    directionalLight.position.set(2, 2, 2); // чтобы светил на переднюю грань
    scene.add(directionalLight);

    scene.add(ambientLight);
    scene.add(directionalLight);

    // === ANIMATION LOOP ===
    const animate = () => {
      requestAnimationFrame(animate);
      starMesh.rotation.y += 0.01; // ← вращение по оси Y
      renderer.render(scene, camera);
    };
    animate();

    // === RESIZE HANDLER ===
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "300px", height: "300px" }} />;
};

export default StarMesh;
