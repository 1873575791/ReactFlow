import { useEffect, useRef, useState, useCallback } from "react";
import { CONFIG, FIRE_MODE } from "./config";
import {
  useKeyboardControls,
  useMouseControls,
  useShooting,
} from "./hooks/useControls";
import {
  updatePlayerMovement,
  updateGravityAndJump,
  updateShooting,
  updateBullets,
  updateEnemies,
} from "./hooks/useGameUpdate";
import { initializeScene } from "./utils/sceneSetup";
import { spawnEnemy } from "./utils/enemyManager";
import { updateWeaponAnimation } from "./components/Weapon";
import { StartScreen, GameOverScreen, GameHUD } from "./components/UI";

const FPSGame3D = () => {
  // Refs
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerRef = useRef({ yaw: 0, pitch: 0 });
  const playerPhysicsRef = useRef({
    velocityY: 0,
    isGrounded: true,
    jumpCount: 0,
  });
  const bulletsRef = useRef([]);
  const enemiesRef = useRef([]);
  const obstaclesRef = useRef([]);
  const weaponRef = useRef(null);
  const weaponRecoilRef = useRef(0);
  const animationIdRef = useRef(null);
  const spawnIntervalRef = useRef(null);

  // State
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [fireMode, setFireMode] = useState(FIRE_MODE.SINGLE);

  // 键盘控制
  const { fireModeRef, moveState } = useKeyboardControls(
    isStarted,
    gameOver,
    playerPhysicsRef,
    setFireMode,
  );

  // 鼠标控制
  useMouseControls(isStarted, gameOver, cameraRef, playerRef);

  // 子弹创建回调
  const handleBulletCreate = useCallback((bullet) => {
    bulletsRef.current.push(bullet);
  }, []);

  // 后坐力设置
  const setWeaponRecoil = useCallback((value) => {
    weaponRecoilRef.current = value;
  }, []);

  // 射击控制
  const { isShootingRef, lastShootTimeRef, burstCountRef, handleCreateBullet } =
    useShooting(
      isStarted,
      gameOver,
      sceneRef,
      cameraRef,
      fireModeRef,
      handleBulletCreate,
      setWeaponRecoil,
    );

  // 创建场景
  useEffect(() => {
    if (!containerRef.current || !isStarted) return;

    const cleanup = initializeScene(
      containerRef.current,
      cameraRef,
      rendererRef,
      sceneRef,
      obstaclesRef,
      weaponRef,
    );

    return cleanup;
  }, [isStarted]);

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

  // 锁定鼠标
  const handleClick = useCallback(() => {
    if (isStarted && !gameOver && containerRef.current) {
      containerRef.current.requestPointerLock();
    }
  }, [isStarted, gameOver]);

  // 生成敌人
  useEffect(() => {
    if (!isStarted || gameOver || !sceneRef.current) return;

    spawnIntervalRef.current = setInterval(() => {
      spawnEnemy(sceneRef.current, enemiesRef);
    }, CONFIG.spawnInterval);

    // 初始生成几个敌人
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnEnemy(sceneRef.current, enemiesRef), i * 500);
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

      // 更新玩家移动
      const isMoving = updatePlayerMovement(camera, obstaclesRef, moveState);

      // 更新重力和跳跃
      const isGrounded = updateGravityAndJump(
        camera,
        obstaclesRef,
        playerPhysicsRef,
      );

      // 更新射击
      updateShooting(
        isShootingRef,
        fireModeRef,
        lastShootTimeRef,
        burstCountRef,
        handleCreateBullet,
      );

      // 更新子弹
      updateBullets(bulletsRef, enemiesRef, scene, setScore);

      // 更新敌人
      updateEnemies(enemiesRef, obstaclesRef, camera, setHealth, setGameOver);

      // 更新武器动画
      weaponRecoilRef.current = updateWeaponAnimation(
        weaponRef.current,
        weaponRecoilRef.current,
        isMoving,
        isGrounded,
      );

      rendererRef.current.render(scene, camera);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isStarted, gameOver, handleCreateBullet]);

  // 开始游戏
  const startGame = () => {
    setScore(0);
    setHealth(100);
    setGameOver(false);
    setIsStarted(true);
    bulletsRef.current = [];
    enemiesRef.current = [];
    playerRef.current = { yaw: 0, pitch: 0 };
    playerPhysicsRef.current = { velocityY: 0, isGrounded: true, jumpCount: 0 };
    fireModeRef.current = FIRE_MODE.SINGLE;
    setFireMode(FIRE_MODE.SINGLE);
  };

  // 重新开始
  const restartGame = () => {
    setIsStarted(false);
    setGameOver(false);
    setScore(0);
    setHealth(100);
    bulletsRef.current = [];
    enemiesRef.current = [];
    playerPhysicsRef.current = { velocityY: 0, isGrounded: true, jumpCount: 0 };
    fireModeRef.current = FIRE_MODE.SINGLE;
    setFireMode(FIRE_MODE.SINGLE);

    setTimeout(() => {
      setIsStarted(true);
    }, 100);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* 游戏画布 */}
      <div ref={containerRef} className="w-full h-full" onClick={handleClick} />

      {/* 开始界面 */}
      {!isStarted && <StartScreen onStart={startGame} />}

      {/* 游戏结束界面 */}
      {gameOver && <GameOverScreen score={score} onRestart={restartGame} />}

      {/* HUD */}
      {isStarted && !gameOver && (
        <GameHUD
          score={score}
          health={health}
          fireMode={fireMode}
          isLocked={isLocked}
        />
      )}
    </div>
  );
};

export default FPSGame3D;
