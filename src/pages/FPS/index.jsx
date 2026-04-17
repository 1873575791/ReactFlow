import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// 游戏配置
const CONFIG = {
  playerSpeed: 0.15,
  mouseSensitivity: 0.002,
  bulletSpeed: 1,
  enemySpeed: 0.03,
  spawnInterval: 2000,
  maxEnemies: 10,
};

// 移动方向状态
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

const FPSGame3D = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerRef = useRef({ yaw: 0, pitch: 0 });
  const bulletsRef = useRef([]);
  const enemiesRef = useRef([]);
  const animationIdRef = useRef(null);
  const spawnIntervalRef = useRef(null);

  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // 创建场景
  useEffect(() => {
    if (!containerRef.current || !isStarted) return;

    // 场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 100);
    sceneRef.current = scene;

    // 相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 1.6, 0);
    cameraRef.current = camera;

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 灯光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 地面
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 网格线
    const gridHelper = new THREE.GridHelper(200, 50, 0x4a5568, 0x4a5568);
    scene.add(gridHelper);

    // 天花板
    const ceilingGeometry = new THREE.PlaneGeometry(200, 200);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      side: THREE.DoubleSide,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 10;
    scene.add(ceiling);

    // 墙壁
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x374151,
      side: THREE.DoubleSide,
    });

    const walls = [
      { pos: [0, 5, -100], rot: [0, 0, 0], size: [200, 10] },
      { pos: [0, 5, 100], rot: [0, 0, 0], size: [200, 10] },
      { pos: [-100, 5, 0], rot: [0, Math.PI / 2, 0], size: [200, 10] },
      { pos: [100, 5, 0], rot: [0, Math.PI / 2, 0], size: [200, 10] },
    ];

    walls.forEach(({ pos, rot, size }) => {
      const wallGeometry = new THREE.PlaneGeometry(size[0], size[1]);
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(...pos);
      wall.rotation.set(...rot);
      scene.add(wall);
    });

    // 添加一些障碍物（箱子）
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568 });

    for (let i = 0; i < 20; i++) {
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(
        (Math.random() - 0.5) * 150,
        1,
        (Math.random() - 0.5) * 150,
      );
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
    }

    // 准星
    const crosshairGeometry = new THREE.RingGeometry(0.02, 0.03, 32);
    const crosshairMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    const crosshair = new THREE.Mesh(crosshairGeometry, crosshairMaterial);
    crosshair.position.set(0, 0, -1);
    camera.add(crosshair);
    scene.add(camera);

    // 窗口大小调整
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
    };
  }, [isStarted]);

  // 键盘控制
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const handleKeyDown = (e) => {
      switch (e.code) {
        case "KeyW":
          moveState.forward = true;
          break;
        case "KeyS":
          moveState.backward = true;
          break;
        case "KeyA":
          moveState.left = true;
          break;
        case "KeyD":
          moveState.right = true;
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case "KeyW":
          moveState.forward = false;
          break;
        case "KeyS":
          moveState.backward = false;
          break;
        case "KeyA":
          moveState.left = false;
          break;
        case "KeyD":
          moveState.right = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isStarted, gameOver]);

  // 鼠标控制
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const handleMouseMove = (e) => {
      if (!document.pointerLockElement) return;

      playerRef.current.yaw -= e.movementX * CONFIG.mouseSensitivity;
      playerRef.current.pitch -= e.movementY * CONFIG.mouseSensitivity;

      // 限制俯仰角
      playerRef.current.pitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, playerRef.current.pitch),
      );

      cameraRef.current.rotation.order = "YXZ";
      cameraRef.current.rotation.y = playerRef.current.yaw;
      cameraRef.current.rotation.x = playerRef.current.pitch;
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isStarted, gameOver]);

  // 锁定鼠标
  const handleClick = useCallback(() => {
    if (isStarted && !gameOver && containerRef.current) {
      containerRef.current.requestPointerLock();
    }
  }, [isStarted, gameOver]);

  // 指针锁定状态变化
  useEffect(() => {
    const handleLockChange = () => {
      setIsLocked(!!document.pointerLockElement);
    };

    document.addEventListener("pointerlockchange", handleLockChange);

    return () => {
      document.removeEventListener("pointerlockchange", handleLockChange);
    };
  }, []);

  // 射击
  const handleShoot = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !isLocked) return;

    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    bullet.position.copy(cameraRef.current.position);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(cameraRef.current.quaternion);

    bullet.userData.velocity = direction.multiplyScalar(CONFIG.bulletSpeed);
    bullet.userData.life = 100;

    sceneRef.current.add(bullet);
    bulletsRef.current.push(bullet);
  }, [isLocked]);

  // 鼠标点击射击
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const handleMouseDown = (e) => {
      if (e.button === 0 && document.pointerLockElement) {
        handleShoot();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isStarted, gameOver, handleShoot]);

  // 生成敌人
  useEffect(() => {
    if (!isStarted || gameOver || !sceneRef.current) return;

    const spawnEnemy = () => {
      if (enemiesRef.current.length >= CONFIG.maxEnemies) return;

      const enemyGeometry = new THREE.BoxGeometry(1, 2, 1);
      const enemyMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        emissive: 0x441111,
      });
      const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

      // 在玩家周围随机位置生成
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 30;
      enemy.position.set(
        Math.cos(angle) * distance,
        1,
        Math.sin(angle) * distance,
      );

      enemy.userData.health = 3;
      enemy.userData.speed = CONFIG.enemySpeed * (0.8 + Math.random() * 0.4);

      sceneRef.current.add(enemy);
      enemiesRef.current.push(enemy);
    };

    spawnIntervalRef.current = setInterval(spawnEnemy, CONFIG.spawnInterval);

    // 初始生成几个敌人
    for (let i = 0; i < 3; i++) {
      setTimeout(spawnEnemy, i * 500);
    }

    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
    };
  }, [isStarted, gameOver]);

  // 游戏循环
  useEffect(() => {
    if (
      !isStarted ||
      gameOver ||
      !sceneRef.current ||
      !cameraRef.current ||
      !rendererRef.current
    )
      return;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const camera = cameraRef.current;
      const scene = sceneRef.current;

      // 玩家移动
      const direction = new THREE.Vector3();
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3(1, 0, 0);
      right.applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();

      if (moveState.forward) direction.add(forward);
      if (moveState.backward) direction.sub(forward);
      if (moveState.right) direction.add(right);
      if (moveState.left) direction.sub(right);

      if (direction.length() > 0) {
        direction.normalize().multiplyScalar(CONFIG.playerSpeed);
        camera.position.add(direction);

        // 边界检测
        camera.position.x = Math.max(-95, Math.min(95, camera.position.x));
        camera.position.z = Math.max(-95, Math.min(95, camera.position.z));
      }

      // 更新子弹
      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        bullet.position.add(bullet.userData.velocity);
        bullet.userData.life--;

        // 检测子弹与敌人碰撞
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const enemy = enemiesRef.current[i];
          const dist = bullet.position.distanceTo(enemy.position);
          if (dist < 1.5) {
            enemy.userData.health--;
            if (enemy.userData.health <= 0) {
              scene.remove(enemy);
              enemiesRef.current.splice(i, 1);
              setScore((s) => s + 10);
            }
            scene.remove(bullet);
            return false;
          }
        }

        if (bullet.userData.life <= 0) {
          scene.remove(bullet);
          return false;
        }
        return true;
      });

      // 更新敌人
      enemiesRef.current.forEach((enemy) => {
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, enemy.position);
        direction.y = 0;
        direction.normalize();
        enemy.position.add(direction.multiplyScalar(enemy.userData.speed));
        enemy.lookAt(camera.position.x, enemy.position.y, camera.position.z);

        // 检测敌人与玩家碰撞
        const distToPlayer = enemy.position.distanceTo(camera.position);
        if (distToPlayer < 1.5) {
          setHealth((h) => {
            const newHealth = h - 10;
            if (newHealth <= 0) {
              setGameOver(true);
              document.exitPointerLock();
            }
            return Math.max(0, newHealth);
          });
        }
      });

      rendererRef.current.render(scene, camera);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isStarted, gameOver]);

  // 开始游戏
  const startGame = () => {
    setScore(0);
    setHealth(100);
    setGameOver(false);
    setIsStarted(true);
    bulletsRef.current = [];
    enemiesRef.current = [];
    playerRef.current = { yaw: 0, pitch: 0 };
  };

  // 重新开始
  const restartGame = () => {
    setIsStarted(false);
    setGameOver(false);
    setScore(0);
    setHealth(100);
    bulletsRef.current = [];
    enemiesRef.current = [];

    setTimeout(() => {
      setIsStarted(true);
    }, 100);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* 游戏画布 */}
      <div ref={containerRef} className="w-full h-full" onClick={handleClick} />

      {/* 开始界面 */}
      {!isStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <h1 className="text-5xl font-bold text-white mb-8">
            3D FPS 射击游戏
          </h1>
          <button
            onClick={startGame}
            className="px-10 py-5 bg-green-500 text-white text-2xl font-bold rounded-lg hover:bg-green-600 transition-colors"
          >
            开始游戏
          </button>
          <div className="mt-8 text-gray-400 text-center">
            <p className="mb-2">WASD 移动 | 鼠标瞄准 | 左键射击</p>
            <p>点击画面锁定鼠标</p>
          </div>
        </div>
      )}

      {/* 游戏结束界面 */}
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <h1 className="text-5xl font-bold text-red-500 mb-4">游戏结束</h1>
          <p className="text-3xl text-white mb-8">最终得分: {score}</p>
          <button
            onClick={restartGame}
            className="px-10 py-5 bg-green-500 text-white text-2xl font-bold rounded-lg hover:bg-green-600 transition-colors"
          >
            再来一局
          </button>
        </div>
      )}

      {/* HUD */}
      {isStarted && !gameOver && (
        <>
          {/* 准星提示 */}
          {!isLocked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <p className="text-white text-2xl bg-black/50 px-6 py-3 rounded-lg">
                点击画面开始控制
              </p>
            </div>
          )}

          {/* 得分 */}
          <div className="absolute top-4 left-4 text-white text-2xl font-bold z-20">
            得分: {score}
          </div>

          {/* 血量 */}
          <div className="absolute top-4 right-4 z-20">
            <div className="text-white text-xl mb-2">HP</div>
            <div className="w-48 h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${health}%` }}
              />
            </div>
          </div>

          {/* 准星 */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div
                className="relative"
                style={{ transform: "translate(-50%, -50%)" }}
              >
                <div className="w-6 h-0.5 bg-green-500 absolute -left-3 top-0" />
                <div className="w-0.5 h-6 bg-green-500 absolute left-0 -top-3" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FPSGame3D;
