import { useEffect, useState } from "react";

/**
 * 竖屏提示：触摸设备处于竖屏时显示，引导用户旋转手机至横屏。
 * 通过 matchMedia 监听屏幕方向，被动响应系统旋转，不主动锁屏。
 */
export default function RotateHint() {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(orientation: portrait)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(orientation: portrait)");
    const handleChange = (e) => setIsPortrait(e.matches);

    // 兼容老版本 Safari 的 addListener
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
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 text-white px-6 text-center">
      <div className="mb-6 animate-pulse">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M12 18h.01" />
          <path d="M20 8l2 2-2 2" />
          <path d="M22 10H10" />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2">请旋转手机至横屏</h2>
      <p className="text-sm text-gray-300">横屏模式可获得更好的射击体验</p>
    </div>
  );
}
