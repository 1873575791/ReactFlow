import * as THREE from "three";

// 创建手部和枪械模型
export const createWeaponModel = () => {
  const weaponGroup = new THREE.Group();

  // 手部材质
  const handMaterial = new THREE.MeshStandardMaterial({ color: 0xdeb887 });
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
  const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x1a202c });

  // 左手
  const leftHandGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.18);
  const leftHand = new THREE.Mesh(leftHandGeometry, handMaterial);
  leftHand.position.set(-0.15, -0.12, -0.25);
  leftHand.rotation.set(0.15, 0, -0.1);
  weaponGroup.add(leftHand);

  // 左手臂
  const leftArmGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.2);
  const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
  leftArm.position.set(-0.18, -0.09, -0.1);
  leftArm.rotation.set(0.2, 0, -0.15);
  weaponGroup.add(leftArm);

  // 右手
  const rightHand = new THREE.Mesh(leftHandGeometry, handMaterial);
  rightHand.position.set(0.12, -0.12, -0.25);
  rightHand.rotation.set(0.15, 0, 0.1);
  weaponGroup.add(rightHand);

  // 右手臂
  const rightArm = new THREE.Mesh(leftArmGeometry, armMaterial);
  rightArm.position.set(0.15, -0.09, -0.1);
  rightArm.rotation.set(0.2, 0, 0.15);
  weaponGroup.add(rightArm);

  // 枪身
  const gunBodyGeometry = new THREE.BoxGeometry(0.04, 0.08, 0.35);
  const gunBody = new THREE.Mesh(gunBodyGeometry, gunMaterial);
  gunBody.position.set(0, -0.1, -0.35);
  weaponGroup.add(gunBody);

  // 枪管
  const barrelGeometry = new THREE.CylinderGeometry(0.012, 0.015, 0.25, 8);
  const barrel = new THREE.Mesh(barrelGeometry, darkMaterial);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, -0.08, -0.55);
  weaponGroup.add(barrel);

  // 弹匣
  const magGeometry = new THREE.BoxGeometry(0.03, 0.1, 0.05);
  const mag = new THREE.Mesh(magGeometry, darkMaterial);
  mag.position.set(0, -0.18, -0.32);
  weaponGroup.add(mag);

  // 枪把
  const gripGeometry = new THREE.BoxGeometry(0.035, 0.08, 0.05);
  const grip = new THREE.Mesh(gripGeometry, gunMaterial);
  grip.position.set(0, -0.16, -0.25);
  grip.rotation.x = 0.25;
  weaponGroup.add(grip);

  // 瞄准镜
  const sightGeometry = new THREE.BoxGeometry(0.025, 0.03, 0.05);
  const frontSight = new THREE.Mesh(sightGeometry, darkMaterial);
  frontSight.position.set(0, -0.04, -0.45);
  weaponGroup.add(frontSight);

  const rearSight = new THREE.Mesh(sightGeometry, darkMaterial);
  rearSight.position.set(0, -0.04, -0.25);
  weaponGroup.add(rearSight);

  // 整体缩放并移到屏幕右下方
  weaponGroup.scale.set(0.6, 0.6, 0.6);
  weaponGroup.position.set(0.2, -0.15, 0);

  return weaponGroup;
};

// 更新武器动画
export const updateWeaponAnimation = (
  weapon,
  recoil,
  isMoving,
  isGrounded,
  deltaTime = 0.01
) => {
  if (!weapon) return recoil;

  // 后坐力恢复
  if (recoil > 0) {
    recoil *= 0.85;
    if (recoil < 0.001) {
      recoil = 0;
    }
  }

  // 应用后坐力位移
  const recoilZ = recoil * 0.3;
  const recoilRotX = recoil * 0.5;

  // 行走摆动
  let walkBob = 0;
  let sideBob = 0;
  if (isMoving && isGrounded) {
    const time = Date.now() * deltaTime;
    walkBob = Math.sin(time) * 0.01;
    sideBob = Math.cos(time * 0.5) * 0.005;
  }

  // 应用所有动画效果
  weapon.position.z = -recoilZ;
  weapon.position.y = walkBob;
  weapon.position.x = sideBob;
  weapon.rotation.x = recoilRotX;

  return recoil;
};
