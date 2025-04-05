import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface CoinProps {
  width?: number;            // ширина канваса, по умолчанию 400px
  height?: number;           // высота канваса, по умолчанию 400px
  coinRadius?: number;       // радиус монеты (используется в геометрии цилиндра), по умолчанию 1
  coinThickness?: number;    // толщина монеты, по умолчанию 0.2
  outerRingColor?: string;   // цвет внешнего кольца монеты, по умолчанию "#FFC000"
  innerCircleColor?: string; // цвет внутреннего круга монеты, по умолчанию "#FFE200"
  starColor?: string;        // цвет звёзд, по умолчанию "#c97900"
  edgeColor?: string;        // цвет ребра монеты, по умолчанию "#d89700"
}

const CoinWithEmbeddedStars: React.FC<CoinProps> = ({
  width = 400,
  height = 400,
  coinRadius = 1,
  coinThickness = 0.2,
  outerRingColor = "#FFC000",
  innerCircleColor = "#FFE200",
  starColor = "#c97900",
  edgeColor = "#d89700",
}) => {
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
    const textureSize = 512; // размер canvas для текстуры
    const coinCanvas = document.createElement("canvas");
    coinCanvas.width = textureSize;
    coinCanvas.height = textureSize;
    const ctx = coinCanvas.getContext("2d")!;

    // a) Фоновое «кольцо» (используем переданный outerRingColor)
    ctx.fillStyle = outerRingColor;
    ctx.fillRect(0, 0, textureSize, textureSize);

    // b) Внутренний круг (центр, innerCircleColor)
    const centerX = textureSize / 2;
    const centerY = textureSize / 2;
    const innerRadius = textureSize * 0.45;

    ctx.beginPath();
    ctx.fillStyle = innerCircleColor;
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();

    // c) Отблески на внутреннем круге:
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.clip();

    // Поворот контекста для диагональных полос
    ctx.translate(centerX, centerY);
    ctx.rotate(-Math.PI / 4);

    // Первая широкая полоса
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.fillRect(-textureSize * 0.5, -textureSize * 0.25, textureSize, textureSize * 0.2);

    // Вторая полоса
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.fillRect(-textureSize * 0.5, textureSize * 0.1, textureSize, textureSize * 0.5);

    ctx.restore();

    const coinTexture = new THREE.CanvasTexture(coinCanvas);
    coinTexture.colorSpace = THREE.SRGBColorSpace;
    coinTexture.anisotropy = 16;

    // ===================== 2) ГЕОМЕТРИЯ И МАТЕРИАЛЫ МОНЕТЫ =====================
    const coinGeometry = new THREE.CylinderGeometry(
      coinRadius,
      coinRadius,
      coinThickness,
      64
    );

    // a) Материал для лицевых сторон (с текстурой)
    const faceMaterial = new THREE.MeshBasicMaterial({
      map: coinTexture,
    });
    // b) Материал для ребра монеты
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: edgeColor,
    });

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
      // Размер звезды задаём относительно coinRadius
      const outerRadius = coinRadius * 0.5;
      const innerRadius = coinRadius * 0.25;
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
        color: starColor,
      });

      return new THREE.Mesh(starGeometry, starMaterial);
    };

    // Звезда на лицевой стороне
    const starFront = createStar();
    starFront.rotation.z = Math.PI / 12;
    starFront.position.set(0, 0, coinThickness / 2 - 0.05);
    group.add(starFront);

    // Звезда на задней стороне
    const starBack = createStar();
    starBack.rotation.z = Math.PI / -12;
    starBack.rotation.x = Math.PI;
    starBack.position.set(0, 0, -coinThickness / 2 + 0.05);
    group.add(starBack);
    
    scene.add(group);

    // ===================== 4) АНИМАЦИЯ =====================
    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y += 0.015;
      renderer.render(scene, camera);
    };
    animate();

    // ===================== 5) РЕСАЙЗ =====================
    const handleResize = () => {
      if (!canvasRef.current) return;
      const { clientWidth, clientHeight } = canvasRef.current;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      coinGeometry.dispose();
      faceMaterial.dispose();
      edgeMaterial.dispose();
      coinTexture.dispose();
    };
  }, [
    width,
    height,
    coinRadius,
    coinThickness,
    outerRingColor,
    innerCircleColor,
    starColor,
    edgeColor,
  ]);

  return (
    <div
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px`, margin: "auto" }}
    />
  );
};

export default CoinWithEmbeddedStars;
