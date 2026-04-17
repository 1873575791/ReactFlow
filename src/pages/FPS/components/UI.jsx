import { FIRE_MODE } from "../config";

// 开始界面
export const StartScreen = ({ onStart }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
    <h1 className="text-5xl font-bold text-white mb-8">3D FPS 射击游戏</h1>
    <button
      onClick={onStart}
      className="px-10 py-5 bg-green-500 text-white text-2xl font-bold rounded-lg hover:bg-green-600 transition-colors"
    >
      开始游戏
    </button>
    <div className="mt-8 text-gray-400 text-center">
      <p className="mb-2">
        WASD 移动 | Shift静步 | 空格二连跳 | 鼠标瞄准 | 左键射击
      </p>
      <p className="mb-2">[1]单发 [2]三连发 [3]机枪</p>
      <p>点击画面锁定鼠标</p>
    </div>
  </div>
);

// 游戏结束界面
export const GameOverScreen = ({ score, onRestart }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
    <h1 className="text-5xl font-bold text-red-500 mb-4">游戏结束</h1>
    <p className="text-3xl text-white mb-8">最终得分: {score}</p>
    <button
      onClick={onRestart}
      className="px-10 py-5 bg-green-500 text-white text-2xl font-bold rounded-lg hover:bg-green-600 transition-colors"
    >
      再来一局
    </button>
  </div>
);

// HUD界面
export const GameHUD = ({ score, health, fireMode, isLocked }) => {
  const getFireModeName = () => {
    switch (fireMode) {
      case FIRE_MODE.SINGLE:
        return "单发";
      case FIRE_MODE.BURST:
        return "三连发";
      case FIRE_MODE.AUTOMATIC:
        return "机枪";
      default:
        return "单发";
    }
  };

  return (
    <>
      {/* 准星提示 */}
      {!isLocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <p className="text-white text-2xl bg-black/50 px-6 py-3 rounded-lg">
            点击画面开始控制
          </p>
        </div>
      )}

      {/* 得分 */}
      <div className="absolute top-4 left-4 text-white text-2xl font-bold z-20">
        得分: {score}
      </div>

      {/* 射击模式 */}
      <div className="absolute top-16 left-4 z-20">
        <div className="text-white text-lg">模式: {getFireModeName()}</div>
        <div className="text-gray-400 text-sm mt-1">
          [1]单发 [2]三连发 [3]机枪
        </div>
      </div>

      {/* 血量 */}
      <div className="absolute top-4 right-4 z-20">
        <div className="text-white text-xl mb-2">HP</div>
        <div className="w-48 h-4 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${health}%` }}
          />
        </div>
      </div>

      {/* 准星 */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 top-18.25">
          <div className="relative w-6 h-6">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-green-500 -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-green-500 -translate-x-1/2" />
          </div>
        </div>
      )}
    </>
  );
};
