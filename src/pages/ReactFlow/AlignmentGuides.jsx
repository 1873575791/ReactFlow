import { useMemo } from "react";
import { useStore } from "@xyflow/react";

/**
 * 对齐线组件
 * 在拖拽节点时显示对齐参考线
 */
const AlignmentGuides = ({ isDragging }) => {
  const nodes = useStore((state) => state.nodes);
  const transform = useStore((state) => state.transform);
  const selectedNodes = nodes.filter((n) => n.selected);

  const guides = useMemo(() => {
    if (!isDragging || selectedNodes.length !== 1) return [];

    const draggedNode = selectedNodes[0];
    const otherNodes = nodes.filter((n) => n.id !== draggedNode.id);
    const lines = [];
    const threshold = 5; // 对齐阈值

    // 使用默认尺寸，ReactFlow 默认节点大约 150x40
    const DEFAULT_WIDTH = 150;
    const DEFAULT_HEIGHT = 40;

    const draggedWidth = draggedNode.width || DEFAULT_WIDTH;
    const draggedHeight = draggedNode.height || DEFAULT_HEIGHT;

    otherNodes.forEach((node) => {
      const nodeWidth = node.width || DEFAULT_WIDTH;
      const nodeHeight = node.height || DEFAULT_HEIGHT;

      const draggedCenter = {
        x: draggedNode.position.x + draggedWidth / 2,
        y: draggedNode.position.y + draggedHeight / 2,
      };
      const nodeCenter = {
        x: node.position.x + nodeWidth / 2,
        y: node.position.y + nodeHeight / 2,
      };

      // 水平中心对齐
      if (Math.abs(draggedCenter.y - nodeCenter.y) < threshold) {
        lines.push({
          type: "horizontal",
          y: draggedCenter.y,
          id: `h-center-${node.id}`,
        });
      }

      // 垂直中心对齐
      if (Math.abs(draggedCenter.x - nodeCenter.x) < threshold) {
        lines.push({
          type: "vertical",
          x: draggedCenter.x,
          id: `v-center-${node.id}`,
        });
      }

      // 边缘坐标
      const draggedLeft = draggedNode.position.x;
      const draggedRight = draggedNode.position.x + draggedWidth;
      const draggedTop = draggedNode.position.y;
      const draggedBottom = draggedNode.position.y + draggedHeight;

      const nodeLeft = node.position.x;
      const nodeRight = node.position.x + nodeWidth;
      const nodeTop = node.position.y;
      const nodeBottom = node.position.y + nodeHeight;

      // 垂直线 - 比较所有垂直边缘
      const verticalEdges = [
        { pos: draggedLeft, id: "draggedL" },
        { pos: draggedRight, id: "draggedR" },
      ];
      const nodeVerticalEdges = [
        { pos: nodeLeft, id: "nodeL" },
        { pos: nodeRight, id: "nodeR" },
      ];

      verticalEdges.forEach((dragged) => {
        nodeVerticalEdges.forEach((other) => {
          if (Math.abs(dragged.pos - other.pos) < threshold) {
            lines.push({
              type: "vertical",
              x: dragged.pos,
              id: `v-${dragged.id}-${other.id}-${node.id}`,
            });
          }
        });
      });

      // 水平线 - 比较所有水平边缘
      const horizontalEdges = [
        { pos: draggedTop, id: "draggedT" },
        { pos: draggedBottom, id: "draggedB" },
      ];
      const nodeHorizontalEdges = [
        { pos: nodeTop, id: "nodeT" },
        { pos: nodeBottom, id: "nodeB" },
      ];

      horizontalEdges.forEach((dragged) => {
        nodeHorizontalEdges.forEach((other) => {
          if (Math.abs(dragged.pos - other.pos) < threshold) {
            lines.push({
              type: "horizontal",
              y: dragged.pos,
              id: `h-${dragged.id}-${other.id}-${node.id}`,
            });
          }
        });
      });
    });

    return lines;
  }, [selectedNodes, nodes, isDragging]);

  if (guides.length === 0) return null;

  const [x, y, zoom] = transform;

  return (
    <div className="react-flow__alignment-guides">
      {guides.map((guide) => (
        <div
          key={guide.id}
          style={{
            position: "absolute",
            backgroundColor: "#ff0072",
            pointerEvents: "none",
            ...(guide.type === "horizontal"
              ? {
                  left: 0,
                  right: 0,
                  top: guide.y * zoom + y,
                  height: 1 / zoom,
                }
              : {
                  top: 0,
                  bottom: 0,
                  left: guide.x * zoom + x,
                  width: 1 / zoom,
                }),
          }}
        />
      ))}
    </div>
  );
};

export default AlignmentGuides;
