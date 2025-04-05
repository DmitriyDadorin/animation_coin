import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface CoinProps {
  width?: number; // ширина канваса, по умолчанию 400px
  height?: number; // высота канваса, по умолчанию 400px
  coinRadius?: number; // радиус монеты, по умолчанию 1
  coinThickness?: number; // толщина монеты, по умолчанию 0.2
  outerRingColor?: string; // цвет внешнего кольца монеты, по умолчанию "#FFC000"
  innerCircleColor?: string; // цвет внутреннего круга монеты, по умолчанию "#FFE200"
  starColor?: string; // цвет звёзд, по умолчанию "#c97900"
  edgeColor?: string; // цвет ребра монеты, по умолчанию "#d89700"
  bounce?: boolean; // включает подпрыгивание монеты, по умолчанию false
  bounceAmplitude?: number; // амплитуда подпрыгивания, по умолчанию 0.2
  bounceSpeed?: number; // скорость подпрыгивания, по умолчанию 2
  autoStopAfterTurns?: boolean; // если true, монета останавливается после указанного числа оборотов
  numTurns?: number; // число полных оборотов (default 3)
  rotationOffset?: number; // угол недокручивания (по умолчанию 0)
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
  bounce = false,
  bounceAmplitude = 0.2,
  bounceSpeed = 2,
  autoStopAfterTurns = false,
  numTurns = 3,
  rotationOffset = 0,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const generateCoinTexture = (
    outerColor: string,
    innerColor: string,
    size: number
  ): THREE.CanvasTexture => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const center = size / 2;
    const innerRadius = size * 0.45;

    ctx.fillStyle = outerColor;
    ctx.fillRect(0, 0, size, size);

    ctx.beginPath();
    ctx.fillStyle = innerColor;
    ctx.arc(center, center, innerRadius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, 2 * Math.PI);
    ctx.clip();
    ctx.translate(center, center);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.fillRect(-size * 0.5, -size * 0.25, size, size * 0.2);
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.fillRect(-size * 0.5, size * 0.1, size, size * 0.5);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  };

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;
    container.innerHTML = "";
    const { clientWidth, clientHeight } = container;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      clientWidth / clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(clientWidth, clientHeight);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const textureSize = 512;
    const coinTexture = generateCoinTexture(
      outerRingColor,
      innerCircleColor,
      textureSize
    );
    const coinGeometry = new THREE.CylinderGeometry(
      coinRadius,
      coinRadius,
      coinThickness,
      64
    );
    coinGeometry.rotateX(Math.PI / 2);

    const faceMaterial = new THREE.MeshBasicMaterial({ map: coinTexture });
    const edgeMaterial = new THREE.MeshBasicMaterial({ color: edgeColor });
    const coinMesh = new THREE.Mesh(coinGeometry, [
      edgeMaterial,
      faceMaterial,
      faceMaterial,
    ]);
    group.add(coinMesh);

    // Функция для создания звезды
    const createStar = (): THREE.Mesh => {
      const starShape = new THREE.Shape();
      const outerR = coinRadius * 0.5;
      const innerR = coinRadius * 0.25;
      const spikes = 5;
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const radius = i % 2 === 0 ? outerR : innerR;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          starShape.moveTo(x, y);
        } else {
          starShape.lineTo(x, y);
        }
      }
      starShape.closePath();
      const extrudeSettings = {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 5,
      };
      const starGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
      starGeometry.computeVertexNormals();
      starGeometry.center();
      const starMaterial = new THREE.MeshBasicMaterial({ color: starColor });
      return new THREE.Mesh(starGeometry, starMaterial);
    };

    const starFront = createStar();
    starFront.rotation.z = Math.PI / 12;
    starFront.position.set(0, 0, coinThickness / 2 - 0.05);
    group.add(starFront);

    const starBack = createStar();
    starBack.rotation.y = Math.PI;
    starBack.rotation.z = -Math.PI / -12;
    starBack.position.set(0, 0, -coinThickness / 2 + 0.05);
    group.add(starBack);

    scene.add(group);

    const clock = new THREE.Clock();
    let totalRotation = 0;
    const targetRotation = autoStopAfterTurns
      ? numTurns * Math.PI - rotationOffset
      : Infinity;

    const animate = () => {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (autoStopAfterTurns) {
        const remaining = targetRotation - totalRotation;
        if (remaining > 0) {
          const decelerationThreshold = 0.5;
          let deltaRotation = 0.015;
          if (remaining < decelerationThreshold) {
            deltaRotation = 0.015 * (remaining / decelerationThreshold);
          }
          if (deltaRotation > remaining) {
            deltaRotation = remaining;
          }
          group.rotation.y += deltaRotation;
          totalRotation += deltaRotation;

          if (bounce) {
            let bounceFactor = 1;
            if (remaining < decelerationThreshold) {
              bounceFactor = remaining / decelerationThreshold;
            }
            group.position.y =
              Math.abs(Math.sin(elapsed * bounceSpeed)) *
              bounceAmplitude *
              bounceFactor;
          }
        } else {
          group.rotation.y = targetRotation;
          group.position.y = 0;
        }
      } else {
        if (bounce) {
          group.position.y =
            Math.abs(Math.sin(elapsed * bounceSpeed)) * bounceAmplitude;
        }
        group.rotation.y += 0.015;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const { clientWidth, clientHeight } = container;
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
    bounce,
    bounceAmplitude,
    bounceSpeed,
    autoStopAfterTurns,
    numTurns,
    rotationOffset,
  ]);

  return (
    <div
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px`, margin: "auto" }}
    />
  );
};

export default CoinWithEmbeddedStars;
