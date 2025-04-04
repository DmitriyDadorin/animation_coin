import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const CoinWithEmbeddedStars: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.innerHTML = "";

    // Сцена и камера
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    // Рендерер
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight
    );
    canvasRef.current.appendChild(renderer.domElement);

    // Группа для всей монеты
    const group = new THREE.Group();

    // ===================== 1) ТЕКСТУРА ДЛЯ ЛИЦА МОНЕТЫ =====================
    const size = 512; // размер canvas
    const coinCanvas = document.createElement("canvas");
    coinCanvas.width = size;
    coinCanvas.height = size;
    const ctx = coinCanvas.getContext("2d")!;

    // a) Фоновое «кольцо» (более тёмный золотой)
    ctx.fillStyle = "#FFC000";
    ctx.fillRect(0, 0, size, size);

    // b) Внутренний круг (по центру, посветлее)
    const centerX = size / 2;
    const centerY = size / 2;
    const innerRadius = size * 0.45;

    ctx.beginPath();
    ctx.fillStyle = "#FFE200";
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();

    // c) Отблески ТОЛЬКО на внутреннем круге:
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.clip(); // ограничиваем область рисования внутренним кругом

    // Повернём контекст, чтобы нарисовать диагональные полосы
    ctx.translate(centerX, centerY);
    ctx.rotate(-Math.PI / 4); // угол наклона отблесков

    // Первая (более широкая) полоса
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    // Здесь ширина ~0.1 от size, а длина – весь canvas
    ctx.fillRect(-size * 0.5, -size * 0.25, size, size * 0.2);

    // Вторая (поуже и чуть смещённая) полоса
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    // Смещаем немного, делаем уже
    ctx.fillRect(-size * 0.5, size * 0.1, size, size * 0.5);

    // Выходим из clip
    ctx.restore();

    // Создаём текстуру из canvas
    const coinTexture = new THREE.CanvasTexture(coinCanvas);
    coinTexture.colorSpace = THREE.SRGBColorSpace;
    coinTexture.anisotropy = 16;

    // ===================== 2) ГЕОМЕТРИЯ И МАТЕРИАЛ МОНЕТЫ =====================
    const coinGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 64);

    // a) Лицевые стороны (top, bottom) с текстурой
    const faceMaterial = new THREE.MeshBasicMaterial({
      map: coinTexture,
    });
    // b) Ребро (edge) монеты — более тёмный золотой
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: "#d89700",
    });

    // Собираем цилиндр: [edgeMaterial, faceMaterial, faceMaterial]
    const coinMesh = new THREE.Mesh(coinGeometry, [
      edgeMaterial,
      faceMaterial,
      faceMaterial,
    ]);
    coinMesh.rotation.x = Math.PI / 2;
    group.add(coinMesh);

    // ===================== 3) ЗВЕЗДА =====================
    const createStar = () => {
      const starShape = new THREE.Shape();
      const outerRadius = 0.5;
      const innerRadius = 0.25;
      const spikes = 5;

      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
      }
      starShape.closePath();

      const extrudeSettings = {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 5,
      };

      const starGeometry = new THREE.ExtrudeGeometry(
        starShape,
        extrudeSettings
      );
      starGeometry.computeVertexNormals();
      starGeometry.center();

      const starMaterial = new THREE.MeshBasicMaterial({
        color: "#c97900",
      });

      return new THREE.Mesh(starGeometry, starMaterial);
    };

    // Звезда на лицевой стороне
    const starFront = createStar();
    starFront.position.set(0, 0, 0.03 + 0.02);
    group.add(starFront);

    // Звезда на задней стороне
    const starBack = createStar();
    starBack.rotation.x = Math.PI;
    starBack.position.set(0, 0, -0.03 - 0.02);
    group.add(starBack);

    // Добавляем группу в сцену
    scene.add(group);

    // ===================== 4) АНИМАЦИЯ (вращение) =====================
    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y += 0.015;
      renderer.render(scene, camera);
    };
    animate();

    // ===================== 5) Ресайз =====================
    const handleResize = () => {
      const { clientWidth, clientHeight } = canvasRef.current!;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // Очистка
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      coinGeometry.dispose();
      faceMaterial.dispose();
      edgeMaterial.dispose();
      coinTexture.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{ width: "400px", height: "400px", margin: "auto" }}
    />
  );
};

export default CoinWithEmbeddedStars;
