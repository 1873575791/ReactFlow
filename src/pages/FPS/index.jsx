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
  jumpForce: 0.35,
  gravity: 0.012,
  playerHeight: 1.6,
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
  const playerPhysicsRef = useRef({ velocityY: 0, isGrounded: true });
  const bulletsRef = useRef([]);
  const enemiesRef = useRef([]);
  const obstaclesRef = useRef([]);
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

    // 添加相机到场景
    scene.add(camera);

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
      obstaclesRef.current.push(wall);
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
      obstaclesRef.current.push(box);
    }

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
        case "Space":
          // 跳跃
          if (playerPhysicsRef.current.isGrounded) {
            playerPhysicsRef.current.velocityY = CONFIG.jumpForce;
            playerPhysicsRef.current.isGrounded = false;
          }
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

    // 使用 getWorldDirection 获取相机的精确朝向
    const direction = new THREE.Vector3();
    cameraRef.current.getWorldDirection(direction);

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
        direction.normalize();

        const playerRadius = 0.5;
        const moveVector = direction.clone().multiplyScalar(CONFIG.playerSpeed);

        // 分别检测X和Z方向的碰撞，实现墙壁滑动效果
        // 检测水平碰撞时，考虑玩家是否可以站在障碍物上
        const checkCollision = (newPos) => {
          for (const obstacle of obstaclesRef.current) {
            const box = new THREE.Box3().setFromObject(obstacle);
            box.expandByScalar(playerRadius);
            const playerFeetY = camera.position.y - CONFIG.playerHeight;
            // 如果玩家脚部高于障碍物顶部，不发生碰撞（可以跳上）
            if (playerFeetY >= box.max.y - 0.1) {
              continue;
            }
            // 使用当前相机高度进行碰撞检测
            if (
              box.containsPoint(
                new THREE.Vector3(newPos.x, camera.position.y, newPos.z),
              )
            ) {
              return true;
            }
          }
          return false;
        };

        // 先尝试完整移动
        const fullNewPos = camera.position.clone().add(moveVector);
        if (!checkCollision(fullNewPos)) {
          camera.position.add(moveVector);
        } else {
          // 完整移动有碰撞，分别尝试X和Z方向
          const xOnlyPos = camera.position.clone();
          xOnlyPos.x += moveVector.x;

          const zOnlyPos = camera.position.clone();
          zOnlyPos.z += moveVector.z;

          // 检查X方向移动
          if (!checkCollision(xOnlyPos)) {
            camera.position.x = xOnlyPos.x;
          }

          // 检查Z方向移动
          if (!checkCollision(zOnlyPos)) {
            camera.position.z = zOnlyPos.z;
          }
        }

        // 边界检测
        camera.position.x = Math.max(-95, Math.min(95, camera.position.x));
        camera.position.z = Math.max(-95, Math.min(95, camera.position.z));
      }

      // 重力和跳跃系统
      const playerRadius = 0.5;
      const playerPhysics = playerPhysicsRef.current;

      // 检测脚下的地面/障碍物高度
      const getGroundHeight = (x, z) => {
        let maxHeight = 0; // 默认地面高度
        const feetY = camera.position.y - CONFIG.playerHeight;

        for (const obstacle of obstaclesRef.current) {
          const box = new THREE.Box3().setFromObject(obstacle);
          // 检查玩家是否在障碍物的XZ范围内
          if (
            x >= box.min.x - playerRadius &&
            x <= box.max.x + playerRadius &&
            z >= box.min.z - playerRadius &&
            z <= box.max.z + playerRadius
          ) {
            // 如果玩家在障碍物上方
            if (feetY >= box.max.y - 0.5 && feetY <= box.max.y + 2) {
              maxHeight = Math.max(maxHeight, box.max.y);
            }
          }
        }
        return maxHeight;
      };

      const groundHeight = getGroundHeight(
        camera.position.x,
        camera.position.z,
      );
      const targetY = groundHeight + CONFIG.playerHeight;

      // 应用重力
      if (!playerPhysics.isGrounded) {
        playerPhysics.velocityY -= CONFIG.gravity;
        camera.position.y += playerPhysics.velocityY;

        // 检测是否落地
        if (camera.position.y <= targetY) {
          camera.position.y = targetY;
          playerPhysics.velocityY = 0;
          playerPhysics.isGrounded = true;
        }
      } else {
        // 在地面上时，跟随地面高度
        if (camera.position.y < targetY) {
          camera.position.y = targetY;
        } else if (camera.position.y > targetY + 0.1) {
          // 走出障碍物边缘，开始下落
          playerPhysics.isGrounded = false;
        }
      }

      // 防止穿透天花板
      if (camera.position.y > 10) {
        camera.position.y = 10;
        playerPhysics.velocityY = 0;
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

      // 敌人碰撞检测函数
      const enemyRadius = 0.6;
      const checkEnemyCollision = (pos, excludeEnemy) => {
        for (const obstacle of obstaclesRef.current) {
          const box = new THREE.Box3().setFromObject(obstacle);
          box.expandByScalar(enemyRadius);
          if (box.containsPoint(new THREE.Vector3(pos.x, 1, pos.z))) {
            return true;
          }
        }
        // 检测与其他敌人的碰撞
        for (const otherEnemy of enemiesRef.current) {
          if (otherEnemy !== excludeEnemy) {
            const dist = pos.distanceTo(otherEnemy.position);
            if (dist < enemyRadius * 2) {
              return true;
            }
          }
        }
        return false;
      };

      // 更新敌人
      enemiesRef.current.forEach((enemy) => {
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, enemy.position);
        direction.y = 0;
        direction.normalize();

        const moveVector = direction
          .clone()
          .multiplyScalar(enemy.userData.speed);

        // 先尝试完整移动
        const fullNewPos = enemy.position.clone().add(moveVector);
        if (!checkEnemyCollision(fullNewPos, enemy)) {
          enemy.position.add(moveVector);
        } else {
          // 完整移动有碰撞，分别尝试X和Z方向
          const xOnlyPos = enemy.position.clone();
          xOnlyPos.x += moveVector.x;

          const zOnlyPos = enemy.position.clone();
          zOnlyPos.z += moveVector.z;

          // 检查X方向移动
          if (!checkEnemyCollision(xOnlyPos, enemy)) {
            enemy.position.x = xOnlyPos.x;
          }

          // 检查Z方向移动
          if (!checkEnemyCollision(zOnlyPos, enemy)) {
            enemy.position.z = zOnlyPos.z;
          }
        }

        // 边界检测
        enemy.position.x = Math.max(-95, Math.min(95, enemy.position.x));
        enemy.position.z = Math.max(-95, Math.min(95, enemy.position.z));

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
    playerPhysicsRef.current = { velocityY: 0, isGrounded: true };
  };

  // 重新开始
  const restartGame = () => {
    setIsStarted(false);
    setGameOver(false);
    setScore(0);
    setHealth(100);
    bulletsRef.current = [];
    enemiesRef.current = [];
    playerPhysicsRef.current = { velocityY: 0, isGrounded: true };

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
            <p className="mb-2">WASD 移动 | 空格跳跃 | 鼠标瞄准 | 左键射击</p>
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
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 top-18.25">
              <div className="relative w-6 h-6">
                {/* 横线 */}
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-green-500 -translate-y-1/2" />
                {/* 竖线 */}
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-green-500 -translate-x-1/2" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FPSGame3D;
