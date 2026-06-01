import { useRef, useState, useCallback } from "react";
import { FIRE_MODE } from "../config";

// 虚拟摇杆：拖动内圈，输出归一化方向向量
function VirtualJoystick({ onMove, onEnd }) {
  const baseRef = useRef(null);
  const touchIdRef = useRef(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });

  const maxRadius = 45;

  const updateFromTouch = useCallback(
    (clientX, clientY) => {
      if (!baseRef.current) return;
      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let offsetX = clientX - centerX;
      let offsetY = clientY - centerY;

      const distance = Math.hypot(offsetX, offsetY);
      if (distance > maxRadius) {
        const scale = maxRadius / distance;
        offsetX *= scale;
        offsetY *= scale;
      }

      setKnobOffset({ x: offsetX, y: offsetY });
      onMove(offsetX / maxRadius, offsetY / maxRadius);
    },
    [onMove],
  );

  const handleTouchStart = useCallback(
    (e) => {
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      updateFromTouch(touch.clientX, touch.clientY);
    },
    [updateFromTouch],
  );

  const handleTouchMove = useCallback(
    (e) => {
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchIdRef.current,
      );
      if (!touch) return;
      updateFromTouch(touch.clientX, touch.clientY);
    },
    [updateFromTouch],
  );

  const handleTouchEnd = useCallback(
    (e) => {
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchIdRef.current,
      );
      if (!touch) return;
      touchIdRef.current = null;
      setKnobOffset({ x: 0, y: 0 });
      onEnd();
    },
    [onEnd],
  );

  return (
    <div
      ref={baseRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="absolute bottom-8 left-6 z-30 w-32 h-32 rounded-full bg-white/10 border-2 border-white/30 touch-none select-none"
      style={{ touchAction: "none" }}
    >
      <div
        className="absolute top-1/2 left-1/2 w-14 h-14 rounded-full bg-white/40 border border-white/50"
        style={{
          transform: `translate(calc(-50% + ${knobOffset.x}px), calc(-50% + ${knobOffset.y}px))`,
        }}
      />
    </div>
  );
}

// 圆形操作按钮
function ActionButton({ label, onPress, className }) {
  const handleStart = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onPress();
    },
    [onPress],
  );

  return (
    <button
      type="button"
      onTouchStart={handleStart}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex items-center justify-center rounded-full text-white font-bold border-2 select-none touch-none active:scale-95 transition-transform ${className}`}
      style={{ touchAction: "none" }}
    >
      {label}
    </button>
  );
}

/**
 * 触摸操控层：左摇杆 + 右侧操作按钮（射击/跳跃/切火力）。
 * 视角滑动由父级的全屏图层处理。
 */
export default function TouchControls({
  onJoystickMove,
  onJoystickEnd,
  onShoot,
  onJump,
  onCycleFireMode,
  fireMode,
}) {
  const getFireLabel = () => {
    switch (fireMode) {
      case FIRE_MODE.SINGLE:
        return "单";
      case FIRE_MODE.BURST:
        return "连";
      case FIRE_MODE.AUTOMATIC:
        return "枪";
      default:
        return "单";
    }
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* 左侧摇杆 */}
      <div className="pointer-events-auto">
        <VirtualJoystick onMove={onJoystickMove} onEnd={onJoystickEnd} />
      </div>

      {/* 右侧操作按钮组 */}
      <div className="absolute bottom-8 right-6 z-30 flex flex-col items-end gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          <ActionButton
            label={getFireLabel()}
            onPress={onCycleFireMode}
            className="w-12 h-12 text-base bg-blue-500/60 border-blue-300/60"
          />
          <ActionButton
            label="跳"
            onPress={onJump}
            className="w-16 h-16 text-lg bg-green-500/60 border-green-300/60"
          />
        </div>
        <ActionButton
          label="射击"
          onPress={onShoot}
          className="w-24 h-24 text-xl bg-red-500/60 border-red-300/60"
        />
      </div>
    </div>
  );
}
