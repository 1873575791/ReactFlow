// 横屏锁定工具：进入游戏锁定横屏，退出时解锁。
// 注意：移动浏览器要求处于全屏状态下 orientation.lock 才生效，
// 因此这里先请求全屏再锁定横屏。所有 API 都做了能力检测与静默降级。

const requestFullscreen = (element) => {
  const target = element ?? document.documentElement;
  const request =
    target.requestFullscreen ||
    target.webkitRequestFullscreen ||
    target.mozRequestFullScreen ||
    target.msRequestFullscreen;
  if (!request) return Promise.reject(new Error("fullscreen unsupported"));
  return request.call(target);
};

const exitFullscreen = () => {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    return Promise.resolve();
  }
  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;
  if (!exit) return Promise.resolve();
  return exit.call(document);
};

// 锁定横屏。全屏与锁屏失败时静默降级，不阻断游戏开始。
export const lockLandscape = async (element) => {
  try {
    await requestFullscreen(element);
  } catch {
    // 部分浏览器/桌面环境不支持全屏，忽略后继续尝试锁屏
  }

  const orientation = window.screen?.orientation;
  if (orientation?.lock) {
    try {
      await orientation.lock("landscape");
    } catch {
      // 桌面或不支持锁屏的浏览器会抛错，忽略即可
    }
  }
};

// 解锁屏幕方向并退出全屏。
export const unlockOrientation = async () => {
  const orientation = window.screen?.orientation;
  if (orientation?.unlock) {
    try {
      orientation.unlock();
    } catch {
      // 忽略不支持的情况
    }
  }

  try {
    await exitFullscreen();
  } catch {
    // 忽略退出全屏失败
  }
};
