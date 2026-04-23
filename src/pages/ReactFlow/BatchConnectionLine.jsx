import { getBezierPath, useStore } from "@xyflow/react";

const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 40;

/**
 * 批量连线组件
 * 作为 ReactFlow 的 connectionLineComponent 使用
 * 当多节点选中时，从每个选中节点的 Handle 拉出连线到鼠标位置
 * 全部使用 ReactFlow 原生 getBezierPath 渲染，在 ReactFlow 的 SVG 视口内
 */
const BatchConnectionLine = ({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
  fromNode,
}) => {
  const nodes = useStore((s) => s.nodes);
  const nodeLookup = useStore((s) => s.nodeLookup);

  // 获取其他选中的节点（排除触发连线的那个）
  const otherSelectedNodes = nodes.filter(
    (n) => n.selected && n.id !== fromNode?.id,
  );

  // 主连线：从触发连线的节点 Handle 到鼠标位置
  const [mainPath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  return (
    <g>
      {/* 主连线（触发节点） */}
      <path
        d={mainPath}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        className="react-flow__connection-path"
      />
      {/* 从其他选中节点的 Handle 拉出补充连线 */}
      {otherSelectedNodes.map((node) => {
        const internalNode = nodeLookup.get(node.id);
        const posAbs =
          internalNode?.internals?.positionAbsolute || node.position;

        // 从 ReactFlow 内部的 handleBounds 获取 source handle 的精确位置
        const sourceHandle = internalNode?.internals?.handleBounds?.source?.[0];
        let sourceX, sourceY;
        if (sourceHandle) {
          sourceX = posAbs.x + sourceHandle.x + sourceHandle.width / 2;
          sourceY = posAbs.y + sourceHandle.y + sourceHandle.height / 2;
        } else {
          // 兜底
          const width = node.width || DEFAULT_WIDTH;
          const height = node.height || DEFAULT_HEIGHT;
          sourceX = posAbs.x + width;
          sourceY = posAbs.y + height / 2;
        }

        const [path] = getBezierPath({
          sourceX,
          sourceY,
          sourcePosition: "right",
          targetX: toX,
          targetY: toY,
          targetPosition: "left",
        });

        return (
          <path
            key={node.id}
            d={path}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            className="react-flow__connection-path"
          />
        );
      })}
    </g>
  );
};

export default BatchConnectionLine;
