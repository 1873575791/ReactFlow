import { useState, useRef } from "react";

function TextToSpeech() {
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState([]);
  const utteranceRef = useRef(null);

  // 预处理文本：将连续数字拆分为单个字符，避免被读成数值
  const preprocessText = (input) => {
    return input.replace(/\d/g, (digit) => digit + " ");
  };

  const handleSpeak = (content) => {
    if (!content.trim()) return;

    // 停止当前播放
    window.speechSynthesis.cancel();

    const processed = preprocessText(content);
    const utterance = new SpeechSynthesisUtterance(processed);
    utterance.lang = "zh-CN";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = () => {
    if (text.trim()) {
      handleSpeak(text);
      setHistory((prev) => [{ id: Date.now(), text: text.trim() }, ...prev]);
      setText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="max-w-2xl mx-auto my-4 sm:my-10 px-4 sm:px-6 py-4 sm:py-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
        文字转语音
      </h1>

      {/* 输入区域 */}
      <div className="flex gap-2 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入文字，按 Enter 播放语音..."
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-500 text-white text-sm sm:text-base rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          播放
        </button>
      </div>

      {/* 播放状态 */}
      {isSpeaking && (
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 px-3 py-2 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-sm">正在播放...</span>
          </div>
          <button
            onClick={handleStop}
            className="px-3 py-1 bg-red-500 text-white text-xs sm:text-sm rounded-md hover:bg-red-600 active:bg-red-700 transition-colors"
          >
            停止
          </button>
        </div>
      )}

      {/* 历史记录 */}
      {history.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-700">
            播放历史
          </h2>
          <ul className="space-y-2">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <span className="text-sm sm:text-base text-gray-800 truncate mr-2 sm:mr-3">
                  {item.text}
                </span>
                <button
                  onClick={() => handleSpeak(item.text)}
                  className="shrink-0 px-2.5 sm:px-3 py-1 text-xs sm:text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 active:bg-blue-100 transition-colors"
                >
                  重播
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TextToSpeech;
