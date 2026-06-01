import { useEffect } from "react";

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
  const isInFullscreen =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;
  if (!isInFullscreen) return Promise.resolve();

  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;
  if (!exit) return Promise.resolve();
  return exit.call(document).catch(() => {});
};

/**
 * 监听屏幕方向，横屏自动进入全屏，竖屏自动退出。
 * 仅在 enabled 为 true 时生效。被动跟随系统方向变化，不锁定屏幕方向。
 *
 * 注意：浏览器要求 requestFullscreen 在用户手势中触发。
 * 用户主动旋转手机产生的 orientationchange 在多数移动浏览器中被视为用户交互。
 * 若调用失败（如桌面浏览器或被策略拦截）静默忽略，不影响游戏。
 */
export const useAutoFullscreenOnLandscape = (enabled, elementRef) => {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const media = window.matchMedia("(orientation: landscape)");

    const syncFullscreen = (isLandscape) => {
      if (isLandscape) {
        requestFullscreen(elementRef.current).catch(() => {});
      } else {
        exitFullscreen();
      }
    };

    // 初次启用时按当前方向同步一次
    syncFullscreen(media.matches);

    const handleChange = (e) => syncFullscreen(e.matches);

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
      // 组件卸载/禁用时退出全屏，避免影响其他页面
      exitFullscreen();
    };
  }, [enabled, elementRef]);
};
