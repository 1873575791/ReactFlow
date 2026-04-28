# Bracket 节点内插入 Mark 节点 — 选区感知替换逻辑

## 问题描述

在 bracket 节点内添加 mark 节点时，无论选区是否覆盖了整个 bracket 内容，都会**直接把 bracket 整体替换为 mark**，导致未选中的文本也被一并清除。

### 期望行为

| 选区状态                  | 期望效果                                               |
| ------------------------- | ------------------------------------------------------ |
| **全选** bracket 内容     | 整体替换 bracket 为 mark（原有行为）                   |
| **部分选中** bracket 内容 | 仅替换选中部分，mark 嵌入 bracket 内部，未选中文本保留 |
| **折叠光标**（无选区）    | 在光标位置插入 mark，mark 嵌入 bracket 内部            |

## 根因分析

两处核心代码在检测到选区位于 bracket 内时，均**无条件执行** `removeNodes(bracket) + insertNodes(mark)` 整体替换：

1. **`node-operations.ts` → `insertMarkAndMoveCaret`**（覆盖 MentionMenu、拖拽等通用 mark 插入路径）
2. **`assistant-help.ts` → `insertOrReplaceWord` 步骤 0**（覆盖 AIHelp 提示词助手替换路径）

原始逻辑：

```ts
if (bracketEntry) {
  // 不论选区覆盖范围，直接删除整个 bracket 再插入 mark
  Transforms.removeNodes(editor, { at: bracketPath });
  Transforms.insertNodes(editor, node, { at: bracketPath });
  return;
}
```

## 修复方案

### 核心判断条件：选区是否完整覆盖 bracket

```ts
const bracketRange = Editor.range(editor, bracketPath);
const sel = editor.selection;
const isFullyCoveringBracket =
  Range.isExpanded(sel) &&
  Point.compare(Range.start(sel), Range.start(bracketRange)) <= 0 &&
  Point.compare(Range.end(sel), Range.end(bracketRange)) >= 0;
```

- `Range.isExpanded(sel)` — 选区必须展开（非折叠光标）
- `Range.start(sel) ≤ Range.start(bracketRange)` — 选区起点在 bracket 起点之前或相同
- `Range.end(sel) ≥ Range.end(bracketRange)` — 选区终点在 bracket 终点之后或相同

### 逻辑分支

```
选区在 bracket 内？
├── 是 → isFullyCoveringBracket？
│   ├── true（全选） → removeNodes(bracket) + insertNodes(mark) → 整体替换
│   └── false（部分选中 / 折叠光标） → 继续走常规插入流程 → mark 嵌入 bracket 内部
└── 否 → 常规插入流程
```

### 安全保障：normalize 不误删

当 mark 嵌入 bracket 内部时，bracket 的 `Node.string()` 为空（mark 是 void 节点，其 `children: [{text: ''}]` 不贡献文本），但 `editor-plugins.ts` 的 `removeEmptyBracketNodes` 已做保护：

```ts
function removeEmptyBracketNodes(editor: Editor, entry: [Node, Path]): boolean {
  // ...
  // 如果 bracket 内有元素子节点（如 mark），不删除
  const hasElementChildren = (node as SlateElement).children.some((child) => SlateElement.isElement(child));
  if (hasElementChildren) return false;
  // ...
}
```

因此 mark 嵌入后 bracket 不会被 normalize 误删。

## 修改文件

### 1. `node-operations.ts` — `insertMarkAndMoveCaret`

**路径**: `src/uikit/pro/SuperInputBox/SlateInput/utils/node-operations.ts`

**修改前**:

```ts
export const insertMarkAndMoveCaret = (editor: Editor, node: AnyElement) => {
  if (editor.selection) {
    const bracketEntry = Editor.above(editor, {
      at: editor.selection,
      match: (n) => SlateElement.isElement(n) && (n as any).type === 'bracket',
    });
    if (bracketEntry) {
      const [, bracketPath] = bracketEntry;
      Editor.withoutNormalizing(editor, () => {
        Transforms.removeNodes(editor, { at: bracketPath });
        Transforms.insertNodes(editor, node, { at: bracketPath });
      });
      const afterPoint = Editor.after(editor, bracketPath, { voids: true }) ?? Editor.end(editor, []);
      if (afterPoint) {
        Transforms.select(editor, afterPoint);
      }
      return; // ← 无条件整体替换
    }
  }
  // ... 常规插入逻辑
};
```

**修改后**:

```ts
export const insertMarkAndMoveCaret = (editor: Editor, node: AnyElement) => {
  if (editor.selection) {
    const bracketEntry = Editor.above(editor, {
      at: editor.selection,
      match: (n) => SlateElement.isElement(n) && (n as any).type === 'bracket',
    });
    if (bracketEntry) {
      const [, bracketPath] = bracketEntry;
      const bracketRange = Editor.range(editor, bracketPath);
      const sel = editor.selection;
      const isFullyCoveringBracket =
        Range.isExpanded(sel) &&
        Point.compare(Range.start(sel), Range.start(bracketRange)) <= 0 &&
        Point.compare(Range.end(sel), Range.end(bracketRange)) >= 0;
      if (isFullyCoveringBracket) {
        // 全选 → 整体替换
        Editor.withoutNormalizing(editor, () => {
          Transforms.removeNodes(editor, { at: bracketPath });
          Transforms.insertNodes(editor, node, { at: bracketPath });
        });
        const afterPoint = Editor.after(editor, bracketPath, { voids: true }) ?? Editor.end(editor, []);
        if (afterPoint) {
          Transforms.select(editor, afterPoint);
        }
        return;
      }
      // 非整体覆盖：继续走下方常规插入逻辑，mark 嵌入到 bracket 内部
    }
  }
  // ... 常规插入逻辑（无变化）
};
```

### 2. `assistant-help.ts` — `insertOrReplaceWord` 步骤 0

**路径**: `src/uikit/pro/SuperInputBox/SlateInput/utils/assistant-help.ts`

**修改前**:

```ts
Editor.withoutNormalizing(editor, () => {
  if (editor.selection) {
    const bracketEntry = Editor.above(editor, { /* ... */ });
    if (bracketEntry) {
      const [, bracketPath] = bracketEntry;
      // 不论选区范围，直接整体替换
      let replaceNode = /* build mark node */;
      Transforms.removeNodes(editor, { at: bracketPath });
      Transforms.insertNodes(editor, replaceNode, { at: bracketPath, select: true });
      ReactEditor.focus(editor);
      return;
    }
  }
  // 步骤 A ~ D
});
```

**修改后**:

```ts
Editor.withoutNormalizing(editor, () => {
  if (editor.selection) {
    const bracketEntry = Editor.above(editor, { /* ... */ });
    if (bracketEntry) {
      const [, bracketPath] = bracketEntry;
      const bracketRange = Editor.range(editor, bracketPath);
      const sel = editor.selection;
      const isFullyCoveringBracket =
        Range.isExpanded(sel) &&
        Point.compare(Range.start(sel), Range.start(bracketRange)) <= 0 &&
        Point.compare(Range.end(sel), Range.end(bracketRange)) >= 0;
      if (isFullyCoveringBracket) {
        // 全选 → 整体替换
        let replaceNode = /* build mark node */;
        Transforms.removeNodes(editor, { at: bracketPath });
        Transforms.insertNodes(editor, replaceNode, { at: bracketPath, select: true });
        ReactEditor.focus(editor);
        return;
      }
      // 非整体覆盖：落到后续步骤 A~D，按选区/光标位置处理
    }
  }
  // 步骤 A ~ D（无变化）
});
```

## 影响范围

| 调用路径 | 入口函数 | 修改文件 |
| --- | --- | --- |
| MentionMenu 选择 / @提及插入 | `handleInsertMention` → `insertMarkAndMoveCaret` | `node-operations.ts` |
| 拖拽 mark 到编辑器 | `insertMarkAndMoveCaret` | `node-operations.ts` |
| AIHelp 提示词助手替换 | `insertOrReplaceWord` | `assistant-help.ts` |
| 原图/风格图等占位替换 | `insertOriginImageMarkAtPlaceholderOrCaret` → `insertMarkAndMoveCaret` | `node-operations.ts` |

## 测试场景

1. **全选 bracket 内容后添加 mark** → bracket 整体被 mark 替换（行为不变）
2. **部分选中 bracket 内文本后添加 mark** → 仅选中部分被 mark 替换，bracket 保留且未选中文本仍在
3. **光标在 bracket 内（无选区）添加 mark** → mark 插入光标位置，bracket 保留
4. **bracket 外部正常添加 mark** → 行为不变
5. **bracket 内嵌入 mark 后，bracket 不被 normalize 误删** → 由 `removeEmptyBracketNodes` 的 `hasElementChildren` 保护
