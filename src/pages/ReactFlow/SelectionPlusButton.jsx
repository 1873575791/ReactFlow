import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useStore, useStoreApi, useReactFlow } from "@xyflow/react";

const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 40;

/**
 * 选中框加号按钮组件
 * 当框选多个节点时，在选中框右下角显示一个加号按钮
 * 点击拖拽时通过 ReactFlow updateConnection 触发原生连线
 * 连线渲染完全由 ReactFlow 的 connectionLineComponent（BatchConnectionLine）处理
 */
const SelectionPlusButton = ({ edges, setEdges }) => {
  const storeApi = useStoreApi();
  const { screenToFlowPosition } = useReactFlow();
  const nodes = useStore((state) => state.nodes);
  const transform = useStore((state) => state.transform);

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const selectedNodesRef = useRef([]);

  // 获取所有选中的节点
  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);

  // 计算选中节点的包围盒
  const boundingBox = useMemo(() => {
    if (selectedNodes.length < 2) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodes.forEach((node) => {
      const width = node.width || DEFAULT_WIDTH;
      const height = node.height || DEFAULT_HEIGHT;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    });

    return { minX, minY, maxX, maxY };
  }, [selectedNodes]);

  // 计算加号按钮在屏幕上的位置（选中框右下角）
  const buttonScreenPosition = useMemo(() => {
    if (!boundingBox) return null;
    const [x, y, zoom] = transform;
    return {
      x: boundingBox.maxX * zoom + x,
      y: boundingBox.maxY * zoom + y,
    };
  }, [boundingBox, transform]);

  // 获取节点的源 Handle 在画布坐标系中的精确位置（从 handleBounds 读取）
  const getNodeSourceHandlePos = useCallback(
    (node) => {
      const internalNode = storeApi.getState().nodeLookup.get(node.id);
      const posAbs = internalNode?.internals?.positionAbsolute || node.position;
      // 从 ReactFlow 内部的 handleBounds 获取 source handle 的精确位置
      const sourceHandle = internalNode?.internals?.handleBounds?.source?.[0];
      if (sourceHandle) {
        return {
          x: posAbs.x + sourceHandle.x + sourceHandle.width / 2,
          y: posAbs.y + sourceHandle.y + sourceHandle.height / 2,
        };
      }
      // 兜底：无 handleBounds 时使用估算位置
      const width = node.width || DEFAULT_WIDTH;
      const height = node.height || DEFAULT_HEIGHT;
      return {
        x: posAbs.x + width,
        y: posAbs.y + height / 2,
      };
    },
    [storeApi],
  );

  // 处理鼠标按下：通过 ReactFlow store 触发原生连线
  const handleMouseDown = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (selectedNodes.length < 2) return;

      selectedNodesRef.current = selectedNodes.map((n) => ({
        id: n.id,
        position: { ...n.position },
        width: n.width || DEFAULT_WIDTH,
        height: n.height || DEFAULT_HEIGHT,
      }));

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const firstNode = selectedNodes[0];
      const fromPos = getNodeSourceHandlePos(firstNode);

      // 通过 store 的 updateConnection 触发 ReactFlow 原生连线
      // 连线的渲染由 ReactFlow 的 connectionLineComponent (BatchConnectionLine) 处理
      storeApi.getState().updateConnection({
        inProgress: true,
        isValid: null,
        from: fromPos,
        fromHandle: {
          nodeId: firstNode.id,
          id: null,
          type: "source",
        },
        fromPosition: "right",
        fromNode: storeApi.getState().nodeLookup.get(firstNode.id),
        to: flowPos,
        toHandle: null,
        toPosition: "left",
        toNode: null,
        pointer: flowPos,
      });

      setIsDragging(true);
      isDraggingRef.current = true;
    },
    [selectedNodes, screenToFlowPosition, storeApi, getNodeSourceHandlePos],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const state = storeApi.getState();
      const currentConnection = state.connection;

      if (currentConnection.inProgress) {
        // 更新连线目标位置，ReactFlow + BatchConnectionLine 自动渲染
        state.updateConnection({
          ...currentConnection,
          to: flowPos,
          pointer: flowPos,
        });
      }
    };

    const handleMouseUp = (e) => {
      if (!isDraggingRef.current) return;

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const currentNodes = storeApi.getState().nodes;

      const target = currentNodes.find((node) => {
        if (node.selected) return false;
        const w = node.width || DEFAULT_WIDTH;
        const h = node.height || DEFAULT_HEIGHT;
        return (
          flowPos.x >= node.position.x &&
          flowPos.x <= node.position.x + w &&
          flowPos.y >= node.position.y &&
          flowPos.y <= node.position.y + h
        );
      });

      if (target) {
        const savedSelectedNodes = selectedNodesRef.current;
        const newEdges = savedSelectedNodes
          .filter((src) => {
            if (src.id === target.id) return false;
            return !edges.some(
              (edge) => edge.source === src.id && edge.target === target.id,
            );
          })
          .map((src) => ({
            id: `${src.id}-${target.id}`,
            source: src.id,
            target: target.id,
          }));

        if (newEdges.length > 0) {
          setEdges((prev) => [...prev, ...newEdges]);
        }
      }

      storeApi.getState().cancelConnection();
      setIsDragging(false);
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, edges, setEdges, screenToFlowPosition, storeApi]);

  // 如果没有选中多个节点，不显示
  if (!buttonScreenPosition || selectedNodes.length < 2) return null;

  const { x: btnX, y: btnY } = buttonScreenPosition;

  return (
    <div
      style={{
        position: "absolute",
        left: btnX + 10,
        top: btnY + 10,
        width: 24,
        height: 24,
        borderRadius: "50%",
        backgroundColor: isDragging ? "#2563eb" : "#3b82f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isDragging ? "grabbing" : "crosshair",
        boxShadow: "0 2px 6px rgba(59,130,246,0.4)",
        zIndex: 1000,
        transform: "translate(-50%, -50%)",
        transition: "background-color 0.15s",
      }}
      onMouseDown={handleMouseDown}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </div>
  );
};

export default SelectionPlusButton;
