import { useEffect, useRef, useState, useCallback } from "react";
import { CONFIG, FIRE_MODE } from "./config";
import {
  useKeyboardControls,
  useMouseControls,
  useShooting,
} from "./hooks/useControls";
import {
  isTouchDevice,
  useTouchControls,
  triggerJump,
} from "./hooks/useTouchControls";
import { useAutoFullscreenOnLandscape } from "./hooks/useAutoFullscreen";
import TouchControls from "./components/TouchControls";
import RotateHint from "./components/RotateHint";
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
  const rootRef = useRef(null);
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

  // 是否触摸设备（移动端）。惰性初始化，仅检测一次
  const [isTouch] = useState(() => isTouchDevice());

  // 键盘控制
  const { fireModeRef, moveState } = useKeyboardControls(
    isStarted,
    gameOver,
    playerPhysicsRef,
    setFireMode,
  );

  // 鼠标控制（触摸设备不启用 pointerLock 鼠标视角）
  useMouseControls(isStarted, gameOver, cameraRef, playerRef);

  // 触摸控制（虚拟摇杆 + 滑动视角）
  const {
    handleJoystickMove,
    handleJoystickEnd,
    handleLookStart,
    handleLookMove,
    handleLookEnd,
  } = useTouchControls(cameraRef, playerRef);

  // 横屏自动全屏：触摸设备 + 游戏进行中启用，被动跟随系统方向变化。
  // 全屏目标是最外层根节点，确保 TouchControls / RotateHint 等子节点也在全屏元素内不被隐藏
  useAutoFullscreenOnLandscape(
    isTouch && isStarted && !gameOver,
    rootRef,
  );

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

  // 触摸设备：阻止双指缩放与 iOS Safari 的捏合手势，保证射击/视角不被系统手势打断
  useEffect(() => {
    if (!isTouch) return;
    const preventMultiTouch = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const preventGesture = (e) => e.preventDefault();

    document.addEventListener("touchmove", preventMultiTouch, {
      passive: false,
    });
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);

    return () => {
      document.removeEventListener("touchmove", preventMultiTouch);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
    };
  }, [isTouch]);

  // 离开 FPS 页面时无需特殊清理屏幕方向（被动跟随系统）

  // 锁定鼠标（触摸设备不需要 pointerLock）
  const handleClick = useCallback(() => {
    if (isTouch) return;
    if (isStarted && !gameOver && containerRef.current) {
      containerRef.current.requestPointerLock();
    }
  }, [isTouch, isStarted, gameOver]);

  // 触摸射击：支持按住持续开火（单发触发一次，三连发补足计数，机枪由 updateShooting 持续循环）
  const handleTouchShootStart = useCallback(() => {
    if (!isStarted || gameOver) return;
    isShootingRef.current = true;
    const currentMode = fireModeRef.current;

    if (currentMode === FIRE_MODE.SINGLE) {
      handleCreateBullet();
    } else if (currentMode === FIRE_MODE.BURST) {
      burstCountRef.current = 3;
      lastShootTimeRef.current = Date.now();
      handleCreateBullet();
      burstCountRef.current--;
    }
    // AUTOMATIC 模式由 updateShooting 循环 createBullet，按住期间持续开火
  }, [
    isStarted,
    gameOver,
    isShootingRef,
    fireModeRef,
    burstCountRef,
    lastShootTimeRef,
    handleCreateBullet,
  ]);

  const handleTouchShootEnd = useCallback(() => {
    isShootingRef.current = false;
    burstCountRef.current = 0;
  }, [isShootingRef, burstCountRef]);

  // 触摸跳跃
  const handleTouchJump = useCallback(() => {
    if (!isStarted || gameOver) return;
    triggerJump(playerPhysicsRef);
  }, [isStarted, gameOver]);

  // 触摸切换火力模式（循环 单发 -> 三连发 -> 机枪）
  const handleCycleFireMode = useCallback(() => {
    const order = [FIRE_MODE.SINGLE, FIRE_MODE.BURST, FIRE_MODE.AUTOMATIC];
    const currentIndex = order.indexOf(fireModeRef.current);
    const next = order[(currentIndex + 1) % order.length];
    fireModeRef.current = next;
    setFireMode(next);
  }, [fireModeRef]);

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
    // 触摸设备无需 pointerLock，直接进入控制状态以显示准星和操控层
    setIsLocked(isTouch);
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
      setIsLocked(isTouch);
    }, 100);
  };

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden bg-black"
      style={{ touchAction: "none" }}
    >
      {/* 游戏画布 */}
      <div
        ref={containerRef}
        className="w-full h-full"
        onClick={handleClick}
        style={{ touchAction: "none" }}
      />

      {/* 触摸视角滑动层（仅触摸设备，游戏进行中）。
          覆盖全屏接收滑动手势更新视角，摇杆/按钮在其上层（z-30）不受影响 */}
      {isTouch && isStarted && !gameOver && (
        <div
          className="absolute inset-0 z-20"
          style={{ touchAction: "none" }}
          onTouchStart={(e) => {
            const touch = e.changedTouches[0];
            handleLookStart(touch.clientX, touch.clientY);
          }}
          onTouchMove={(e) => {
            const touch = e.changedTouches[0];
            handleLookMove(touch.clientX, touch.clientY);
          }}
          onTouchEnd={handleLookEnd}
          onTouchCancel={handleLookEnd}
        />
      )}

      {/* 触摸操控 UI（摇杆 + 按钮） */}
      {isTouch && isStarted && !gameOver && (
        <TouchControls
          onJoystickMove={handleJoystickMove}
          onJoystickEnd={handleJoystickEnd}
          onShootStart={handleTouchShootStart}
          onShootEnd={handleTouchShootEnd}
          onJump={handleTouchJump}
          onCycleFireMode={handleCycleFireMode}
          fireMode={fireMode}
        />
      )}

      {/* 竖屏提示（触摸设备游戏进行中，被动响应系统方向变化） */}
      {isTouch && isStarted && !gameOver && <RotateHint />}

      {/* 开始界面 */}
      {!isStarted && <StartScreen onStart={startGame} isTouch={isTouch} />}

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
