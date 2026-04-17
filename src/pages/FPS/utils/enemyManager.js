import * as THREE from "three";
import { CONFIG } from "../config";

// 生成敌人
export const spawnEnemy = (scene, enemiesRef) => {
  if (enemiesRef.current.length >= CONFIG.maxEnemies) return;

  const enemyGeometry = new THREE.BoxGeometry(1, 2, 1);
  const enemyMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    emissive: 0x441111,
  });
  const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

  const angle = Math.random() * Math.PI * 2;
  const distance = 30 + Math.random() * 30;
  enemy.position.set(
    Math.cos(angle) * distance,
    1,
    Math.sin(angle) * distance
  );

  enemy.userData.health = 3;
  enemy.userData.speed = CONFIG.enemySpeed * (0.8 + Math.random() * 0.4);

  scene.add(enemy);
  enemiesRef.current.push(enemy);
};
