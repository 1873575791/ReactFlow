# Slate 编辑器 bracket 节点替换 mark 失败问题修复

## 问题描述

在 `CustomElement.tsx` 中，当 `element.type` 为 `bracket` 的节点被选中后替换为 `mark` 节点时，mark 节点没有出现。

## 根因分析

### 问题链路

1. **mark 被嵌套插入 bracket 内部**

   当 bracket 节点被点击选中后，选区（selection）落在 bracket 的文本子节点内部。此时若通过 `insertOrReplaceWord`（AI 助手流）或 `insertMarkAndMoveCaret`（通用插入流）插入 mark，由于整个操作在 `Editor.withoutNormalizing` 内执行，mark 会被插入到 bracket 的子节点位置，形成嵌套结构：

   ```json
   {
     "type": "bracket",
     "children": [
       {
         "type": "mark",
         "name": "@角色1",
         "group": "roleImageParams",
         "children": [{ "text": "" }]
       }
     ]
   }
   ```

2. **normalize 阶段误删整个 bracket（含内部 mark）**

   `withoutNormalizing` 结束后，Slate 触发 normalize。`removeEmptyBracketNodes` 使用 `Node.string(bracket)` 判断 bracket 是否为空。由于 mark 的 `children: [{text: ''}]` 不贡献文本内容，`Node.string()` 返回空字符串，导致 bracket 连同内部的 mark 一起被 `Transforms.removeNodes` 删除。

### 关键代码路径

```
用户点击 bracket → BracketNode.handleClick → 选区设在 bracket 内部文本
  → AI 助手/其他机制触发 mark 插入
    → insertOrReplaceWord / insertMarkAndMoveCaret
      → Transforms.insertNodes（在 withoutNormalizing 内）
        → mark 被插入 bracket 内部
          → withoutNormalizing 结束
            → normalize 触发
              → removeEmptyBracketNodes 检测 Node.string(bracket) === ""
                → Transforms.removeNodes(bracket)  ← mark 一并被删除
```

## 修复方案

### 修复 1：增强 `removeEmptyBracketNodes`（安全网）

**文件**：`src/uikit/pro/SuperInputBox/SlateInput/utils/editor-plugins.ts`

**改动**：在判断 bracket 是否为空之前，先检查 bracket 是否有元素子节点（如 mark）。若有，即使 `Node.string` 为空也不删除，因为元素子节点仍有视觉内容。

```typescript
function removeEmptyBracketNodes(editor: Editor, entry: [Node, Path]): boolean {
  const [node, path] = entry;
  if (!SlateElement.isElement(node) || (node as any).type !== 'bracket') {
    return false;
  }
  // 新增：如果 bracket 内有元素子节点（如 mark），不删除
  const hasElementChildren = (node as SlateElement).children.some((child) => SlateElement.isElement(child));
  if (hasElementChildren) {
    return false;
  }
  const text = Node.string(node).trim();
  if (text.length > 0) {
    return false;
  }
  Transforms.removeNodes(editor, { at: path });
  return true;
}
```

### 修复 2：`insertOrReplaceWord` 新增 bracket 检测（AI 助手流）

**文件**：`src/uikit/pro/SuperInputBox/SlateInput/utils/assistant-help.ts`

**改动**：在 `withoutNormalizing` 块的最前面（步骤 A 之前），新增步骤 0：检测选区是否在 bracket 节点内。如果是，先 `removeNodes` 删除 bracket，再 `insertNodes` 在原位置插入 mark，实现正确的替换语义。

```typescript
Editor.withoutNormalizing(editor, () => {
  // ========== 步骤 0：处理光标在 bracket 节点内的情况 ==========
  if (editor.selection) {
    const bracketEntry = Editor.above(editor, {
      at: editor.selection,
      match: (n) => Element.isElement(n) && (n as any).type === 'bracket',
    });
    if (bracketEntry) {
      const [, bracketPath] = bracketEntry;
      let replaceNode: any = useAssistantFormat
        ? buildAssistantMark({ title: key, str: text, text: markText, canEdit: true })
        : { type, title: key, str: text, canEdit: true, children: [{ text: markText }] };
      if (key === '一致性保持') {
        replaceNode = buildAssistantMarkConsistencyGroup({
          node: replaceNode,
          canEdit: true,
          title: key,
          str: text,
        });
      }
      Transforms.removeNodes(editor, { at: bracketPath });
      Transforms.insertNodes(editor, replaceNode, { at: bracketPath, select: true });
      ReactEditor.focus(editor);
      return; // 替换完成，跳过后续步骤
    }
  }

  // ========== 步骤 A：处理光标在 mark 节点内的情况 ==========
  // ...原有逻辑不变
});
```

### 修复 3：`insertMarkAndMoveCaret` 新增 bracket 检测（通用插入流）

**文件**：`src/uikit/pro/SuperInputBox/SlateInput/utils/node-operations.ts`

**改动**：在插入 mark 前检测选区是否在 bracket 内。如果是，先删除 bracket 再在原位置插入 mark。此函数被 `handleInsertMention`、`insertOriginImageMarkAtPlaceholderOrCaret`、`useSlateMarks` 等多个路径调用，修复后覆盖面更广。

```typescript
export const insertMarkAndMoveCaret = (editor: Editor, node: AnyElement) => {
  // 新增：如果当前选区在 bracket 节点内，应先删除 bracket 再插入 mark
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
      return;
    }
  }

  // 原有逻辑不变
  const tempKey = `__cursor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  Transforms.insertNodes(editor, { ...node, __cursorTempKey: tempKey } as AnyElement);
  // ...
};
```

## 修复文件清单

| 文件                 | 函数/位置                    | 修复类型                         |
| -------------------- | ---------------------------- | -------------------------------- |
| `editor-plugins.ts`  | `removeEmptyBracketNodes`    | 安全网：含元素子节点时不删除     |
| `assistant-help.ts`  | `insertOrReplaceWord` 步骤 0 | 主流程：先删 bracket 再插 mark   |
| `node-operations.ts` | `insertMarkAndMoveCaret`     | 通用入口：先删 bracket 再插 mark |

## 修复后的行为

- bracket 被选中后，通过 AI 助手或 @ 提及等方式插入 mark 时，bracket 整体被替换为 mark，mark 正常渲染显示
- 即使因其他路径导致 mark 被嵌套插入 bracket 内部，`removeEmptyBracketNodes` 也不会误删含有元素子节点的 bracket
