// 游戏配置
export const CONFIG = {
  playerSpeed: 0.15,
  sneakSpeed: 0.06,
  mouseSensitivity: 0.002,
  bulletSpeed: 1,
  enemySpeed: 0.03,
  spawnInterval: 2000,
  maxEnemies: 10,
  jumpForce: 0.35,
  gravity: 0.012,
  playerHeight: 1.6,
  maxJumpCount: 2,
};

// 射击模式
export const FIRE_MODE = {
  SINGLE: "single", // 单发
  BURST: "burst", // 三连发
  AUTOMATIC: "automatic", // 机枪
};

// 射击间隔配置
export const FIRE_RATE = {
  automatic: 100,
  burst: 80,
};
