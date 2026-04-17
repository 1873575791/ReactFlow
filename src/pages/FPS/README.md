# FPS 3D射击游戏技术文档

## 项目概述

这是一个基于 React + Three.js 开发的第一人称射击游戏，实现了完整的3D游戏体验，包括角色控制、物理系统、射击系统、敌人AI等功能。

---

## 目录结构

```
src/pages/FPS/
├── index.jsx              # 主组件 - 游戏入口和状态管理
├── config.js              # 游戏配置常量
├── components/
│   ├── Weapon.js          # 武器模型创建和动画
│   └── UI.jsx             # UI组件（开始/结束界面、HUD）
├── hooks/
│   ├── useControls.js     # 键盘/鼠标/射击控制
│   └── useGameUpdate.js   # 游戏更新逻辑（移动、碰撞、敌人）
└── utils/
    ├── sceneSetup.js      # 场景初始化（灯光、地面、墙壁）
    └── enemyManager.js    # 敌人生成管理
```

---

## 核心模块说明

### 1. config.js - 游戏配置

集中管理所有游戏参数，便于调整平衡性。

```javascript
export const CONFIG = {
  playerSpeed: 0.15, // 正常移动速度
  sneakSpeed: 0.06, // 静步移动速度
  mouseSensitivity: 0.002, // 鼠标灵敏度
  bulletSpeed: 1, // 子弹速度
  enemySpeed: 0.03, // 敌人移动速度
  spawnInterval: 2000, // 敌人生成间隔(ms)
  maxEnemies: 10, // 最大敌人数量
  jumpForce: 0.35, // 跳跃力度
  gravity: 0.012, // 重力加速度
  playerHeight: 1.6, // 玩家视角高度
  maxJumpCount: 2, // 最大连跳次数
};

export const FIRE_MODE = {
  SINGLE: "single", // 单发模式
  BURST: "burst", // 三连发模式
  AUTOMATIC: "automatic", // 机枪模式
};

export const FIRE_RATE = {
  automatic: 100, // 机枪射击间隔(ms)
  burst: 80, // 三连发间隔(ms)
};
```

---

### 2. components/Weapon.js - 武器系统

#### 功能

- 创建手部和枪械的3D模型
- 管理武器动画（后坐力、行走摆动）

#### 实现原理

**武器模型构建**

```javascript
export const createWeaponModel = () => {
  const weaponGroup = new THREE.Group();

  // 创建手部（肤色方块）
  const handMaterial = new THREE.MeshStandardMaterial({ color: 0xdeb887 });

  // 创建枪身、枪管、弹匣等部件
  // 使用 BoxGeometry 和 CylinderGeometry 组合

  // 整体缩放并定位到屏幕右下方
  weaponGroup.scale.set(0.6, 0.6, 0.6);
  weaponGroup.position.set(0.2, -0.15, 0);

  return weaponGroup;
};
```

**动画更新**

```javascript
export const updateWeaponAnimation = (weapon, recoil, isMoving, isGrounded) => {
  // 后坐力恢复（指数衰减）
  recoil *= 0.85;

  // 行走摆动（正弦波）
  const walkBob = Math.sin(time) * 0.01;
  const sideBob = Math.cos(time * 0.5) * 0.005;

  // 应用变换
  weapon.position.z = -recoil * 0.3;
  weapon.rotation.x = recoil * 0.5;
};
```

---

### 3. components/UI.jsx - 界面系统

#### 组件列表

| 组件             | 功能                                      |
| ---------------- | ----------------------------------------- |
| `StartScreen`    | 开始界面，显示操作说明                    |
| `GameOverScreen` | 游戏结束界面，显示最终得分                |
| `GameHUD`        | 游戏内HUD，显示得分、血量、射击模式、准星 |

#### 准星实现

```jsx
{
  isLocked && (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-6 h-6">
        {/* 横线 */}
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-green-500" />
        {/* 竖线 */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-green-500" />
      </div>
    </div>
  );
}
```

---

### 4. hooks/useControls.js - 控制系统

#### useKeyboardControls

处理键盘输入，支持以下操作：

| 按键    | 功能                 |
| ------- | -------------------- |
| W/A/S/D | 前后左右移动         |
| Space   | 跳跃（支持二连跳）   |
| Shift   | 静步（降低移动速度） |
| 1/2/3   | 切换射击模式         |

**跳跃实现（二连跳）**

```javascript
case "Space":
  if (playerPhysicsRef.current.jumpCount < CONFIG.maxJumpCount) {
    playerPhysicsRef.current.velocityY = CONFIG.jumpForce;
    playerPhysicsRef.current.isGrounded = false;
    playerPhysicsRef.current.jumpCount++;
  }
  break;
```

#### useMouseControls

处理鼠标输入，实现第一人称视角控制：

```javascript
playerRef.current.yaw -= e.movementX * CONFIG.mouseSensitivity;
playerRef.current.pitch -= e.movementY * CONFIG.mouseSensitivity;

// 限制俯仰角范围
playerRef.current.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

// 应用旋转
camera.rotation.order = "YXZ";
camera.rotation.y = yaw;
camera.rotation.x = pitch;
```

#### useShooting

处理射击逻辑，支持三种射击模式：

| 模式   | 触发方式          | 特点           |
| ------ | ----------------- | -------------- |
| 单发   | 每次点击          | 精准射击       |
| 三连发 | 点击后连续发射3发 | 平衡精度与火力 |
| 机枪   | 按住持续射击      | 高射速         |

---

### 5. hooks/useGameUpdate.js - 游戏循环

#### updatePlayerMovement - 玩家移动与碰撞

**碰撞检测原理**

使用 **分轴碰撞检测** 实现墙壁滑动效果：

```javascript
// 1. 尝试完整移动
const fullNewPos = camera.position.clone().add(moveVector);
if (!checkCollision(fullNewPos)) {
  camera.position.add(moveVector);
} else {
  // 2. 分别尝试X和Z方向移动
  if (!checkCollision(xOnlyPos)) {
    camera.position.x += moveVector.x; // X方向可行
  }
  if (!checkCollision(zOnlyPos)) {
    camera.position.z += moveVector.z; // Z方向可行
  }
}
```

**碰撞检测函数**

```javascript
const checkCollision = (newPos) => {
  for (const obstacle of obstaclesRef.current) {
    const box = new THREE.Box3().setFromObject(obstacle);
    box.expandByScalar(playerRadius);

    // 允许跳跃上障碍物
    if (playerFeetY >= box.max.y - 0.1) continue;

    if (box.containsPoint(newPos)) return true;
  }
  return false;
};
```

#### updateGravityAndJump - 重力与跳跃

**地面检测**

使用 **射线检测** 获取脚下地面高度：

```javascript
const getGroundInfo = () => {
  const raycaster = new THREE.Raycaster();
  const origin = camera.position.clone();
  origin.y = camera.position.y - CONFIG.playerHeight + 0.1;
  raycaster.set(origin, new THREE.Vector3(0, -1, 0));
  raycaster.far = 3;

  const intersects = raycaster.intersectObjects(obstaclesRef.current);
  return intersects.length > 0
    ? { height: intersects[0].point.y, distance: intersects[0].distance }
    : { height: 0, distance: Infinity };
};
```

**重力应用**

```javascript
if (!playerPhysics.isGrounded) {
  playerPhysics.velocityY -= CONFIG.gravity; // 加速下落
  camera.position.y += playerPhysics.velocityY;

  // 落地检测
  if (camera.position.y <= targetY) {
    camera.position.y = targetY;
    playerPhysics.velocityY = 0;
    playerPhysics.isGrounded = true;
    playerPhysics.jumpCount = 0; // 重置跳跃次数
  }
}
```

#### updateEnemies - 敌人AI

**敌人行为**

- 追踪玩家位置
- 避开障碍物（墙壁滑动）
- 碰撞玩家造成伤害

```javascript
// 计算朝向玩家的方向
const direction = new THREE.Vector3();
direction.subVectors(camera.position, enemy.position);
direction.y = 0;
direction.normalize();

// 移动并检测碰撞
enemy.position.add(direction.multiplyScalar(speed));
```

---

### 6. utils/sceneSetup.js - 场景初始化

#### 场景组成

| 元素   | 说明                           |
| ------ | ------------------------------ |
| 场景   | 背景色、雾效                   |
| 相机   | 75°视野，近裁面0.1，远裁面1000 |
| 渲染器 | WebGL渲染器，开启抗锯齿和阴影  |
| 灯光   | 环境光 + 方向光                |
| 地面   | 200x200平面，可站立            |
| 墙壁   | 4面边界墙                      |
| 箱子   | 20个随机位置的障碍物           |
| 天花板 | 高度10米                       |

```javascript
export const initializeScene = (container, refs) => {
  const scene = createScene();
  const camera = createCamera();
  const renderer = createRenderer(container);

  addLights(scene);
  createFloor(scene, obstaclesRef);
  createWalls(scene, obstaclesRef);
  createObstacles(scene, obstaclesRef);

  // 添加武器模型到相机
  const weapon = createWeaponModel();
  camera.add(weapon);

  return cleanup;
};
```

---

### 7. utils/enemyManager.js - 敌人管理

```javascript
export const spawnEnemy = (scene, enemiesRef) => {
  const enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x441111 }),
  );

  // 在玩家周围30-60米处随机生成
  const angle = Math.random() * Math.PI * 2;
  const distance = 30 + Math.random() * 30;
  enemy.position.set(Math.cos(angle) * distance, 1, Math.sin(angle) * distance);

  enemy.userData.health = 3;
  enemy.userData.speed = CONFIG.enemySpeed * (0.8 + Math.random() * 0.4);

  scene.add(enemy);
  enemiesRef.current.push(enemy);
};
```

---

### 8. index.jsx - 主组件

#### 状态管理

```javascript
// 游戏状态
const [isStarted, setIsStarted] = useState(false);
const [gameOver, setGameOver] = useState(false);
const [isLocked, setIsLocked] = useState(false);

// 游戏数据
const [score, setScore] = useState(0);
const [health, setHealth] = useState(100);
const [fireMode, setFireMode] = useState(FIRE_MODE.SINGLE);

// 物理状态
const playerPhysicsRef = useRef({
  velocityY: 0,
  isGrounded: true,
  jumpCount: 0,
});
```

#### 游戏循环

```javascript
useEffect(() => {
  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);

    // 1. 更新玩家移动
    const isMoving = updatePlayerMovement(camera, obstaclesRef, moveState);

    // 2. 更新重力和跳跃
    const isGrounded = updateGravityAndJump(camera, obstaclesRef, playerPhysicsRef);

    // 3. 更新射击
    updateShooting(isShootingRef, fireModeRef, ...);

    // 4. 更新子弹
    updateBullets(bulletsRef, enemiesRef, scene, setScore);

    // 5. 更新敌人
    updateEnemies(enemiesRef, obstaclesRef, camera, setHealth, setGameOver);

    // 6. 更新武器动画
    updateWeaponAnimation(weaponRef.current, recoil, isMoving, isGrounded);

    // 7. 渲染
    renderer.render(scene, camera);
  };

  animate();
}, [isStarted, gameOver]);
```

---

## 核心技术点

### 1. 物理系统

| 特性     | 实现方式               |
| -------- | ---------------------- |
| 重力     | 每帧递减垂直速度       |
| 跳跃     | 赋予初始向上的速度     |
| 二连跳   | 计数器控制最大跳跃次数 |
| 站立检测 | 射线向下检测地面       |
| 碰撞检测 | AABB包围盒 + 射线检测  |

### 2. 碰撞检测流程

```
玩家输入 → 计算移动向量 → 尝试完整移动
                ↓
        碰撞检测 → 无碰撞 → 执行移动
                ↓
        有碰撞 → 分轴检测 → X方向可行 → X移动
                        → Z方向可行 → Z移动
                        → 都不行 → 不移动
```

### 3. 指针锁定

```javascript
// 点击画面锁定鼠标
containerRef.current.requestPointerLock();

// 监听锁定状态
document.addEventListener("pointerlockchange", () => {
  setIsLocked(!!document.pointerLockElement);
});

// 鼠标移动时检测锁定
if (!document.pointerLockElement) return;
```

---

## 操作说明

| 按键     | 功能               |
| -------- | ------------------ |
| W/A/S/D  | 移动               |
| Shift    | 静步（慢走）       |
| Space    | 跳跃（支持二连跳） |
| 鼠标移动 | 视角控制           |
| 左键     | 射击               |
| 1        | 单发模式           |
| 2        | 三连发模式         |
| 3        | 机枪模式           |

---

## 性能优化建议

1. **对象池**：复用子弹和敌人对象，减少GC压力
2. **LOD**：远处敌人使用低模
3. **空间分区**：使用四叉树优化碰撞检测
4. **Web Worker**：将物理计算移到Worker线程

---

## 扩展方向

- [ ] 添加武器切换系统
- [ ] 添加弹药和换弹机制
- [ ] 添加更多敌人类型
- [ ] 添加关卡系统
- [ ] 添加音效系统
- [ ] 添加粒子效果（枪口火焰、击中效果）
