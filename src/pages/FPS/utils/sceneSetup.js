import * as THREE from "three";
import { CONFIG } from "../config";
import { createWeaponModel } from "../components/Weapon";

// 创建场景
export const createScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 10, 100);
  return scene;
};

// 创建相机
export const createCamera = () => {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, CONFIG.playerHeight, 0);
  return camera;
};

// 创建渲染器
export const createRenderer = (container) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
  return renderer;
};

// 添加灯光
export const addLights = (scene) => {
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 50, 50);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
};

// 创建地面
export const createFloor = (scene, obstaclesRef) => {
  const floorGeometry = new THREE.PlaneGeometry(200, 200);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d3748,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  obstaclesRef.current.push(floor);
};

// 创建网格
export const createGrid = (scene) => {
  const gridHelper = new THREE.GridHelper(200, 50, 0x4a5568, 0x4a5568);
  scene.add(gridHelper);
};

// 创建天花板
export const createCeiling = (scene) => {
  const ceilingGeometry = new THREE.PlaneGeometry(200, 200);
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a202c,
    side: THREE.DoubleSide,
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 10;
  scene.add(ceiling);
};

// 创建墙壁
export const createWalls = (scene, obstaclesRef) => {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x374151,
    side: THREE.DoubleSide,
  });

  const walls = [
    { pos: [0, 5, -100], rot: [0, 0, 0], size: [200, 10] },
    { pos: [0, 5, 100], rot: [0, 0, 0], size: [200, 10] },
    { pos: [-100, 5, 0], rot: [0, Math.PI / 2, 0], size: [200, 10] },
    { pos: [100, 5, 0], rot: [0, Math.PI / 2, 0], size: [200, 10] },
  ];

  walls.forEach(({ pos, rot, size }) => {
    const wallGeometry = new THREE.PlaneGeometry(size[0], size[1]);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(...pos);
    wall.rotation.set(...rot);
    scene.add(wall);
    obstaclesRef.current.push(wall);
  });
};

// 创建障碍物（箱子）
export const createObstacles = (scene, obstaclesRef) => {
  const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568 });

  for (let i = 0; i < 20; i++) {
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(
      (Math.random() - 0.5) * 150,
      1,
      (Math.random() - 0.5) * 150
    );
    box.castShadow = true;
    box.receiveShadow = true;
    scene.add(box);
    obstaclesRef.current.push(box);
  }
};

// 初始化完整场景
export const initializeScene = (container, cameraRef, rendererRef, sceneRef, obstaclesRef, weaponRef) => {
  const scene = createScene();
  const camera = createCamera();
  const renderer = createRenderer(container);

  sceneRef.current = scene;
  cameraRef.current = camera;
  rendererRef.current = renderer;

  addLights(scene);
  createFloor(scene, obstaclesRef);
  createGrid(scene);
  createCeiling(scene);
  createWalls(scene, obstaclesRef);
  createObstacles(scene, obstaclesRef);

  // 添加相机到场景
  scene.add(camera);

  // 创建武器模型
  const weapon = createWeaponModel();
  camera.add(weapon);
  weaponRef.current = weapon;

  // 窗口大小调整
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
    if (container && renderer.domElement) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
  };
};
