# Slate.js API 中文参考文档

> 基于 `slate@0.118.1` / `slate-react@0.117.4` / `slate-history@0.113.1` / `slate-dom@0.118.1`

---

## 目录

- [一、核心类型](#一核心类型)
- [二、Editor 静态方法](#二editor-静态方法)
- [三、Node 静态方法](#三node-静态方法)
- [四、Element 静态方法](#四element-静态方法)
- [五、Text 静态方法](#五text-静态方法)
- [六、Path 静态方法](#六path-静态方法)
- [七、Point 静态方法](#七point-静态方法)
- [八、Range 静态方法](#八range-静态方法)
- [九、Operation 类型与静态方法](#九operation-类型与静态方法)
- [十、Transforms 变换方法](#十transforms-变换方法)
- [十一、slate-react API](#十一slate-react-api)
- [十二、slate-dom API](#十二slate-dom-api)
- [十三、slate-history API](#十三slate-history-api)
- [十四、辅助类型与工具](#十四辅助类型与工具)

---

## 一、核心类型

### 1.1 Editor

编辑器核心接口，存储编辑器所有状态。

```typescript
interface BaseEditor {
  children: Descendant[]; // 文档子节点
  selection: Selection; // 当前选区（Range | null）
  operations: Operation[]; // 操作队列
  marks: EditorMarks | null; // 当前 mark 状态（Omit<Text, 'text'>）
  apply: (operation: Operation) => void; // 应用操作
  getDirtyPaths: (operation: Operation) => Path[]; // 获取脏路径
  getFragment: () => Descendant[]; // 获取文档片段
  isElementReadOnly: (element: Element) => boolean; // 是否只读元素
  isSelectable: (element: Element) => boolean; // 是否可选中
  markableVoid: (element: Element) => boolean; // void 元素是否支持 mark
  normalizeNode: (
    entry: NodeEntry,
    options?: {
      operation?: Operation;
      fallbackElement?: () => Element;
    },
  ) => void; // 节点规范化
  onChange: (options?: { operation?: Operation }) => void; // 变更回调
  shouldNormalize: (options: {
    iteration: number;
    initialDirtyPathsLength: number;
    dirtyPaths: Path[];
    operation?: Operation;
  }) => boolean; // 是否继续规范化
  // ... 挂载了所有 Editor 静态方法和 Transforms 方法
}
```

**类型别名：**

- `Editor` = `ExtendedType<'Editor', BaseEditor>`（支持自定义扩展）
- `BaseSelection` = `Range | null`
- `Selection` = `ExtendedType<'Selection', BaseSelection>`
- `EditorMarks` = `Omit<Text, 'text'>`（不含 `text` 字段的文本属性）

### 1.2 Element

元素节点，包含子节点的容器节点，可以是"块级"或"行内"。

```typescript
interface BaseElement {
  children: Descendant[]; // 子节点列表
}
```

**类型别名：**

- `Element` = `ExtendedType<'Element', BaseElement>`
- `ElementEntry` = `[Element, Path]`（元素节点 + 路径的元组）

### 1.3 Text

文本节点，文档树中的叶子节点，包含实际文本内容和格式属性。

```typescript
interface BaseText {
  text: string; // 文本内容
}
```

**类型别名：**

- `Text` = `ExtendedType<'Text', BaseText>`

### 1.4 Node

节点联合类型，代表文档树中所有可能的节点。

```typescript
type Node = Editor | Element | Text;
type Descendant = Element | Text; // 后代节点（不含 Editor）
type Ancestor = Editor | Element; // 祖先节点（不含 Text）
type NodeEntry<T extends Node = Node> = [T, Path]; // 节点 + 路径的元组
type NodeProps = Omit<Editor, 'children'> | Omit<Element, 'children'> | Omit<Text, 'text'>;
```

### 1.5 Path

路径，是一个数字数组，描述节点在文档树中的精确位置。

```typescript
type Path = number[];
```

### 1.6 Point

点，指向文档中某个文本节点的具体位置。

```typescript
interface BasePoint {
  path: Path; // 节点路径
  offset: number; // 文本偏移量
}
```

**类型别名：**

- `Point` = `ExtendedType<'Point', BasePoint>`
- `PointEntry` = `[Point, 'anchor' | 'focus']`

### 1.7 Range

范围，由两个点（锚点和焦点）定义的文档区间。

```typescript
interface BaseRange {
  anchor: Point; // 锚点（选区起始）
  focus: Point; // 焦点（选区末端）
}
```

**类型别名：**

- `Range` = `ExtendedType<'Range', BaseRange>`

### 1.8 Location

位置的联合类型，统一 `Path`、`Point`、`Range` 三种定位方式。

```typescript
type Location = Path | Point | Range;
type Span = [Path, Path]; // 低级别路径区间（不需要叶子节点存在）
```

### 1.9 PathRef / PointRef / RangeRef

引用对象，在文档操作期间保持与特定位置同步。

```typescript
interface PathRef {
  current: Path | null; // 当前路径
  affinity: 'forward' | 'backward' | null; // 亲和方向
  unref(): Path | null; // 解除引用
}

interface PointRef {
  current: Point | null; // 当前点
  affinity: TextDirection | null; // 亲和方向
  unref(): Point | null; // 解除引用
}

interface RangeRef {
  current: Range | null; // 当前范围
  affinity: 'forward' | 'backward' | 'outward' | 'inward' | null; // 亲和方向
  unref(): Range | null; // 解除引用
}
```

---

## 二、Editor 静态方法

`Editor` 对象提供了一系列静态方法来操作编辑器。

### 2.1 节点查询方法

#### `Editor.above<T>(editor, options?)`

获取指定位置上方的祖先节点。

| 参数          | 类型                             | 说明                   |
| ------------- | -------------------------------- | ---------------------- |
| editor        | `Editor`                         | 编辑器实例             |
| options.at    | `Location`                       | 查询位置，默认当前选区 |
| options.match | `NodeMatch<T>`                   | 匹配函数               |
| options.mode  | `'highest' \| 'lowest' \| 'all'` | 匹配模式               |
| options.voids | `boolean`                        | 是否包含 void 节点     |

**返回值：** `NodeEntry<T> | undefined`

#### `Editor.after(editor, at, options?)`

获取某个位置之后的点。

| 参数             | 类型                                                     | 说明               |
| ---------------- | -------------------------------------------------------- | ------------------ |
| editor           | `Editor`                                                 | 编辑器实例         |
| at               | `Location`                                               | 参考位置           |
| options.distance | `number`                                                 | 距离，默认 `1`     |
| options.unit     | `'offset' \| 'character' \| 'word' \| 'line' \| 'block'` | 移动单位           |
| options.voids    | `boolean`                                                | 是否包含 void 节点 |

**返回值：** `Point | undefined`

#### `Editor.before(editor, at, options?)`

获取某个位置之前的点。参数同 `after`。

**返回值：** `Point | undefined`

#### `Editor.edges(editor, at)`

获取某个位置的起始和结束点。

| 参数   | 类型       | 说明       |
| ------ | ---------- | ---------- |
| editor | `Editor`   | 编辑器实例 |
| at     | `Location` | 目标位置   |

**返回值：** `[Point, Point]`

#### `Editor.end(editor, at)`

获取某个位置的结束点。

**返回值：** `Point`

#### `Editor.first(editor, at)`

获取某个位置的第一个节点。

**返回值：** `NodeEntry`

#### `Editor.last(editor, at)`

获取某个位置的最后一个节点。

**返回值：** `NodeEntry`

#### `Editor.leaf(editor, at, options?)`

获取某个位置的叶子文本节点。

| 参数          | 类型               | 说明 |
| ------------- | ------------------ | ---- |
| options.depth | `number`           | 深度 |
| options.edge  | `'start' \| 'end'` | 边缘 |

**返回值：** `NodeEntry<Text>`

#### `Editor.levels<T>(editor, options?)`

迭代某个位置的所有层级节点（Generator）。

| 参数            | 类型           | 说明               |
| --------------- | -------------- | ------------------ |
| options.at      | `Location`     | 查询位置           |
| options.match   | `NodeMatch<T>` | 匹配函数           |
| options.reverse | `boolean`      | 是否反向遍历       |
| options.voids   | `boolean`      | 是否包含 void 节点 |

**返回值：** `Generator<NodeEntry<T>>`

#### `Editor.next<T>(editor, options?)`

获取某个位置之后的下一个匹配节点。

| 参数          | 类型                             | 说明          |
| ------------- | -------------------------------- | ------------- |
| options.at    | `Location`                       | 参考位置      |
| options.match | `NodeMatch<T>`                   | 匹配函数      |
| options.mode  | `'all' \| 'highest' \| 'lowest'` | 模式          |
| options.voids | `boolean`                        | 是否包含 void |

**返回值：** `NodeEntry<T> | undefined`

#### `Editor.node(editor, at, options?)`

获取某个位置的节点。

| 参数          | 类型               | 说明 |
| ------------- | ------------------ | ---- |
| options.depth | `number`           | 深度 |
| options.edge  | `'start' \| 'end'` | 边缘 |

**返回值：** `NodeEntry`

#### `Editor.nodes<T>(editor, options?)`

迭代编辑器中所有匹配节点（Generator）。

| 参数              | 类型                             | 说明          |
| ----------------- | -------------------------------- | ------------- |
| options.at        | `Location \| Span`               | 搜索范围      |
| options.match     | `NodeMatch<T>`                   | 匹配函数      |
| options.mode      | `'all' \| 'highest' \| 'lowest'` | 模式          |
| options.universal | `boolean`                        | 是否通用匹配  |
| options.reverse   | `boolean`                        | 是否反向      |
| options.voids     | `boolean`                        | 是否包含 void |
| options.pass      | `(entry: NodeEntry) => boolean`  | 跳过条件      |

**返回值：** `Generator<NodeEntry<T>>`

#### `Editor.parent(editor, at, options?)`

获取某个位置节点的父节点。

| 参数          | 类型               | 说明 |
| ------------- | ------------------ | ---- |
| options.depth | `number`           | 深度 |
| options.edge  | `'start' \| 'end'` | 边缘 |

**返回值：** `NodeEntry<Ancestor>`

#### `Editor.previous<T>(editor, options?)`

获取某个位置之前的前一个匹配节点。

| 参数          | 类型                             | 说明          |
| ------------- | -------------------------------- | ------------- |
| options.at    | `Location`                       | 参考位置      |
| options.match | `NodeMatch<T>`                   | 匹配函数      |
| options.mode  | `'all' \| 'highest' \| 'lowest'` | 模式          |
| options.voids | `boolean`                        | 是否包含 void |

**返回值：** `NodeEntry<T> | undefined`

#### `Editor.positions(editor, options?)`

返回范围内所有可放置光标的位置（Generator）。

| 参数            | 类型                                                     | 说明          |
| --------------- | -------------------------------------------------------- | ------------- |
| options.at      | `Location`                                               | 范围          |
| options.unit    | `'offset' \| 'character' \| 'word' \| 'line' \| 'block'` | 步进单位      |
| options.reverse | `boolean`                                                | 是否反向      |
| options.voids   | `boolean`                                                | 是否包含 void |

**返回值：** `Generator<Point>`

### 2.2 路径与选区方法

#### `Editor.path(editor, at, options?)`

获取某个位置的路径。

| 参数          | 类型               | 说明 |
| ------------- | ------------------ | ---- |
| options.depth | `number`           | 深度 |
| options.edge  | `'start' \| 'end'` | 边缘 |

**返回值：** `Path`

#### `Editor.point(editor, at, options?)`

获取某个位置的点。

| 参数         | 类型               | 说明 |
| ------------ | ------------------ | ---- |
| options.edge | `'start' \| 'end'` | 边缘 |

**返回值：** `Point`

#### `Editor.range(editor, at, to?)`

获取某个位置的范围。

| 参数 | 类型       | 说明             |
| ---- | ---------- | ---------------- |
| at   | `Location` | 起始位置         |
| to   | `Location` | 结束位置（可选） |

**返回值：** `Range`

#### `Editor.start(editor, at)`

获取某个位置的起始点。

**返回值：** `Point`

#### `Editor.string(editor, at, options?)`

获取某个位置的文本字符串。

| 参数          | 类型      | 说明                     |
| ------------- | --------- | ------------------------ |
| options.voids | `boolean` | 是否包含 void 节点的文本 |

**返回值：** `string`

#### `Editor.unhangRange(editor, range, options?)`

将悬挂范围转换为非悬挂范围。

| 参数          | 类型      | 说明          |
| ------------- | --------- | ------------- |
| options.voids | `boolean` | 是否包含 void |

**返回值：** `Range`

#### `Editor.fragment(editor, at)`

获取某个位置的文档片段。

**返回值：** `Descendant[]`

### 2.3 引用方法

#### `Editor.pathRef(editor, path, options?)`

创建路径引用。

| 参数             | 类型                              | 说明     |
| ---------------- | --------------------------------- | -------- |
| path             | `Path`                            | 路径     |
| options.affinity | `'forward' \| 'backward' \| null` | 亲和方向 |

**返回值：** `PathRef`

#### `Editor.pathRefs(editor)`

获取当前所有路径引用。

**返回值：** `Set<PathRef>`

#### `Editor.pointRef(editor, point, options?)`

创建点引用。

| 参数             | 类型                              | 说明     |
| ---------------- | --------------------------------- | -------- |
| options.affinity | `'forward' \| 'backward' \| null` | 亲和方向 |

**返回值：** `PointRef`

#### `Editor.pointRefs(editor)`

获取当前所有点引用。

**返回值：** `Set<PointRef>`

#### `Editor.rangeRef(editor, range, options?)`

创建范围引用。

| 参数             | 类型                                                       | 说明     |
| ---------------- | ---------------------------------------------------------- | -------- |
| options.affinity | `'forward' \| 'backward' \| 'outward' \| 'inward' \| null` | 亲和方向 |

**返回值：** `RangeRef`

#### `Editor.rangeRefs(editor)`

获取当前所有范围引用。

**返回值：** `Set<RangeRef>`

### 2.4 判断方法

#### `Editor.isBlock(editor, value)`

判断一个元素是否为块级元素。

**返回值：** `boolean`

#### `Editor.isInline(editor, value)`

判断一个元素是否为行内元素。

**返回值：** `boolean`

#### `Editor.isVoid(editor, value)`

判断一个元素是否为 void 元素。

**返回值：** `boolean`

#### `Editor.isEditor(value, options?)`

判断一个值是否为 Editor 对象。

| 参数         | 类型      | 说明         |
| ------------ | --------- | ------------ |
| options.deep | `boolean` | 是否深度比较 |

**返回值：** `value is Editor`

#### `Editor.isEdge(editor, point, at)`

判断一个点是否为某个位置的边缘点。

**返回值：** `boolean`

#### `Editor.isEnd(editor, point, at)`

判断一个点是否为某个位置的结束点。

**返回值：** `boolean`

#### `Editor.isStart(editor, point, at)`

判断一个点是否为某个位置的起始点。

**返回值：** `boolean`

#### `Editor.isEmpty(editor, element)`

判断一个元素是否为空（考虑 void 节点）。

**返回值：** `boolean`

#### `Editor.isNormalizing(editor)`

判断编辑器是否正在规范化。

**返回值：** `boolean`

#### `Editor.isElementReadOnly(editor, element)`

判断一个元素是否为只读元素。

**返回值：** `boolean`

#### `Editor.isSelectable(editor, element)`

判断一个元素是否可选中。

**返回值：** `boolean`

#### `Editor.hasBlocks(editor, element)`

判断节点是否有块级子节点。

**返回值：** `boolean`

#### `Editor.hasInlines(editor, element)`

判断节点是否有行内和文本子节点。

**返回值：** `boolean`

#### `Editor.hasTexts(editor, element)`

判断节点是否有文本子节点。

**返回值：** `boolean`

#### `Editor.hasPath(editor, path)`

判断指定路径是否存在。

**返回值：** `boolean`

### 2.5 编辑操作方法

#### `Editor.addMark(editor, key, value)`

为当前选区的叶子文本节点添加自定义属性（mark）。如果选区折叠，则添加到 `editor.marks`，下次插入文本时生效。

| 参数  | 类型     | 说明   |
| ----- | -------- | ------ |
| key   | `string` | 属性名 |
| value | `any`    | 属性值 |

#### `Editor.removeMark(editor, key)`

从当前选区的叶子文本节点移除自定义属性。如果选区折叠，则存储到 `editor.marks`。

| 参数 | 类型     | 说明   |
| ---- | -------- | ------ |
| key  | `string` | 属性名 |

#### `Editor.marks(editor)`

获取当前选区文本将应用的 marks。

**返回值：** `Omit<Text, 'text'> | null`

#### `Editor.insertBreak(editor)`

在当前选区插入换行。如果选区展开，先删除选区内容。

#### `Editor.insertSoftBreak(editor)`

在当前选区插入软换行（Shift+Enter）。如果选区展开，先删除选区内容。

#### `Editor.insertNode(editor, node, options?)`

原子性地插入一个节点。

| 参数    | 类型                     | 说明                                  |
| ------- | ------------------------ | ------------------------------------- |
| node    | `Node`                   | 要插入的节点                          |
| options | `NodeInsertNodesOptions` | 插入选项（同 Transforms.insertNodes） |

#### `Editor.insertFragment(editor, fragment, options?)`

插入一个文档片段。

| 参数     | 类型                        | 说明     |
| -------- | --------------------------- | -------- |
| fragment | `Node[]`                    | 文档片段 |
| options  | `TextInsertFragmentOptions` | 选项     |

#### `Editor.insertText(editor, text, options?)`

插入文本字符串。

| 参数    | 类型                    | 说明     |
| ------- | ----------------------- | -------- |
| text    | `string`                | 文本内容 |
| options | `TextInsertTextOptions` | 选项     |

#### `Editor.deleteBackward(editor, options?)`

向后删除内容。

| 参数         | 类型                                         | 说明     |
| ------------ | -------------------------------------------- | -------- |
| options.unit | `'character' \| 'word' \| 'line' \| 'block'` | 删除单位 |

#### `Editor.deleteForward(editor, options?)`

向前删除内容。参数同 `deleteBackward`。

#### `Editor.deleteFragment(editor, options?)`

删除当前选区内容。

| 参数              | 类型                      | 说明     |
| ----------------- | ------------------------- | -------- |
| options.direction | `'forward' \| 'backward'` | 删除方向 |

### 2.6 规范化方法

#### `Editor.normalize(editor, options?)`

规范编辑器中的脏对象。

| 参数              | 类型        | 说明           |
| ----------------- | ----------- | -------------- |
| options.force     | `boolean`   | 是否强制规范化 |
| options.operation | `Operation` | 触发操作       |

#### `Editor.setNormalizing(editor, isNormalizing)`

手动设置编辑器是否进行规范化。

| 参数          | 类型      | 说明       |
| ------------- | --------- | ---------- |
| isNormalizing | `boolean` | 是否规范化 |

#### `Editor.withoutNormalizing(editor, fn)`

延迟规范化直到函数执行完毕。

| 参数 | 类型         | 说明         |
| ---- | ------------ | ------------ |
| fn   | `() => void` | 要执行的函数 |

### 2.7 其他方法

#### `Editor.void(editor, options?)`

匹配当前分支中的 void 节点。

| 参数          | 类型                             | 说明          |
| ------------- | -------------------------------- | ------------- |
| options.at    | `Location`                       | 位置          |
| options.mode  | `'highest' \| 'lowest' \| 'all'` | 模式          |
| options.voids | `boolean`                        | 是否包含 void |

**返回值：** `NodeEntry<Element> | undefined`

#### `Editor.elementReadOnly(editor, options?)`

匹配当前分支中的只读元素。

**返回值：** `NodeEntry<Element> | undefined`

#### `Editor.shouldMergeNodesRemovePrevNode(editor, prevNodeEntry, curNodeEntry)`

判断合并节点时是否移除前一个节点。

**返回值：** `boolean`

### 2.8 工厂函数

#### `createEditor()`

创建一个新的 Slate 编辑器实例。

**返回值：** `Editor`

---

## 三、Node 静态方法

`Node` 对象提供遍历和查询文档节点树的方法。

### 3.1 获取节点

#### `Node.ancestor(root, path)`

获取指定路径的祖先节点。

| 参数 | 类型   | 说明   |
| ---- | ------ | ------ |
| root | `Node` | 根节点 |
| path | `Path` | 路径   |

**返回值：** `Ancestor`

#### `Node.child(root, index)`

获取某个节点指定索引的子节点。

**返回值：** `Descendant`

#### `Node.descendant(root, path)`

获取指定路径的后代节点。

**返回值：** `Descendant`

#### `Node.get(root, path)`

获取指定路径的节点。空路径返回根节点本身。

**返回值：** `Node`

#### `Node.getIf(root, path)`

类似 `get`，但路径不存在时返回 `undefined`。

**返回值：** `Node | undefined`

#### `Node.has(root, path)`

判断指定路径的后代节点是否存在。

**返回值：** `boolean`

#### `Node.parent(root, path)`

获取指定路径节点的父节点。

**返回值：** `Ancestor`

#### `Node.leaf(root, path)`

获取指定路径的叶子文本节点。

**返回值：** `Text`

#### `Node.common(root, path, another)`

获取两个路径的公共祖先节点条目。

**返回值：** `NodeEntry`

#### `Node.first(root, path)`

获取从某路径开始的第一个叶子节点条目。

**返回值：** `NodeEntry`

#### `Node.last(root, path)`

获取从某路径开始的最后一个叶子节点条目。

**返回值：** `NodeEntry`

### 3.2 迭代方法

#### `Node.ancestors(root, path, options?)`

返回指定路径的所有祖先节点条目（Generator）。

| 参数            | 类型      | 说明                 |
| --------------- | --------- | -------------------- |
| options.reverse | `boolean` | 是否反向（自底向上） |

**返回值：** `Generator<NodeEntry<Ancestor>>`

#### `Node.children(root, path, options?)`

迭代指定路径节点的子节点（Generator）。

**返回值：** `Generator<NodeEntry<Descendant>>`

#### `Node.descendants(root, options?)`

迭代根节点中的所有后代节点（Generator）。

| 参数            | 类型                           | 说明     |
| --------------- | ------------------------------ | -------- |
| options.from    | `Path`                         | 起始路径 |
| options.to      | `Path`                         | 结束路径 |
| options.reverse | `boolean`                      | 是否反向 |
| options.pass    | `(node: NodeEntry) => boolean` | 跳过条件 |

**返回值：** `Generator<NodeEntry<Descendant>>`

#### `Node.elements(root, options?)`

迭代根节点中的所有元素节点（Generator）。

**返回值：** `Generator<ElementEntry>`

#### `Node.levels(root, path, options?)`

返回从根到指定路径的各级节点（Generator）。

**返回值：** `Generator<NodeEntry>`

#### `Node.nodes(root, options?)`

迭代根节点中的所有节点条目（Generator）。

**返回值：** `Generator<NodeEntry>`

#### `Node.texts(root, options?)`

迭代根节点中的所有叶子文本节点（Generator）。

**返回值：** `Generator<NodeEntry<Text>>`

### 3.3 其他方法

#### `Node.extractProps(node)`

提取节点的属性（去除 `children` 或 `text`）。

**返回值：** `NodeProps`

#### `Node.matches(node, props)`

判断节点是否匹配一组属性。

**返回值：** `boolean`

#### `Node.string(node)`

获取节点的文本内容（不含块级节点间的空格/换行）。

**返回值：** `string`

#### `Node.isNode(value, options?)`

判断值是否为 Node。

| 参数         | 类型      | 说明         |
| ------------ | --------- | ------------ |
| options.deep | `boolean` | 是否深度检查 |

**返回值：** `value is Node`

#### `Node.isNodeList(value, options?)`

判断值是否为 Node 数组。

**返回值：** `value is Node[]`

---

## 四、Element 静态方法

#### `Element.isAncestor(value, options?)`

判断值是否实现了 `Ancestor` 接口。

#### `Element.isElement(value, options?)`

判断值是否为 Element 对象。

#### `Element.isElementList(value, options?)`

判断值是否为 Element 数组。

#### `Element.isElementProps(props)`

判断属性是否为 Element 的部分属性。

#### `Element.isElementType<T>(value, elementVal, elementKey?)`

判断值是否为指定类型的 Element。默认检查 `type` 键值。

| 参数       | 类型     | 说明                    |
| ---------- | -------- | ----------------------- |
| elementVal | `string` | 类型值                  |
| elementKey | `string` | 类型键名，默认 `'type'` |

#### `Element.matches(element, props)`

判断元素是否匹配一组属性（仅检查自定义属性，不比较 children）。

---

## 五、Text 静态方法

#### `Text.equals(text, another, options?)`

判断两个文本节点是否相等。

| 参数          | 类型      | 说明                                               |
| ------------- | --------- | -------------------------------------------------- |
| options.loose | `boolean` | 宽松模式，不比较 `text` 字段（用于判断是否可合并） |

#### `Text.isText(value)`

判断值是否为 Text 对象。

#### `Text.isTextList(value)`

判断值是否为 Text 数组。

#### `Text.isTextProps(props)`

判断属性是否为 Text 的部分属性。

#### `Text.matches(text, props)`

判断文本节点是否匹配一组属性（仅检查自定义属性，不比较 `text`）。

#### `Text.decorations(node, decorations)`

根据装饰信息获取文本节点的叶子分段。

| 参数        | 类型               | 说明         |
| ----------- | ------------------ | ------------ |
| node        | `Text`             | 文本节点     |
| decorations | `DecoratedRange[]` | 装饰范围列表 |

**返回值：** `{ leaf: Text; position?: LeafPosition }[]`

---

## 六、Path 静态方法

`Path` 类型为 `number[]`，以下是路径操作方法。

### 6.1 比较方法

#### `Path.compare(path, another)`

比较两个路径的先后顺序。

**返回值：** `-1 | 0 | 1`

#### `Path.equals(path, another)`

判断两个路径是否完全相等。

**返回值：** `boolean`

#### `Path.isAfter(path, another)`

判断路径是否在另一个之后。

#### `Path.isBefore(path, another)`

判断路径是否在另一个之前。

#### `Path.isAncestor(path, another)`

判断路径是否为另一个的祖先。

#### `Path.isChild(path, another)`

判断路径是否为另一个的子路径。

#### `Path.isCommon(path, another)`

判断路径是否等于或是另一个的祖先。

#### `Path.isDescendant(path, another)`

判断路径是否为另一个的后代。

#### `Path.isParent(path, another)`

判断路径是否为另一个的父路径。

#### `Path.isSibling(path, another)`

判断两个路径是否为兄弟。

#### `Path.isPath(value)`

判断值是否为 Path。

### 6.2 关系方法

#### `Path.ancestors(path, options?)`

获取路径的所有祖先路径。

| 参数            | 类型      | 说明     |
| --------------- | --------- | -------- |
| options.reverse | `boolean` | 是否反向 |

**返回值：** `Path[]`

#### `Path.common(path, another)`

获取两个路径的公共祖先路径。

**返回值：** `Path`

#### `Path.levels(path, options?)`

获取从根到当前路径的各级路径（包含自身）。

**返回值：** `Path[]`

#### `Path.parent(path)`

获取父路径。

**返回值：** `Path`

#### `Path.next(path)`

获取下一个兄弟节点路径。

**返回值：** `Path`

#### `Path.previous(path)`

获取上一个兄弟节点路径。

**返回值：** `Path`

#### `Path.relative(path, ancestor)`

获取相对于某个祖先的路径。

**返回值：** `Path`

#### `Path.hasPrevious(path)`

判断是否存在前一个兄弟节点路径。

### 6.3 边缘判断

#### `Path.endsAfter(path, another)`

判断路径是否在另一个路径的索引之后结束。

#### `Path.endsAt(path, another)`

判断路径是否在另一个路径的索引处结束。

#### `Path.endsBefore(path, another)`

判断路径是否在另一个路径的索引之前结束。

### 6.4 变换方法

#### `Path.transform(path, operation, options?)`

根据操作变换路径。

| 参数             | 类型                              | 说明     |
| ---------------- | --------------------------------- | -------- |
| options.affinity | `'forward' \| 'backward' \| null` | 亲和方向 |

**返回值：** `Path | null`

#### `Path.operationCanTransformPath(operation)`

判断操作是否会影响路径。

**返回值：** `boolean`

---

## 七、Point 静态方法

#### `Point.compare(point, another)`

比较两个点的先后顺序。

**返回值：** `-1 | 0 | 1`

#### `Point.isAfter(point, another)`

判断点是否在另一个之后。

#### `Point.isBefore(point, another)`

判断点是否在另一个之前。

#### `Point.equals(point, another)`

判断两个点是否完全相等。

#### `Point.isPoint(value)`

判断值是否为 Point。

#### `Point.transform(point, op, options?)`

根据操作变换点。

| 参数             | 类型                              | 说明     |
| ---------------- | --------------------------------- | -------- |
| options.affinity | `'forward' \| 'backward' \| null` | 亲和方向 |

**返回值：** `Point | null`

---

## 八、Range 静态方法

#### `Range.edges(range, options?)`

获取范围的起始和结束点（按文档顺序）。

| 参数            | 类型      | 说明     |
| --------------- | --------- | -------- |
| options.reverse | `boolean` | 是否反向 |

**返回值：** `[Point, Point]`

#### `Range.end(range)`

获取范围的结束点。

**返回值：** `Point`

#### `Range.start(range)`

获取范围的起始点。

**返回值：** `Point`

#### `Range.equals(range, another)`

判断两个范围是否完全相等。

#### `Range.includes(range, target)`

判断范围是否包含某个路径、点或范围的一部分。

| 参数   | 类型                     | 说明 |
| ------ | ------------------------ | ---- |
| target | `Path \| Point \| Range` | 目标 |

#### `Range.surrounds(range, target)`

判断范围是否完全包围另一个范围。

#### `Range.intersection(range, another)`

获取两个范围的交集。

**返回值：** `Range | null`

#### `Range.isBackward(range)`

判断范围是否为反向（锚点在焦点之后）。

#### `Range.isCollapsed(range)`

判断范围是否折叠（锚点和焦点在同一位置）。

#### `Range.isExpanded(range)`

判断范围是否展开（与 `isCollapsed` 相反）。

#### `Range.isForward(range)`

判断范围是否为正向（与 `isBackward` 相反）。

#### `Range.isRange(value)`

判断值是否为 Range 对象。

#### `Range.points(range)`

迭代范围中的所有点条目（Generator）。

**返回值：** `Generator<PointEntry>`

#### `Range.transform(range, op, options?)`

根据操作变换范围。

| 参数             | 类型                                                       | 说明     |
| ---------------- | ---------------------------------------------------------- | -------- |
| options.affinity | `'forward' \| 'backward' \| 'outward' \| 'inward' \| null` | 亲和方向 |

**返回值：** `Range | null`

---

## 九、Operation 类型与静态方法

### 9.1 操作类型

Slate 中所有变更都表示为操作（Operation），分为三大类：

**节点操作（NodeOperation）：**

| 类型          | 字段                                                                      | 说明         |
| ------------- | ------------------------------------------------------------------------- | ------------ |
| `insert_node` | `path: Path`, `node: Node`                                                | 插入节点     |
| `merge_node`  | `path: Path`, `position: number`, `properties: Partial<Node>`             | 合并节点     |
| `move_node`   | `path: Path`, `newPath: Path`                                             | 移动节点     |
| `remove_node` | `path: Path`, `node: Node`                                                | 移除节点     |
| `set_node`    | `path: Path`, `properties: Partial<Node>`, `newProperties: Partial<Node>` | 设置节点属性 |
| `split_node`  | `path: Path`, `position: number`, `properties: Partial<Node>`             | 拆分节点     |

**文本操作（TextOperation）：**

| 类型          | 字段                                           | 说明     |
| ------------- | ---------------------------------------------- | -------- |
| `insert_text` | `path: Path`, `offset: number`, `text: string` | 插入文本 |
| `remove_text` | `path: Path`, `offset: number`, `text: string` | 删除文本 |

**选区操作（SelectionOperation）：**

| 类型            | 字段                          | 说明                                   |
| --------------- | ----------------------------- | -------------------------------------- |
| `set_selection` | `properties`, `newProperties` | 设置选区（三种变体：新建、更新、清除） |

### 9.2 Operation 静态方法

#### `Operation.isNodeOperation(value)`

判断是否为节点操作。

#### `Operation.isOperation(value)`

判断是否为操作对象。

#### `Operation.isOperationList(value)`

判断是否为操作数组。

#### `Operation.isSelectionOperation(value)`

判断是否为选区操作。

#### `Operation.isTextOperation(value)`

判断是否为文本操作。

#### `Operation.inverse(op)`

反转操作，返回一个能撤销原操作的新操作。

**返回值：** `Operation`

---

## 十、Transforms 变换方法

`Transforms` 是对编辑器进行高级操作的 API，分为 `NodeTransforms`、`SelectionTransforms`、`TextTransforms` 和 `GeneralTransforms`。

### 10.1 节点变换（NodeTransforms）

#### `Transforms.insertNodes<T>(editor, nodes, options?)`

插入节点。

| 参数               | 类型                    | 说明                             |
| ------------------ | ----------------------- | -------------------------------- |
| nodes              | `Node \| Node[]`        | 要插入的节点                     |
| options.at         | `Location`              | 插入位置，默认当前选区或文档末尾 |
| options.match      | `NodeMatch<T>`          | 匹配函数                         |
| options.mode       | `'highest' \| 'lowest'` | 模式                             |
| options.hanging    | `boolean`               | 是否悬挂                         |
| options.select     | `boolean`               | 插入后是否选中                   |
| options.voids      | `boolean`               | 是否包含 void                    |
| options.batchDirty | `boolean`               | 是否批量标记脏路径               |

#### `Transforms.liftNodes<T>(editor, options?)`

提升节点，将其从父节点中提升到与父节点同级。

| 参数          | 类型                             | 说明          |
| ------------- | -------------------------------- | ------------- |
| options.at    | `Location`                       | 位置          |
| options.match | `NodeMatch<T>`                   | 匹配函数      |
| options.mode  | `'highest' \| 'lowest' \| 'all'` | 模式          |
| options.voids | `boolean`                        | 是否包含 void |

#### `Transforms.mergeNodes<T>(editor, options?)`

合并节点，将节点与前一个同级节点合并。

| 参数            | 类型                    | 说明          |
| --------------- | ----------------------- | ------------- |
| options.at      | `Location`              | 位置          |
| options.match   | `NodeMatch<T>`          | 匹配函数      |
| options.mode    | `'highest' \| 'lowest'` | 模式          |
| options.hanging | `boolean`               | 是否悬挂      |
| options.voids   | `boolean`               | 是否包含 void |

#### `Transforms.moveNodes<T>(editor, options)`

移动节点到新位置。

| 参数          | 类型                             | 说明                  |
| ------------- | -------------------------------- | --------------------- |
| options.at    | `Location`                       | 源位置                |
| options.match | `NodeMatch<T>`                   | 匹配函数              |
| options.mode  | `'highest' \| 'lowest' \| 'all'` | 模式                  |
| options.to    | `Path`                           | **（必填）** 目标路径 |
| options.voids | `boolean`                        | 是否包含 void         |

#### `Transforms.removeNodes<T>(editor, options?)`

移除节点。

| 参数            | 类型                    | 说明          |
| --------------- | ----------------------- | ------------- |
| options.at      | `Location`              | 位置          |
| options.match   | `NodeMatch<T>`          | 匹配函数      |
| options.mode    | `'highest' \| 'lowest'` | 模式          |
| options.hanging | `boolean`               | 是否悬挂      |
| options.voids   | `boolean`               | 是否包含 void |

#### `Transforms.setNodes<T>(editor, props, options?)`

设置节点属性。

| 参数            | 类型                             | 说明           |
| --------------- | -------------------------------- | -------------- |
| props           | `Partial<T>`                     | 要设置的新属性 |
| options.at      | `Location`                       | 位置           |
| options.match   | `NodeMatch<T>`                   | 匹配函数       |
| options.mode    | `'highest' \| 'lowest' \| 'all'` | 模式           |
| options.hanging | `boolean`                        | 是否悬挂       |
| options.split   | `boolean`                        | 是否拆分节点   |
| options.voids   | `boolean`                        | 是否包含 void  |
| options.compare | `PropsCompare`                   | 属性比较函数   |
| options.merge   | `PropsMerge`                     | 属性合并函数   |

#### `Transforms.splitNodes<T>(editor, options?)`

拆分节点。

| 参数           | 类型                    | 说明          |
| -------------- | ----------------------- | ------------- |
| options.at     | `Location`              | 拆分位置      |
| options.match  | `NodeMatch<T>`          | 匹配函数      |
| options.mode   | `'highest' \| 'lowest'` | 模式          |
| options.always | `boolean`               | 是否总是拆分  |
| options.height | `number`                | 拆分高度      |
| options.voids  | `boolean`               | 是否包含 void |

#### `Transforms.unsetNodes<T>(editor, props, options?)`

移除节点属性。

| 参数    | 类型                                     | 说明           |
| ------- | ---------------------------------------- | -------------- |
| props   | `string \| string[]`                     | 要移除的属性名 |
| options | 同 `setNodes`（无 `compare` 和 `merge`） | 选项           |

#### `Transforms.unwrapNodes<T>(editor, options?)`

取消节点包裹，将子节点从父容器中提取出来。

| 参数          | 类型                             | 说明          |
| ------------- | -------------------------------- | ------------- |
| options.at    | `Location`                       | 位置          |
| options.match | `NodeMatch<T>`                   | 匹配函数      |
| options.mode  | `'highest' \| 'lowest' \| 'all'` | 模式          |
| options.split | `boolean`                        | 是否拆分      |
| options.voids | `boolean`                        | 是否包含 void |

#### `Transforms.wrapNodes<T>(editor, element, options?)`

用新容器节点包裹匹配的节点。

| 参数          | 类型                             | 说明          |
| ------------- | -------------------------------- | ------------- |
| element       | `Element`                        | 包裹容器元素  |
| options.at    | `Location`                       | 位置          |
| options.match | `NodeMatch<T>`                   | 匹配函数      |
| options.mode  | `'highest' \| 'lowest' \| 'all'` | 模式          |
| options.split | `boolean`                        | 是否拆分      |
| options.voids | `boolean`                        | 是否包含 void |

### 10.2 选区变换（SelectionTransforms）

#### `Transforms.collapse(editor, options?)`

折叠选区。

| 参数         | 类型                                      | 说明         |
| ------------ | ----------------------------------------- | ------------ |
| options.edge | `'anchor' \| 'focus' \| 'start' \| 'end'` | 折叠到哪一边 |

#### `Transforms.deselect(editor)`

取消选区。

#### `Transforms.move(editor, options?)`

移动选区的点。

| 参数             | 类型                                          | 说明         |
| ---------------- | --------------------------------------------- | ------------ |
| options.distance | `number`                                      | 移动距离     |
| options.unit     | `'offset' \| 'character' \| 'word' \| 'line'` | 移动单位     |
| options.reverse  | `boolean`                                     | 是否反向移动 |
| options.edge     | `'anchor' \| 'focus' \| 'start' \| 'end'`     | 移动哪个边   |

#### `Transforms.select(editor, target)`

设置选区。

| 参数   | 类型       | 说明     |
| ------ | ---------- | -------- |
| target | `Location` | 目标位置 |

#### `Transforms.setPoint(editor, props, options?)`

设置选区某个点的属性。

| 参数         | 类型                                      | 说明         |
| ------------ | ----------------------------------------- | ------------ |
| props        | `Partial<Point>`                          | 要设置的属性 |
| options.edge | `'anchor' \| 'focus' \| 'start' \| 'end'` | 哪个点       |

#### `Transforms.setSelection(editor, props)`

设置选区属性。

| 参数  | 类型             | 说明         |
| ----- | ---------------- | ------------ |
| props | `Partial<Range>` | 要设置的属性 |

### 10.3 文本变换（TextTransforms）

#### `Transforms.delete(editor, options?)`

删除内容。

| 参数             | 类型                                         | 说明                   |
| ---------------- | -------------------------------------------- | ---------------------- |
| options.at       | `Location`                                   | 删除位置，默认当前选区 |
| options.distance | `number`                                     | 删除距离               |
| options.unit     | `'character' \| 'word' \| 'line' \| 'block'` | 删除单位               |
| options.reverse  | `boolean`                                    | 是否反向删除           |
| options.hanging  | `boolean`                                    | 是否悬挂               |
| options.voids    | `boolean`                                    | 是否包含 void          |

#### `Transforms.insertFragment(editor, fragment, options?)`

插入文档片段。

| 参数               | 类型       | 说明               |
| ------------------ | ---------- | ------------------ |
| fragment           | `Node[]`   | 文档片段           |
| options.at         | `Location` | 插入位置           |
| options.hanging    | `boolean`  | 是否悬挂           |
| options.voids      | `boolean`  | 是否包含 void      |
| options.batchDirty | `boolean`  | 是否批量标记脏路径 |

#### `Transforms.insertText(editor, text, options?)`

插入文本。

| 参数          | 类型       | 说明          |
| ------------- | ---------- | ------------- |
| text          | `string`   | 文本内容      |
| options.at    | `Location` | 插入位置      |
| options.voids | `boolean`  | 是否包含 void |

### 10.4 通用变换（GeneralTransforms）

#### `Transforms.transform(editor, op)`

通过操作变换编辑器。

| 参数 | 类型        | 说明     |
| ---- | ----------- | -------- |
| op   | `Operation` | 操作对象 |

---

## 十一、slate-react API

### 11.1 组件

#### `<Slate>`

编辑器上下文提供者组件。

```tsx
<Slate
  editor={reactEditor}          // ReactEditor 实例
  initialValue={Descendant[]}   // 初始值
  onChange={(value) => {}}      // 值变化回调
  onSelectionChange={(sel) => {}} // 选区变化回调
  onValueChange={(value) => {}}   // 值变化回调
>
  {children}
</Slate>
```

#### `<Editable>`

可编辑区域组件。

| 属性                    | 类型                                             | 说明                 |
| ----------------------- | ------------------------------------------------ | -------------------- |
| decorate                | `(entry: NodeEntry) => DecoratedRange[]`         | 装饰函数             |
| onDOMBeforeInput        | `(event: InputEvent) => void`                    | DOM beforeinput 事件 |
| placeholder             | `string`                                         | 占位文本             |
| readOnly                | `boolean`                                        | 只读模式             |
| role                    | `string`                                         | ARIA 角色            |
| style                   | `React.CSSProperties`                            | 样式                 |
| renderElement           | `(props: RenderElementProps) => JSX.Element`     | 自定义元素渲染       |
| renderChunk             | `(props: RenderChunkProps) => JSX.Element`       | 自定义块渲染         |
| renderLeaf              | `(props: RenderLeafProps) => JSX.Element`        | 自定义叶子渲染       |
| renderText              | `(props: RenderTextProps) => JSX.Element`        | 自定义文本渲染       |
| renderPlaceholder       | `(props: RenderPlaceholderProps) => JSX.Element` | 自定义占位符渲染     |
| scrollSelectionIntoView | `(editor, domRange) => void`                     | 滚动选区到可视区域   |
| as                      | `React.ElementType`                              | 容器元素标签         |
| disableDefaultStyles    | `boolean`                                        | 禁用默认样式         |

#### `<DefaultElement>`

默认元素渲染组件。

#### `<DefaultText>`

默认文本渲染组件。

#### `<DefaultLeaf>`

默认叶子渲染组件。

#### `<DefaultPlaceholder>`

默认占位符渲染组件。

### 11.2 渲染属性接口

```typescript
interface RenderElementProps {
  children: any;
  element: Element;
  attributes: {
    'data-slate-node': 'element';
    'data-slate-inline'?: true;
    'data-slate-void'?: true;
    dir?: 'rtl';
    ref: any;
  };
}

interface RenderLeafProps {
  children: any;
  leaf: Text; // 应用装饰后的叶子节点
  text: Text; // 原始文本节点
  attributes: {
    'data-slate-leaf': true;
  };
  leafPosition?: LeafPosition; // 叶子在文本节点中的位置
}

interface RenderTextProps {
  text: Text;
  children: any;
  attributes: {
    'data-slate-node': 'text';
    ref: any;
  };
}

interface RenderChunkProps {
  highest: boolean;
  lowest: boolean;
  children: any;
  attributes: {
    'data-slate-chunk': true;
  };
}

interface RenderPlaceholderProps {
  children: any;
  attributes: {
    'data-slate-placeholder': boolean;
    dir?: 'rtl';
    contentEditable: boolean;
    ref: React.RefCallback<any>;
    style: React.CSSProperties;
  };
}
```

### 11.3 Hooks

#### `useSlate()`

获取当前编辑器实例，编辑器变化时触发重渲染。

**返回值：** `Editor`

#### `useSlateStatic()`

获取当前编辑器实例，不会触发重渲染。

**返回值：** `Editor`

#### `useSlateSelection()`

获取当前选区，仅在选区变化时触发重渲染。

**返回值：** `BaseSelection`

#### `useSlateSelector<T>(selector, equalityFn?, options?)`

使用 Redux 风格的选择器，防止每次按键都重渲染。

| 参数             | 类型                              | 说明                                 |
| ---------------- | --------------------------------- | ------------------------------------ |
| selector         | `(editor: Editor) => T`           | 选择器函数                           |
| equalityFn       | `(a: T \| null, b: T) => boolean` | 相等比较函数                         |
| options.deferred | `boolean`                         | 是否延迟调用选择器（确保路径不过时） |

**返回值：** `T`

#### `useEditor()`

获取编辑器实例（已弃用，请使用 `useSlateStatic`）。

#### `useComposing()`

获取编辑器是否正在输入法组合中。

**返回值：** `boolean`

#### `useFocused()`

获取编辑器是否获得焦点。

**返回值：** `boolean`

#### `useReadOnly()`

获取编辑器是否处于只读模式。

**返回值：** `boolean`

#### `useSelected()`

获取当前元素是否被选中。

**返回值：** `boolean`

#### `useElement()`

获取当前元素。

**返回值：** `Element`

#### `useElementIf()`

获取当前元素，不在 `renderElement` 中时返回 `null`。

**返回值：** `BaseElement | null`

### 11.4 插件函数

#### `withReact(editor, clipboardFormatKey?)`

为编辑器添加 React 和 DOM 特定行为。

| 参数               | 类型         | 说明         |
| ------------------ | ------------ | ------------ |
| editor             | `BaseEditor` | 基础编辑器   |
| clipboardFormatKey | `string`     | 剪贴板格式键 |

**返回值：** `T & ReactEditor`

### 11.5 常量

| 常量                                 | 说明                          |
| ------------------------------------ | ----------------------------- |
| `NODE_TO_INDEX`                      | 节点到索引的 WeakMap          |
| `NODE_TO_PARENT`                     | 节点到父节点的 WeakMap        |
| `defaultScrollSelectionIntoView`     | 默认滚动选区到可视区域的函数  |
| `isEventHandled(event, handler?)`    | 判断事件是否被处理器覆盖      |
| `isDOMEventHandled(event, handler?)` | 判断 DOM 事件是否被处理器覆盖 |
| `isDOMEventTargetInput(event)`       | 判断事件目标是否为输入元素    |

---

## 十二、slate-dom API

### 12.1 DOMEditor 接口

DOM 特定的编辑器扩展接口。

```typescript
interface DOMEditor extends BaseEditor {
  hasEditableTarget: (editor, target) => target is DOMNode;
  hasRange: (editor, range) => boolean;
  hasSelectableTarget: (editor, target) => boolean;
  hasTarget: (editor, target) => target is DOMNode;
  insertData: (data: DataTransfer) => void;
  insertFragmentData: (data: DataTransfer) => boolean;
  insertTextData: (data: DataTransfer) => boolean;
  isTargetInsideNonReadonlyVoid: (editor, target) => boolean;
  setFragmentData: (data: DataTransfer, originEvent?) => void;
}
```

### 12.2 DOMEditor 静态方法

#### `DOMEditor.blur(editor)`

使编辑器失去焦点。

#### `DOMEditor.deselect(editor)`

取消编辑器选区。

#### `DOMEditor.focus(editor, options?)`

使编辑器获得焦点。

| 参数            | 类型     | 说明     |
| --------------- | -------- | -------- |
| options.retries | `number` | 重试次数 |

#### `DOMEditor.findDocumentOrShadowRoot(editor)`

查找编辑器所在的 Document 或 ShadowRoot。

**返回值：** `Document | ShadowRoot`

#### `DOMEditor.findEventRange(editor, event)`

从 DOM 事件获取目标范围。

**返回值：** `Range`

#### `DOMEditor.findKey(editor, node)`

查找 Slate 节点的唯一 Key。

**返回值：** `Key`

#### `DOMEditor.findPath(editor, node)`

查找 Slate 节点的路径。

**返回值：** `Path`

#### `DOMEditor.getWindow(editor)`

获取编辑器所在的 Window 对象。

**返回值：** `Window`

#### `DOMEditor.hasDOMNode(editor, target, options?)`

判断 DOM 节点是否在编辑器内。

| 参数             | 类型      | 说明                 |
| ---------------- | --------- | -------------------- |
| options.editable | `boolean` | 是否仅检查可编辑区域 |

#### `DOMEditor.hasEditableTarget(editor, target)`

判断目标是否在编辑器可编辑区域内。

#### `DOMEditor.hasRange(editor, range)`

判断编辑器是否有指定范围。

#### `DOMEditor.hasSelectableTarget(editor, target)`

判断目标是否可选中。

#### `DOMEditor.hasTarget(editor, target)`

判断目标是否在编辑器内。

#### `DOMEditor.insertData(editor, data)`

从 DataTransfer 插入数据。

#### `DOMEditor.insertFragmentData(editor, data)`

从 DataTransfer 插入片段数据。

**返回值：** `boolean`

#### `DOMEditor.insertTextData(editor, data)`

从 DataTransfer 插入文本数据。

**返回值：** `boolean`

#### `DOMEditor.isComposing(editor)`

判断编辑器是否正在输入法组合中。

#### `DOMEditor.isFocused(editor)`

判断编辑器是否获得焦点。

#### `DOMEditor.isReadOnly(editor)`

判断编辑器是否处于只读模式。

#### `DOMEditor.isTargetInsideNonReadonlyVoid(editor, target)`

判断目标是否在非只读的 void 元素内。

#### `DOMEditor.setFragmentData(editor, data, originEvent?)`

将当前选区片段数据设置到 DataTransfer。

| 参数        | 类型                        | 说明         |
| ----------- | --------------------------- | ------------ |
| originEvent | `'drag' \| 'copy' \| 'cut'` | 来源事件类型 |

#### `DOMEditor.toDOMNode(editor, node)`

从 Slate 节点查找对应的 DOM 元素。

**返回值：** `HTMLElement`

#### `DOMEditor.toDOMPoint(editor, point)`

从 Slate 点查找对应的 DOM 点。

**返回值：** `DOMPoint`

#### `DOMEditor.toDOMRange(editor, range)`

从 Slate 范围查找对应的 DOM Range。

**返回值：** `DOMRange`（始终按文档顺序，不受 Slate 范围方向影响）

#### `DOMEditor.toSlateNode(editor, domNode)`

从 DOM 节点查找对应的 Slate 节点。

**返回值：** `Node`

#### `DOMEditor.toSlatePoint(editor, domPoint, options)`

从 DOM 点查找对应的 Slate 点。

| 参数                    | 类型                      | 说明                 |
| ----------------------- | ------------------------- | -------------------- |
| domPoint                | `DOMPoint`                | DOM 点               |
| options.exactMatch      | `boolean`                 | 是否精确匹配         |
| options.suppressThrow   | `boolean`                 | 找不到时是否不抛异常 |
| options.searchDirection | `'forward' \| 'backward'` | 搜索方向             |

**返回值：** `Point | null`（suppressThrow 为 true 时）

#### `DOMEditor.toSlateRange(editor, domRange, options)`

从 DOM Range 查找对应的 Slate Range。

| 参数                  | 类型                                         | 说明                 |
| --------------------- | -------------------------------------------- | -------------------- |
| domRange              | `DOMRange \| DOMStaticRange \| DOMSelection` | DOM 范围             |
| options.exactMatch    | `boolean`                                    | 是否精确匹配         |
| options.suppressThrow | `boolean`                                    | 找不到时是否不抛异常 |

**返回值：** `Range | null`（suppressThrow 为 true 时）

### 12.3 插件函数

#### `withDOM(editor, clipboardFormatKey?)`

为编辑器添加 DOM 特定行为。

| 参数               | 类型         | 说明         |
| ------------------ | ------------ | ------------ |
| editor             | `BaseEditor` | 基础编辑器   |
| clipboardFormatKey | `string`     | 剪贴板格式键 |

**返回值：** `T & DOMEditor`

### 12.4 DOM 工具函数

| 函数                                 | 说明                          |
| ------------------------------------ | ----------------------------- |
| `getActiveElement()`                 | 获取当前活跃元素              |
| `getDefaultView(element)`            | 获取元素所在的默认 Window     |
| `getSelection(window)`               | 获取当前选区                  |
| `hasShadowRoot(element)`             | 判断元素是否有 ShadowRoot     |
| `isAfter(node, anotherNode)`         | 判断 DOM 节点是否在另一个之后 |
| `isBefore(node, anotherNode)`        | 判断 DOM 节点是否在另一个之前 |
| `isDOMElement(value)`                | 判断值是否为 DOM 元素         |
| `isDOMNode(value)`                   | 判断值是否为 DOM 节点         |
| `isDOMSelection(value)`              | 判断值是否为 DOM 选区         |
| `isPlainTextOnlyPaste(dataTransfer)` | 判断是否为纯文本粘贴          |
| `normalizeDOMPoint(point)`           | 规范化 DOM 点                 |

### 12.5 环境检测常量

| 常量                       | 类型      | 说明                      |
| -------------------------- | --------- | ------------------------- |
| `CAN_USE_DOM`              | `boolean` | 是否可以使用 DOM          |
| `HAS_BEFORE_INPUT_SUPPORT` | `boolean` | 是否支持 beforeinput 事件 |
| `IS_ANDROID`               | `boolean` | 是否为 Android            |
| `IS_CHROME`                | `boolean` | 是否为 Chrome             |
| `IS_FIREFOX`               | `boolean` | 是否为 Firefox            |
| `IS_FIREFOX_LEGACY`        | `boolean` | 是否为旧版 Firefox        |
| `IS_IOS`                   | `boolean` | 是否为 iOS                |
| `IS_WEBKIT`                | `boolean` | 是否为 WebKit             |
| `IS_UC_MOBILE`             | `boolean` | 是否为 UC 移动浏览器      |
| `IS_WECHATBROWSER`         | `boolean` | 是否为微信浏览器          |

### 12.6 其他导出

| 导出                          | 说明                                       |
| ----------------------------- | ------------------------------------------ |
| `Hotkeys`                     | 热键工具（判断键盘事件是否匹配特定快捷键） |
| `Key`                         | 节点唯一键类                               |
| `TRIPLE_CLICK`                | 三击检测常量                               |
| `applyStringDiff()`           | 应用字符串差异                             |
| `mergeStringDiffs()`          | 合并字符串差异                             |
| `normalizePoint()`            | 规范化点                                   |
| `normalizeRange()`            | 规范化范围                                 |
| `normalizeStringDiff()`       | 规范化字符串差异                           |
| `targetRange()`               | 获取目标范围                               |
| `verifyDiffState()`           | 验证差异状态                               |
| `isElementDecorationsEqual()` | 判断元素装饰是否相等                       |
| `isTextDecorationsEqual()`    | 判断文本装饰是否相等                       |
| `splitDecorationsByChild()`   | 按子节点拆分装饰                           |

### 12.7 WeakMap 常量

| 常量                                | 说明                         |
| ----------------------------------- | ---------------------------- |
| `EDITOR_TO_ELEMENT`                 | 编辑器到 DOM 元素的映射      |
| `EDITOR_TO_FORCE_RENDER`            | 编辑器到强制渲染的映射       |
| `EDITOR_TO_KEY_TO_ELEMENT`          | 编辑器到 Key-Element 映射    |
| `EDITOR_TO_ON_CHANGE`               | 编辑器到 onChange 回调的映射 |
| `EDITOR_TO_PENDING_ACTION`          | 编辑器到待处理操作的映射     |
| `EDITOR_TO_PENDING_DIFFS`           | 编辑器到待处理差异的映射     |
| `EDITOR_TO_PENDING_INSERTION_MARKS` | 编辑器到待插入 marks 的映射  |
| `EDITOR_TO_PENDING_SELECTION`       | 编辑器到待处理选区的映射     |
| `EDITOR_TO_PLACEHOLDER_ELEMENT`     | 编辑器到占位符元素的映射     |
| `EDITOR_TO_SCHEDULE_FLUSH`          | 编辑器到调度刷新的映射       |
| `EDITOR_TO_USER_MARKS`              | 编辑器到用户 marks 的映射    |
| `EDITOR_TO_USER_SELECTION`          | 编辑器到用户选区的映射       |
| `EDITOR_TO_WINDOW`                  | 编辑器到 Window 的映射       |
| `ELEMENT_TO_NODE`                   | DOM 元素到 Slate 节点的映射  |
| `IS_COMPOSING`                      | 编辑器到组合状态的映射       |
| `IS_FOCUSED`                        | 编辑器到焦点状态的映射       |
| `IS_NODE_MAP_DIRTY`                 | 节点脏标记映射               |
| `IS_READ_ONLY`                      | 编辑器到只读状态的映射       |
| `MARK_PLACEHOLDER_SYMBOL`           | mark 占位符符号              |
| `NODE_TO_ELEMENT`                   | Slate 节点到 DOM 元素的映射  |
| `NODE_TO_INDEX`                     | 节点到索引的映射             |
| `NODE_TO_KEY`                       | 节点到 Key 的映射            |
| `NODE_TO_PARENT`                    | 节点到父节点的映射           |
| `PLACEHOLDER_SYMBOL`                | 占位符符号                   |

---

## 十三、slate-history API

### 13.1 History 接口

```typescript
interface History {
  redos: Batch[]; // 重做栈
  undos: Batch[]; // 撤销栈
}

interface Batch {
  operations: Operation[]; // 操作列表
  selectionBefore: Range | null; // 操作前的选区
}
```

### 13.2 History 静态方法

#### `History.isHistory(value)`

判断值是否为 History 对象。

### 13.3 HistoryEditor 接口

带历史功能的编辑器扩展。

```typescript
interface HistoryEditor extends BaseEditor {
  history: History; // 历史记录
  undo: () => void; // 撤销
  redo: () => void; // 重做
  writeHistory: (stack: 'undos' | 'redos', batch: any) => void; // 写入历史
}
```

### 13.4 HistoryEditor 静态方法

#### `HistoryEditor.isHistoryEditor(value)`

判断值是否为 HistoryEditor。

#### `HistoryEditor.isMerging(editor)`

获取合并标志的当前值。

**返回值：** `boolean | undefined`

#### `HistoryEditor.isSplittingOnce(editor)`

获取单次拆分标志的当前值。

**返回值：** `boolean | undefined`

#### `HistoryEditor.setSplittingOnce(editor, value)`

设置单次拆分标志。

#### `HistoryEditor.isSaving(editor)`

获取保存标志的当前值。

**返回值：** `boolean | undefined`

#### `HistoryEditor.redo(editor)`

重做到上一个保存的状态。

#### `HistoryEditor.undo(editor)`

撤销到上一个保存的状态。

#### `HistoryEditor.withMerging(editor, fn)`

在函数内执行的变更将合并到前一个历史记录中。

| 参数 | 类型         | 说明         |
| ---- | ------------ | ------------ |
| fn   | `() => void` | 要执行的函数 |

#### `HistoryEditor.withNewBatch(editor, fn)`

在函数内执行的变更将开启新的历史批次（后续操作仍正常合并）。

#### `HistoryEditor.withoutMerging(editor, fn)`

在函数内执行的变更不合并到之前的历史记录中。

#### `HistoryEditor.withoutSaving(editor, fn)`

在函数内执行的变更不保存到历史记录中。

### 13.5 插件函数

#### `withHistory(editor)`

为编辑器添加撤销/重做功能。

| 参数   | 类型         | 说明       |
| ------ | ------------ | ---------- |
| editor | `BaseEditor` | 基础编辑器 |

**返回值：** `T & HistoryEditor`

### 13.6 WeakMap 常量

| 常量             | 说明                        |
| ---------------- | --------------------------- |
| `HISTORY`        | 编辑器到 History 对象的映射 |
| `SAVING`         | 编辑器到保存标志的映射      |
| `MERGING`        | 编辑器到合并标志的映射      |
| `SPLITTING_ONCE` | 编辑器到单次拆分标志的映射  |

---

## 十四、辅助类型与工具

### 14.1 类型枚举

```typescript
type LeafEdge = 'start' | 'end'; // 叶子边缘
type MaximizeMode = 'highest' | 'lowest' | 'all'; // 最大化模式
type MoveUnit = 'offset' | 'character' | 'word' | 'line'; // 移动单位
type RangeDirection = 'forward' | 'backward' | 'outward' | 'inward'; // 范围方向
type RangeMode = 'highest' | 'lowest'; // 范围模式
type SelectionEdge = 'anchor' | 'focus' | 'start' | 'end'; // 选区边缘
type SelectionMode = 'all' | 'highest' | 'lowest'; // 选区模式
type TextDirection = 'forward' | 'backward'; // 文本方向
type TextUnit = 'character' | 'word' | 'line' | 'block'; // 文本单位
type TextUnitAdjustment = 'character' | 'word' | 'line' | 'block' | 'offset'; // 文本单位调整
```

### 14.2 工具类型

```typescript
type NodeMatch<T extends Node> = ((node: Node, path: Path) => node is T) | ((node: Node, path: Path) => boolean);

type PropsCompare = (prop: Partial<Node>, node: Partial<Node>) => boolean;
type PropsMerge = (prop: Partial<Node>, node: Partial<Node>) => object;
```

### 14.3 工具函数

#### `isObject(value)`

判断值是否为对象（来自 `slate/dist/utils/is-object`）。

---

## 附：典型编辑器初始化

```typescript
import { createEditor } from 'slate'
import { withHistory, HistoryEditor } from 'slate-history'
import { withReact, ReactEditor } from 'slate-react'

// 创建带历史记录和 React 支持的编辑器
const editor = withHistory(withReact(createEditor()))
// 类型: HistoryEditor & ReactEditor

// 使用
;<Slate editor={editor} initialValue={initialValue}>
  <Editable />
</Slate>
```

> **插件组合顺序**：`createEditor()` → `withReact()` → `withHistory()`
>
> `withReact` 内部调用了 `withDOM`，因此无需单独引入 `withDOM`。
