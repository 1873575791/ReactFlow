import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { CONFIG, FIRE_MODE } from "../config";

// 移动状态
export const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sneak: false,
};

export const useKeyboardControls = (isStarted, gameOver, playerPhysicsRef, setFireMode) => {
  const fireModeRef = useRef(FIRE_MODE.SINGLE);

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
          // 跳跃 - 支持二连跳
          if (playerPhysicsRef.current.jumpCount < CONFIG.maxJumpCount) {
            playerPhysicsRef.current.velocityY = CONFIG.jumpForce;
            playerPhysicsRef.current.isGrounded = false;
            playerPhysicsRef.current.jumpCount++;
          }
          break;
        case "ShiftLeft":
        case "ShiftRight":
          moveState.sneak = true;
          break;
        case "Digit1":
          fireModeRef.current = FIRE_MODE.SINGLE;
          setFireMode(FIRE_MODE.SINGLE);
          break;
        case "Digit2":
          fireModeRef.current = FIRE_MODE.BURST;
          setFireMode(FIRE_MODE.BURST);
          break;
        case "Digit3":
          fireModeRef.current = FIRE_MODE.AUTOMATIC;
          setFireMode(FIRE_MODE.AUTOMATIC);
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
        case "ShiftLeft":
        case "ShiftRight":
          moveState.sneak = false;
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
  }, [isStarted, gameOver, playerPhysicsRef, setFireMode]);

  return { moveState, fireModeRef };
};

// 鼠标控制
export const useMouseControls = (isStarted, gameOver, cameraRef, playerRef) => {
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const handleMouseMove = (e) => {
      if (!document.pointerLockElement) return;

      playerRef.current.yaw -= e.movementX * CONFIG.mouseSensitivity;
      playerRef.current.pitch -= e.movementY * CONFIG.mouseSensitivity;

      playerRef.current.pitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, playerRef.current.pitch)
      );

      cameraRef.current.rotation.order = "YXZ";
      cameraRef.current.rotation.y = playerRef.current.yaw;
      cameraRef.current.rotation.x = playerRef.current.pitch;
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isStarted, gameOver, cameraRef, playerRef]);
};

// 射击控制
export const useShooting = (
  isStarted,
  gameOver,
  sceneRef,
  cameraRef,
  fireModeRef,
  createBullet,
  setWeaponRecoil
) => {
  const isShootingRef = useRef(false);
  const lastShootTimeRef = useRef(0);
  const burstCountRef = useRef(0);

  // 创建子弹
  const handleCreateBullet = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) return;

    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    bullet.position.copy(cameraRef.current.position);

    const direction = new THREE.Vector3();
    cameraRef.current.getWorldDirection(direction);

    bullet.userData.velocity = direction.multiplyScalar(CONFIG.bulletSpeed);
    bullet.userData.life = 100;

    sceneRef.current.add(bullet);
    createBullet(bullet);
    setWeaponRecoil(0.15);
  }, [sceneRef, cameraRef, createBullet, setWeaponRecoil]);

  useEffect(() => {
    if (!isStarted || gameOver) return;

    const handleMouseDown = (e) => {
      if (e.button === 0 && document.pointerLockElement) {
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
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 0) {
        isShootingRef.current = false;
        burstCountRef.current = 0;
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isStarted, gameOver, fireModeRef, handleCreateBullet]);

  return { isShootingRef, lastShootTimeRef, burstCountRef, handleCreateBullet };
};
