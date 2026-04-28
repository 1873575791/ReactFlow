# SlateInput 组件架构与实现原理

## 1. 概述

`SlateInput` 是基于 [Slate.js](https://docs.slatejs.org/) 构建的**富文本提示词编辑器**，属于 `SuperInputBox` 体系的核心输入组件。它将普通文本与结构化的「标记标签」（Mark）融合在同一编辑区内，支持角色、场景、光影、特效、视频、音频等多类型标签的内联嵌入，并提供 `@` 触及菜单插入、标签拖拽排序、AI 辅助写作等功能。

```
文件路径: src/uikit/pro/SuperInputBox/SlateInput/index.tsx
```

---

## 2. 整体架构

```
SlateInputBiz (导出组件)
├── 判断 activeCapability === AI_DIRECTOR → AiDirectorInput（智能导演走独立组件）
└── SlateInput (通用编辑器)
    ├── 状态管理层 (State / Ref / Context)
    ├── 编辑器实例 (Slate Editor + 插件链)
    ├── 自定义 Hooks
    │   ├── useMentionList          — @ 提及列表 & 菜单定位
    │   ├── useSlateEditorHandlers  — 编辑器交互事件
    │   ├── useSlateMarks           — 标签同步（外部数据 ↔ 编辑器节点）
    │   ├── useHandlePasteImage     — 粘贴图片分发
    │   ├── usePlaceholderLayoutMinHeight — 占位符测高
    │   └── useMarkDragDrop         — 标签拖拽
    ├── 渲染层
    │   ├── EditableWithMarkDnD     — 注入拖拽/点击逻辑的 Editable
    │   ├── CustomElement           — 元素渲染分发器
    │   │   ├── MarkSpan / MarkSpanWithImage  — 标签渲染
    │   │   ├── BracketNode         — 括号节点
    │   │   ├── StyleSelect         — 风格库选择
    │   │   └── Preview*            — 视频/音频/图片预览
    │   ├── DropCursor              — 拖拽落点光标
    │   ├── MentionMenu             — @ 提及弹出菜单
    │   ├── AIHelp                  — AI 辅助工具栏
    │   └── CopyPrompt              — 复制提示词按钮
    └── Context
        └── MarkDragDropContext     — 拖拽状态共享
```

---

## 3. 编辑器实例与插件链

编辑器通过 `useMemo` 创建，依次叠加插件，形成**洋葱模型**：

```ts
const editor = useMemo(() => {
  let e = createEditor(); // 1. 基础编辑器
  e = withReact(e); // 2. React 集成
  e = withTextInit(e, 'mark'); // 3. 文本初始化 & mark 行为定义
  e = withCharLimit(e, limitRef, editorContainerRef); // 4. 字符限制
  e = withEditableControl(e, editableRef); // 5. 可编辑控制
  return e;
}, [editorContainerRef]);
```

### 3.1 `withTextInit` — Mark 节点行为定义

**核心职责**：将 `mark` 类型注册为 Slate 的 **inline + void** 元素，并处理光标跳过和空节点清理。

| 功能                | 实现方式                                                          |
| ------------------- | ----------------------------------------------------------------- |
| 声明 mark 为 inline | `editor.isInline` 拦截，`mark/grey/bracket/title` 均为 inline     |
| 声明 mark 为 void   | `editor.isVoid` 拦截，mark 为 void（原子化不可编辑内部）          |
| 空节点清理          | `normalizeNode` 拦截，空 name 的 mark / 空文本的 bracket 自动删除 |
| 光标跳过 mark       | `apply` 拦截 `set_selection`，光标落入 void 边界时自动跳到前/后   |

**光标跳过逻辑**：当折叠光标落在 mark 节点边界时，根据**上一次光标位置**判断方向：

- 从左进入 → 跳到 mark 后方 (`Editor.after`)
- 从右进入 → 跳到 mark 前方 (`Editor.before`)

### 3.2 `withCharLimit` — 字符限制

通过 `normalizeNode` 在根节点触发时遍历整棵文档树，累计文本长度。超出限制时：

1. 找到 cutPoint（文本精确切分、void 跳过）
2. 删除 cutPoint 之后的所有内容
3. 在编辑器容器上方弹出 toast 提示

支持 `Ref<number>` 传入 limit，实现动态更新不重建编辑器。

### 3.3 `withEditableControl` — 可编辑控制

拦截 `editor.apply`，当 `editableRef.current === false` 时：

- **允许**：`set_selection`（选择操作）
- **阻止**：所有内容修改操作（insert_text / remove_text / insert_node / remove_node 等）

实现"只读但可选可复制"的效果，同时通过 `readOnly` prop 和 `caret-transparent` CSS 控制视觉反馈。

---

## 4. Mark 节点数据模型

```ts
interface MarkNodeParams {
  type: 'mark';
  group: string; // 分类 key（roleImageParams / bgImageParams / lightPromptList 等）
  name: string; // 显示名称
  url?: string; // 图片/资源链接
  id?: number | string; // 唯一标识
  isHidden?: boolean; // 切换模型时隐藏但保留（可恢复）
  children: { text: string }[];
  extra?: Record<string, string | number | undefined>; // 视频/音频等扩展字段
  promptKey?: string; // 老字段
  promptCategory?: string; // 老字段
}
```

**group 分类映射**：

| group key               | 中文名 | 说明         |
| ----------------------- | ------ | ------------ |
| `roleImageParams`       | 角色   | 角色图片标签 |
| `bgImageParams`         | 场景   | 背景场景标签 |
| `lightPromptList`       | 光影   | 光影效果标签 |
| `effect`                | 特效   | 动态特效标签 |
| `originImageParams`     | 原图   | 原始图片标签 |
| `imageParams`           | 参考图 | 参考图片标签 |
| `styleImageParams`      | 风格图 | 风格图片标签 |
| `propImageParams`       | 道具   | 道具图片标签 |
| `videoParams`           | 视频   | 视频标签     |
| `audioParams`           | 音频   | 音频标签     |
| `poseImageParams`       | 动作   | 动作参考标签 |
| `storyboardImageParams` | 分镜图 | 分镜参考标签 |

---

## 5. 核心交互流程

### 5.1 @ 提及菜单（MentionMenu）

**触发方式有两种**：

1. **键盘输入 `@`**：`useMentionList.findMentionMark` 在 `handleChange` 中被调用，检测光标前是否有 `@` 字符，有则打开菜单
2. **点击已有 Mark 标签**：`openMentionMenuFromMarkClick` 记录被点击 mark 的 path，延迟打开菜单进入替换模式

**菜单交互**：

- 输入 `@` 后继续输入文字 → 过滤菜单列表
- 选中菜单项 → `handleInsertMention`（插入新标签）或 `handleReplaceMarkFromMenu`（替换已有标签）
- Escape → 关闭菜单

**定位计算**：通过 `DOMEditor.toDOMRange` 将光标位置转为 DOM 坐标，再减去容器偏移得到菜单定位。

### 5.2 标签拖拽排序

**架构**：`MarkDragDropContext` 全局共享拖拽状态（dragPath / dropTargetPoint / isDragging）。

**流程**：

1. `onDragStart`：记录拖拽源 path 和节点数据到 dataTransfer，设置 dragPath
2. `onDragOver`：计算鼠标位置的 Slate Point 落点，排除 mark 内部和自身路径，更新 dropTargetPoint
3. `DropCursor`：订阅 dropTargetPoint，通过 `DOMEditor.toDOMRange` 计算落点光标的 DOM 位置，渲染竖线
4. `onDrop`：执行 `moveMarkNode` 移动节点到目标位置，设置选区
5. `onDragEnd`：清理拖拽状态

**落点计算**使用 `document.caretRangeFromPoint` / `document.caretPositionFromPoint` 将鼠标坐标转为文本偏移，支持"每个字旁边"都能落点。

### 5.3 标签同步（useSlateMarks）

**数据流方向**：外部 value（面板操作结果）→ 编辑器节点

当外部数据（角色列表、场景列表等）变化时，通过各 `handleXxxMark` 函数同步到编辑器：

- **增**：面板添加新素材 → 插入对应 mark 节点
- **删**：面板删除素材 → 移除/隐藏对应 mark 节点
- **改**：面板修改素材名称等 → 重命名对应 mark 节点
- **隐藏/恢复**：切换模型时，不支持的标签设 `isHidden: true`，切回时恢复

`memoryMap` / `memoryLimitMap` 作为内存缓存，跟踪已存在的标签和字段数量限制，避免重复插入。

### 5.4 内容变化同步（handleChange → handleValueChange）

**数据流方向**：编辑器节点 → 外部 value

1. `handleChange`（Slate onChange）检测 operations 中是否有文档变更
2. `handleValueChange` 提取文本和标签信息，调用 `onChangePrompt` 更新外部状态
3. 特效标签的删除/恢复有特殊处理：删除时清除 effect 数据，恢复时从列表找回
4. `initMarkRef` 标识初始化阶段，跳过首次同步避免循环

---

## 6. 渲染层级

### 6.1 显示状态优先级

```
AI_HELP_LOADING（AI 帮助加载中）> GENERIC_LOADING（通用 loading）> EDITOR（编辑器）
```

### 6.2 CustomElement 渲染分发

| element.type / condition             | 渲染组件                    | 说明                       |
| ------------------------------------ | --------------------------- | -------------------------- |
| `mark` + `group=styleLibrary`        | `StyleSelect`               | 风格库选择器               |
| `mark` + `isAssistantComponent`      | `MarkSpan`                  | 提示词助手标签             |
| `mark` + `isVideoComponent`          | `MarkSpan` + `PreviewVideo` | 视频标签，悬浮预览         |
| `mark` + `isAudioComponent`          | `MarkSpan` + `PreviewAudio` | 音频标签，悬浮预览         |
| `mark` + `group=comicRecommendStyle` | `MarkSpan`                  | 漫画推荐风格               |
| `mark`（默认）                       | `MarkSpanWithImage`         | 带缩略图的标签，点击可替换 |
| `grey`                               | 灰色背景 span               | 灰色文本标签               |
| `title`                              | 普通文本 span               | 标题样式                   |
| `bracket`                            | `BracketNode`               | 【xxx】括号节点            |
| `p`（折叠态）                        | 首段截断 / 其余隐藏         | 折叠时只展示第一行         |
| 默认                                 | 普通文本 span               |                            |

### 6.3 MarkSpan 与 MarkSpanWithImage

- **MarkSpan**：纯文本标签（`contentEditable={false}`），使用 `useSelected()` 高亮选中态
- **MarkSpanWithImage**：带缩略图的标签，使用 `forwardRef` 避免与 `PreviewImage` 的 Popover ref 冲突，图片加载前显示占位骨架

---

## 7. 关键交互细节

### 7.1 折叠/展开

- 折叠态：`delayedCollapsed` 延迟 50ms 展开（动画效果），首段文本截断显示
- 点击折叠区：`handleContainerClick` → `setCollapsed(false)` → `requestAnimationFrame` 聚焦到末尾

### 7.2 粘贴处理

```
粘贴事件 → 图片? → tryDispatchPasteImageFromEditor（分发到垫图区）
          → Slate fragment? → 解码 + 过滤特效标签 + 合并段落 → insertFragment
          → 纯文本? → 标准化换行 → insertText
          → 兜底 → editor.insertData
```

特效标签在粘贴时的特殊处理：

- 已有特效时，粘贴内容中的特效标签被过滤（`filterEffectFromFragment`）
- 复制时特效标签转为逗号文本（`convertEffectToComma`）

### 7.3 键盘事件

| 按键             | 行为                                                       |
| ---------------- | ---------------------------------------------------------- |
| `Enter`          | 非输入法 & 菜单关闭时触发 `onEnterKeyDown`（通常触发生成） |
| `Shift+Enter`    | 插入换行符（`\n`），不创建新段落                           |
| `Escape`         | 关闭提及菜单                                               |
| `Cmd/Ctrl + ←/→` | 跳转到文档开头/末尾                                        |
| 打字/删除        | 禁用标签 Preview，鼠标移动后恢复                           |

### 7.4 可编辑控制

`editable` prop 的三重控制：

1. `withEditableControl` 插件：拦截底层 apply 操作
2. `editableRef`：初始为 `true`（保证初始化内容可渲染），`initMarkRef` 为 true 后同步为 prop 值
3. `Editable.readOnly`：同时设置 `readOnly={effectiveDisabled || !editable}`

---

## 8. AI 辅助功能

`AIHelp` 组件通过 `AIList` 配置动态渲染功能按钮：

| 功能类型             | 组件                      | 说明                 |
| -------------------- | ------------------------- | -------------------- |
| `weightSetting`      | `AIWeight`                | 权重设置             |
| `imageReverse`       | `AIImageReverse`          | 图片反推提示词       |
| `textOptimize`       | `AITextOptimize`          | 文本优化             |
| `textOptimizeSwitch` | `AITextOptimizeSwitch`    | 优化开关（视频续写） |
| `aiWriting`          | `AISmartWriting`          | 智能帮写             |
| `assistant`          | `AIAssistant`             | 提示词助手           |
| `styleLibrary`       | `ComicStyles`             | 风格词库             |
| `translation`        | `ComicPromptTranslation`  | 漫画翻译             |
| `optimization`       | `ComicPromptOptimization` | 漫画优化             |
| `textWeightEnhance`  | `ComicTextWeightEnhance`  | 文本权重增强         |
| `comicAIWriting`     | `ComicAIWriting`          | 漫画帮写             |
| `imageAnalysis`      | `ImageAnalysis`           | 图片解析             |

AI 任务通过 `usePromptTaskStore` 管理生命周期（generating → completed / failed / cancelled），任务结果回写编辑器。

---

## 9. 目录结构

```
SlateInput/
├── index.tsx                  # 主组件
├── AIHelp/                    # AI 辅助工具栏（19 个子组件）
├── MentionMenu/               # @ 提及弹出菜单
├── components/
│   ├── BracketNode.tsx        # 【xxx】括号节点
│   ├── CopyPrompt/            # 复制提示词
│   ├── CustomElement.tsx      # 元素渲染分发器
│   ├── DropCursor.tsx         # 拖拽落点光标
│   ├── MarkSpan.tsx           # 标签渲染（纯文本/带图）
│   └── StyleSelect/           # 风格库选择
├── context/
│   └── MarkDragDropContext.tsx # 拖拽状态 Context
├── hooks/
│   ├── useHandlePasteImage.tsx # 粘贴图片分发
│   ├── useMarkClickToSelect.ts # 点击 mark 选中
│   ├── useMarkDragDrop.ts      # 标签拖拽逻辑
│   ├── useMentionList.ts       # @ 提及列表 & 定位
│   ├── usePlaceholderLayoutMinHeight.ts # 占位符测高
│   ├── useSlateEditorHandlers.ts # 编辑器事件处理
│   └── useSlateMarks.ts        # 标签同步
└── utils/
    ├── assembly.ts             # 组装工具
    ├── assistant-help.ts       # 提示词助手
    ├── buildMark.ts            # 构建各类 mark 节点
    ├── clipboard.ts            # 剪贴板编解码
    ├── editor-plugins.ts       # 编辑器插件（withTextInit/withCharLimit/withEditableControl）
    ├── helpers.ts              # 辅助函数
    ├── index.ts                # 统一导出 & 常量映射
    ├── mark-drag-drop.ts       # 拖拽落点计算
    ├── mark-handlers.ts        # 各类标签同步处理器
    ├── node-operations.ts      # 节点操作（插入/替换/删除/重命名）
    ├── parse.ts                # 文本解析
    ├── styles.ts               # 样式工具
    ├── types.ts                # 类型定义
    └── urlMatch.ts             # URL 匹配
```

---

## 10. 数据流总览

```
┌─────────────────────────────────────────────────────┐
│                    外部状态 (value)                    │
│  prompt / echoParams / roleImageParams / effect ...  │
└──────────┬────────────────────────────┬─────────────┘
           │                            │
     面板操作变更                  编辑器输入变更
           │                            │
           ▼                            │
   useSlateMarks                        │
   handleRoleMark                       │
   handleSceneMark                      │
   handleEffectMark ...                │
           │                            │
           ▼                            │
   ┌─────────────┐                      │
   │ Slate Editor │ ◄── handleChange ──┘
   │  (节点树)    │ ──→ handleValueChange ──→ onChangePrompt
   └─────────────┘
```

**双向同步要点**：

- 外部 → 编辑器：通过 `useSlateMarks` 中的 `handleXxxMark` 函数，响应外部数据变化同步标签
- 编辑器 → 外部：通过 `handleChange` → `handleValueChange`，将编辑器内容变化同步到外部
- **防循环**：`initMarkRef` 标识初始化阶段跳过同步；`oldNodesRef` 比较节点是否真正变化
