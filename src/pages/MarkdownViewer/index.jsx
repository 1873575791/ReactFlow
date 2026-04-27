import { useState, useCallback, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

function MarkdownViewer() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".md")) {
      alert("请选择 .md 格式的文件");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setContent(event.target?.result ?? "");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".md")) {
      alert("请选择 .md 格式的文件");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setContent(event.target?.result ?? "");
    };
    reader.readAsText(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleReset = useCallback(() => {
    setContent("");
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ colorScheme: "light" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 border-b border-gray-200">
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors text-sm font-medium">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          选择 Markdown 文件
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {fileName && (
          <>
            <span className="text-sm text-gray-600 truncate max-w-xs">
              {fileName}
            </span>
            <button
              onClick={handleReset}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              清除
            </button>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-white">
        {!content ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="h-full flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg">拖拽或点击上方按钮选择 .md 文件</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-8 py-6">
            <article className="prose prose-slate prose-headings:font-semibold prose-a:text-indigo-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 max-w-none text-slate-800">
              <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {content}
              </Markdown>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}

export default MarkdownViewer;
