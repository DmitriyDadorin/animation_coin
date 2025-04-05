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
  dust?: boolean; // включает эффект пыли, по умолчанию false
  dustParticleCount?: number; // количество частиц пыли, по умолчанию 50
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
  dust = false,
  dustParticleCount = 50,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.innerHTML = "";

    // Сцена, камера и рендерер
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight
    );
    canvasRef.current.appendChild(renderer.domElement);

    // Группа для монеты
    const group = new THREE.Group();

    // ===================== 1) ТЕКСТУРА МОНЕТЫ =====================
    const textureSize = 512;
    const coinCanvas = document.createElement("canvas");
    coinCanvas.width = textureSize;
    coinCanvas.height = textureSize;
    const ctx = coinCanvas.getContext("2d")!;

    // Фоновое кольцо
    ctx.fillStyle = outerRingColor;
    ctx.fillRect(0, 0, textureSize, textureSize);

    // Внутренний круг
    const centerX = textureSize / 2;
    const centerY = textureSize / 2;
    const innerRadius = textureSize * 0.45;
    ctx.beginPath();
    ctx.fillStyle = innerCircleColor;
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Отблески на внутреннем круге
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.clip();
    ctx.translate(centerX, centerY);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.fillRect(
      -textureSize * 0.5,
      -textureSize * 0.25,
      textureSize,
      textureSize * 0.2
    );
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.fillRect(
      -textureSize * 0.5,
      textureSize * 0.1,
      textureSize,
      textureSize * 0.5
    );
    ctx.restore();

    const coinTexture = new THREE.CanvasTexture(coinCanvas);
    coinTexture.colorSpace = THREE.SRGBColorSpace;
    coinTexture.anisotropy = 16;

    // ===================== 2) ГЕОМЕТРИЯ И МАТЕРИАЛЫ МОНЕТЫ =====================
    // Создаём цилиндр (по умолчанию он ориентирован вдоль оси Y)
    const coinGeometry = new THREE.CylinderGeometry(
      coinRadius,
      coinRadius,
      coinThickness,
      64
    );
    // Поворачиваем геометрию так, чтобы монета была ориентирована вдоль оси Z:
    // передняя грань будет на z = coinThickness/2, задняя – на z = -coinThickness/2.
    coinGeometry.rotateX(Math.PI / 2);

    const faceMaterial = new THREE.MeshBasicMaterial({
      map: coinTexture,
    });
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: edgeColor,
    });

    // Создаём Mesh без последующего поворота
    const coinMesh = new THREE.Mesh(coinGeometry, [
      edgeMaterial,
      faceMaterial,
      faceMaterial,
    ]);
    group.add(coinMesh);

    // ===================== 3) ЗВЕЗДА =====================
    const createStar = () => {
      const starShape = new THREE.Shape();
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

    // Лицевая звезда (на передней грани, z = coinThickness/2)
    const starFront = createStar();
    starFront.rotation.z = Math.PI / 12; // разворот на 15°
    starFront.position.set(0, 0, coinThickness / 2 - 0.05);
    group.add(starFront);

    // Задняя звезда (на задней грани, z = -coinThickness/2)
    const starBack = createStar();
    // Для зеркального отображения используем поворот вокруг оси Y
    starBack.rotation.y = Math.PI;
    starBack.rotation.z = Math.PI / -12;
    starBack.position.set(0, 0, -coinThickness / 2 + 0.05);
    group.add(starBack);

    scene.add(group);

    // ===================== 4) ЭФФЕКТ ПЫЛИ =====================
    // Массив систем пыли, каждая система обновляется в animate
    const dustSystems: Array<{
      points: THREE.Points;
      velocities: THREE.Vector3[];
      life: number;
      maxLife: number;
    }> = [];

    // Функция спавна пыли, равномерно покрывающая всю поверхность монеты
    const spawnDust = () => {
      const count = dustParticleCount;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities: THREE.Vector3[] = [];

      // Рассчитываем площади поверхностей
      const areaTop = Math.PI * coinRadius * coinRadius; // верхняя грань (z = coinThickness/2)
      const areaBottom = Math.PI * coinRadius * coinRadius; // нижняя грань (z = -coinThickness/2)
      const areaEdge = 2 * Math.PI * coinRadius * coinThickness; // боковая поверхность (ребро)
      const totalArea = areaTop + areaBottom + areaEdge;

      for (let i = 0; i < count; i++) {
        const rArea = Math.random() * totalArea;
        const localPos = new THREE.Vector3();

        if (rArea < areaTop) {
          // Верхняя грань: z = coinThickness/2
          const angle = Math.random() * 2 * Math.PI;
          const r = coinRadius * Math.sqrt(Math.random());
          localPos.set(
            r * Math.cos(angle),
            r * Math.sin(angle),
            coinThickness / 2
          );
        } else if (rArea < areaTop + areaBottom) {
          // Нижняя грань: z = -coinThickness/2
          const angle = Math.random() * 2 * Math.PI;
          const r = coinRadius * Math.sqrt(Math.random());
          localPos.set(
            r * Math.cos(angle),
            r * Math.sin(angle),
            -coinThickness / 2
          );
        } else {
          // Боковая поверхность (ребро): точка на окружности (в плоскости XY) и z между -coinThickness/2 и coinThickness/2
          const theta = Math.random() * 2 * Math.PI;
          const zPos = (Math.random() - 0.5) * coinThickness;
          localPos.set(
            coinRadius * Math.cos(theta),
            coinRadius * Math.sin(theta),
            zPos
          );
        }

        // Преобразуем локальную позицию в мировую (учитывая поворот и позицию монеты)
        coinMesh.localToWorld(localPos);

        positions[i * 3] = localPos.x;
        positions[i * 3 + 1] = localPos.y;
        positions[i * 3 + 2] = localPos.z;

        // Задаём случайную начальную скорость для частицы
        const vx = (Math.random() - 0.5) * 0.2;
        const vy = Math.random() * 0.2;
        const vz = (Math.random() - 0.5) * 0.2;
        velocities.push(new THREE.Vector3(vx, vy, vz));
      }

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const material = new THREE.PointsMaterial({
        color: outerRingColor,
        size: 0.05,
        transparent: true,
        opacity: 1,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      dustSystems.push({
        points,
        velocities,
        life: 0,
        maxLife: 1.5, // время жизни системы пыли
      });
    };

    // ===================== 5) АНИМАЦИЯ =====================
    const clock = new THREE.Clock();
    let dustTriggered = false; // чтобы спавнить пыль один раз за цикл падения

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Подпрыгивание монеты
      if (bounce) {
        // Вычисляем новую высоту по синусоиде
        const newY =
          Math.abs(Math.sin(elapsed * bounceSpeed)) * bounceAmplitude;
        group.position.y = newY;

        // Если монета почти коснулась пола и пыль ещё не спавнена, запускаем эффект пыли
        if (newY < 0.05 && !dustTriggered && dust) {
          spawnDust();
          dustTriggered = true;
        }
        if (newY >= 0.05) {
          dustTriggered = false;
        }
      }

      // Обновление систем пыли
      for (let i = dustSystems.length - 1; i >= 0; i--) {
        const ds = dustSystems[i];
        ds.life += delta;
        const positions = ds.points.geometry.attributes.position
          .array as Float32Array;
        for (let j = 0; j < ds.velocities.length; j++) {
          const idx = j * 3;
          // Применяем гравитацию к частицам
          ds.velocities[j].y -= 0.98 * delta;
          positions[idx] += ds.velocities[j].x * delta;
          positions[idx + 1] += ds.velocities[j].y * delta;
          positions[idx + 2] += ds.velocities[j].z * delta;
        }
        ds.points.geometry.attributes.position.needsUpdate = true;
        // Постепенно уменьшаем прозрачность
        (ds.points.material as THREE.PointsMaterial).opacity = Math.max(
          1 - ds.life / ds.maxLife,
          0
        );
        // Удаляем систему пыли, когда её жизнь закончилась
        if (ds.life > ds.maxLife) {
          scene.remove(ds.points);
          ds.points.geometry.dispose();
          (ds.points.material as THREE.PointsMaterial).dispose();
          dustSystems.splice(i, 1);
        }
      }

      group.rotation.y += 0.015;
      renderer.render(scene, camera);
    };
    animate();

    // ===================== 6) РЕСАЙЗ =====================
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
    bounce,
    bounceAmplitude,
    bounceSpeed,
    dust,
    dustParticleCount,
  ]);

  return (
    <div
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px`, margin: "auto" }}
    />
  );
};

export default CoinWithEmbeddedStars;
