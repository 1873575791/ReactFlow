import { useState, useCallback, useRef } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AlignmentGuides from "./AlignmentGuides";
import SelectionPlusButton from "./SelectionPlusButton";
import BatchConnectionLine from "./BatchConnectionLine";

const initialNodes = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
];
const initialEdges = [{ id: "n1-n2", source: "n1", target: "n2" }];

const ReactFlowContent = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // 保存吸附位置的 ref
  const snapPositionRef = useRef(null);

  const onNodesChange = useCallback((changes) => {
    // 如果有吸附位置，在拖拽结束时应用
    if (snapPositionRef.current) {
      const { nodeId, position } = snapPositionRef.current;
      setNodes((nds) => {
        const updated = nds.map((n) =>
          n.id === nodeId ? { ...n, position } : n,
        );
        return applyNodeChanges(changes, updated);
      });
      return;
    }
    setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot));
  }, []);
  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);

  const onNodeDragStart = useCallback(() => {
    setIsDragging(true);
    snapPositionRef.current = null;
  }, []);

  const onNodeDragStop = useCallback(() => {
    setIsDragging(false);
    // 拖拽结束时，如果有吸附位置，确保最终位置正确
    if (snapPositionRef.current) {
      const { nodeId, position } = snapPositionRef.current;
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, position } : n)),
      );
      snapPositionRef.current = null;
    }
  }, []);

  // 对齐阈值
  const snapThreshold = 5;

  // 默认节点尺寸
  const DEFAULT_WIDTH = 150;
  const DEFAULT_HEIGHT = 40;

  // 拖动时回调
  const onNodeDrag = useCallback(
    (event, node) => {
      const otherNodes = nodes.filter((n) => n.id !== node.id);

      const nodeWidth = node.width || DEFAULT_WIDTH;
      const nodeHeight = node.height || DEFAULT_HEIGHT;

      let snapX = node.position.x;
      let snapY = node.position.y;
      let needSnap = false;

      otherNodes.forEach((other) => {
        const otherWidth = other.width || DEFAULT_WIDTH;
        const otherHeight = other.height || DEFAULT_HEIGHT;

        // 当前节点的边缘
        const nodeLeft = node.position.x;
        const nodeRight = node.position.x + nodeWidth;
        const nodeTop = node.position.y;
        const nodeBottom = node.position.y + nodeHeight;

        // 其他节点的边缘
        const otherLeft = other.position.x;
        const otherRight = other.position.x + otherWidth;
        const otherTop = other.position.y;
        const otherBottom = other.position.y + otherHeight;

        // 水平边缘吸附
        if (Math.abs(nodeLeft - otherLeft) < snapThreshold) {
          snapX = otherLeft;
          needSnap = true;
        } else if (Math.abs(nodeLeft - otherRight) < snapThreshold) {
          snapX = otherRight;
          needSnap = true;
        } else if (Math.abs(nodeRight - otherLeft) < snapThreshold) {
          snapX = otherLeft - nodeWidth;
          needSnap = true;
        } else if (Math.abs(nodeRight - otherRight) < snapThreshold) {
          snapX = otherRight - nodeWidth;
          needSnap = true;
        }

        // 垂直边缘吸附
        if (Math.abs(nodeTop - otherTop) < snapThreshold) {
          snapY = otherTop;
          needSnap = true;
        } else if (Math.abs(nodeTop - otherBottom) < snapThreshold) {
          snapY = otherBottom;
          needSnap = true;
        } else if (Math.abs(nodeBottom - otherTop) < snapThreshold) {
          snapY = otherTop - nodeHeight;
          needSnap = true;
        } else if (Math.abs(nodeBottom - otherBottom) < snapThreshold) {
          snapY = otherBottom - nodeHeight;
          needSnap = true;
        }
      });

      // 保存吸附位置到 ref
      if (needSnap) {
        snapPositionRef.current = {
          nodeId: node.id,
          position: { x: snapX, y: snapY },
        };
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id ? { ...n, position: { x: snapX, y: snapY } } : n,
          ),
        );
      } else {
        snapPositionRef.current = null;
      }
    },
    [nodes],
  );

  return (
    <div style={{ width: "100vw", height: "calc(100vh - 73px)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        connectionLineComponent={BatchConnectionLine}
        fitView
        panOnScroll
        selectionOnDrag
        autoPanOnNodeDrag
        autoPanOnConnect
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={15} size={1} />
        <AlignmentGuides isDragging={isDragging} />
        <SelectionPlusButton edges={edges} setEdges={setEdges} />
      </ReactFlow>
    </div>
  );
};

const ReactFlowPage = () => (
  <ReactFlowProvider>
    <ReactFlowContent />
  </ReactFlowProvider>
);

export default ReactFlowPage;
