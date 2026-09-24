import { useCallback, useRef, useState } from "react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "./markdown-viewer.css";

const sampleMarkdown = `# Markdown 文档

在左侧输入 Markdown，右侧会实时展示渲染结果。

## 常用格式

- **粗体文本**与*斜体文本*
- [链接](https://www.example.com)
- 行内代码 \`const ready = true\`

> 这是一段引用内容。

| 功能 | 状态 |
| --- | --- |
| 实时预览 | 已开启 |
| GFM 表格 | 已支持 |
| 代码高亮 | 已支持 |

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`
`;

function MarkdownViewer() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [activePane, setActivePane] = useState("editor");
  const fileInputRef = useRef(null);

  const loadFile = useCallback((file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".md")) {
      window.alert("请选择 .md 格式的文件");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setContent(event.target?.result ?? "");
      setFileName(file.name);
      setActivePane("preview");
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = useCallback(
    (event) => {
      loadFile(event.target.files?.[0]);
      event.target.value = "";
    },
    [loadFile],
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      loadFile(event.dataTransfer.files?.[0]);
    },
    [loadFile],
  );

  const handleClear = useCallback(() => {
    setContent("");
    setFileName("");
    setActivePane("editor");
  }, []);

  const handleSample = useCallback(() => {
    setContent(sampleMarkdown);
    setFileName("");
  }, []);

  const lineCount = content ? content.split("\n").length : 0;

  return (
    <div className="markdown-workspace">
      <header className="markdown-toolbar">
        <div className="markdown-title">
          <span className="markdown-mark" aria-hidden="true">
            M↓
          </span>
          <div>
            <h1>Markdown 预览</h1>
            <p>{fileName || "未命名文档"}</p>
          </div>
        </div>

        <div className="markdown-actions">
          <button
            type="button"
            className="action-button"
            onClick={handleSample}
          >
            载入示例
          </button>
          <button
            type="button"
            className="action-button"
            onClick={() => fileInputRef.current?.click()}
          >
            导入 .md
          </button>
          <button
            type="button"
            className="action-button action-button-danger"
            onClick={handleClear}
            disabled={!content}
          >
            清空
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,text/markdown"
            onChange={handleFileChange}
            hidden
          />
        </div>
      </header>

      <div className="pane-switcher" aria-label="视图切换">
        <button
          type="button"
          className={activePane === "editor" ? "is-active" : ""}
          onClick={() => setActivePane("editor")}
        >
          编辑
        </button>
        <button
          type="button"
          className={activePane === "preview" ? "is-active" : ""}
          onClick={() => setActivePane("preview")}
        >
          预览
        </button>
      </div>

      <main className="markdown-panes">
        <section
          className={`markdown-pane editor-pane ${
            activePane === "editor" ? "is-mobile-active" : ""
          }`}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
        >
          <div className="pane-heading">
            <span>Markdown 输入</span>
            <span>
              {lineCount} 行 · {content.length} 字符
            </span>
          </div>
          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setFileName("");
            }}
            placeholder={"在这里输入 Markdown 内容...\n\n# 标题\n\n开始编写你的文档。"}
            aria-label="Markdown 内容"
            spellCheck="false"
          />
        </section>

        <section
          className={`markdown-pane preview-pane ${
            activePane === "preview" ? "is-mobile-active" : ""
          }`}
        >
          <div className="pane-heading">
            <span>文档预览</span>
            <span>实时渲染</span>
          </div>
          <div className="preview-scroll">
            {content.trim() ? (
              <article className="markdown-body">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    a: ({ children, ...props }) => (
                      <a {...props} target="_blank" rel="noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {content}
                </Markdown>
              </article>
            ) : (
              <div className="empty-preview">
                <span aria-hidden="true">M↓</span>
                <strong>预览区域</strong>
                <p>输入 Markdown 内容后，渲染结果会显示在这里。</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default MarkdownViewer;
