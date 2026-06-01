import { useCallback, useRef } from "react";
import { CONFIG } from "../config";
import { moveState } from "./useControls";

// 是否为触摸设备
export const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
};

// 触摸视角灵敏度（比鼠标略高，触摸滑动幅度有限）
const TOUCH_LOOK_SENSITIVITY = 0.005;

/**
 * 触摸操控：
 * - 左侧虚拟摇杆控制移动（写入共享的 moveState）
 * - 右侧滑动控制视角（直接更新相机朝向）
 */
export const useTouchControls = (cameraRef, playerRef) => {
  // 视角滑动的上一帧坐标
  const lookLastRef = useRef(null);

  // 摇杆：根据归一化向量更新移动状态
  const handleJoystickMove = useCallback((vectorX, vectorY) => {
    const deadZone = 0.2;
    moveState.forward = vectorY < -deadZone;
    moveState.backward = vectorY > deadZone;
    moveState.left = vectorX < -deadZone;
    moveState.right = vectorX > deadZone;
  }, []);

  // 摇杆释放：停止移动
  const handleJoystickEnd = useCallback(() => {
    moveState.forward = false;
    moveState.backward = false;
    moveState.left = false;
    moveState.right = false;
  }, []);

  // 视角滑动开始
  const handleLookStart = useCallback((clientX, clientY) => {
    lookLastRef.current = { x: clientX, y: clientY };
  }, []);

  // 视角滑动中：根据位移更新相机
  const handleLookMove = useCallback(
    (clientX, clientY) => {
      if (!lookLastRef.current || !cameraRef.current) return;

      const deltaX = clientX - lookLastRef.current.x;
      const deltaY = clientY - lookLastRef.current.y;
      lookLastRef.current = { x: clientX, y: clientY };

      playerRef.current.yaw -= deltaX * TOUCH_LOOK_SENSITIVITY;
      playerRef.current.pitch -= deltaY * TOUCH_LOOK_SENSITIVITY;
      playerRef.current.pitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, playerRef.current.pitch),
      );

      cameraRef.current.rotation.order = "YXZ";
      cameraRef.current.rotation.y = playerRef.current.yaw;
      cameraRef.current.rotation.x = playerRef.current.pitch;
    },
    [cameraRef, playerRef],
  );

  // 视角滑动结束
  const handleLookEnd = useCallback(() => {
    lookLastRef.current = null;
  }, []);

  return {
    handleJoystickMove,
    handleJoystickEnd,
    handleLookStart,
    handleLookMove,
    handleLookEnd,
  };
};

// 触发一次跳跃（复用与键盘相同的物理逻辑）
export const triggerJump = (playerPhysicsRef) => {
  if (playerPhysicsRef.current.jumpCount < CONFIG.maxJumpCount) {
    playerPhysicsRef.current.velocityY = CONFIG.jumpForce;
    playerPhysicsRef.current.isGrounded = false;
    playerPhysicsRef.current.jumpCount++;
  }
};
