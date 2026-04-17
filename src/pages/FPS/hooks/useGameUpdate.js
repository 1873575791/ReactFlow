import * as THREE from "three";
import { CONFIG, FIRE_MODE, FIRE_RATE } from "../config";

// 玩家移动和碰撞
export const updatePlayerMovement = (
  camera,
  obstaclesRef,
  moveState
) => {
  const direction = new THREE.Vector3();
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(camera.quaternion);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3(1, 0, 0);
  right.applyQuaternion(camera.quaternion);
  right.y = 0;
  right.normalize();

  if (moveState.forward) direction.add(forward);
  if (moveState.backward) direction.sub(forward);
  if (moveState.right) direction.add(right);
  if (moveState.left) direction.sub(right);

  if (direction.length() > 0) {
    direction.normalize();

    const playerRadius = 0.5;
    const currentSpeed = moveState.sneak ? CONFIG.sneakSpeed : CONFIG.playerSpeed;
    const moveVector = direction.clone().multiplyScalar(currentSpeed);

    const checkCollision = (newPos) => {
      for (const obstacle of obstaclesRef.current) {
        const box = new THREE.Box3().setFromObject(obstacle);
        box.expandByScalar(playerRadius);
        const playerFeetY = camera.position.y - CONFIG.playerHeight;
        if (playerFeetY >= box.max.y - 0.1) {
          continue;
        }
        if (
          box.containsPoint(
            new THREE.Vector3(newPos.x, camera.position.y, newPos.z)
          )
        ) {
          return true;
        }
      }
      return false;
    };

    const fullNewPos = camera.position.clone().add(moveVector);
    if (!checkCollision(fullNewPos)) {
      camera.position.add(moveVector);
    } else {
      const xOnlyPos = camera.position.clone();
      xOnlyPos.x += moveVector.x;

      const zOnlyPos = camera.position.clone();
      zOnlyPos.z += moveVector.z;

      if (!checkCollision(xOnlyPos)) {
        camera.position.x = xOnlyPos.x;
      }

      if (!checkCollision(zOnlyPos)) {
        camera.position.z = zOnlyPos.z;
      }
    }

    camera.position.x = Math.max(-95, Math.min(95, camera.position.x));
    camera.position.z = Math.max(-95, Math.min(95, camera.position.z));
  }

  return moveState.forward || moveState.backward || moveState.left || moveState.right;
};

// 重力和跳跃
export const updateGravityAndJump = (camera, obstaclesRef, playerPhysicsRef) => {
  const playerPhysics = playerPhysicsRef.current;

  const getGroundInfo = () => {
    const raycaster = new THREE.Raycaster();
    const origin = camera.position.clone();
    origin.y = camera.position.y - CONFIG.playerHeight + 0.1;
    raycaster.set(origin, new THREE.Vector3(0, -1, 0));
    raycaster.far = 3;

    const intersects = raycaster.intersectObjects(obstaclesRef.current);

    if (intersects.length > 0) {
      return {
        height: intersects[0].point.y,
        distance: intersects[0].distance,
      };
    }
    return { height: 0, distance: Infinity };
  };

  const groundInfo = getGroundInfo();
  const targetY = groundInfo.height + CONFIG.playerHeight;

  if (!playerPhysics.isGrounded) {
    playerPhysics.velocityY -= CONFIG.gravity;
    camera.position.y += playerPhysics.velocityY;

    if (camera.position.y <= targetY) {
      camera.position.y = targetY;
      playerPhysics.velocityY = 0;
      playerPhysics.isGrounded = true;
      playerPhysics.jumpCount = 0;
    }
  } else {
    if (camera.position.y < targetY) {
      camera.position.y = targetY;
    } else if (camera.position.y > targetY + 0.2) {
      playerPhysics.isGrounded = false;
    }
  }

  if (playerPhysics.isGrounded && groundInfo.distance > 0.5) {
    playerPhysics.isGrounded = false;
  }

  if (camera.position.y > 10) {
    camera.position.y = 10;
    playerPhysics.velocityY = 0;
  }

  return playerPhysics.isGrounded;
};

// 射击更新
export const updateShooting = (
  isShootingRef,
  fireModeRef,
  lastShootTimeRef,
  burstCountRef,
  createBullet
) => {
  const now = Date.now();
  if (isShootingRef.current && document.pointerLockElement) {
    const currentMode = fireModeRef.current;

    if (
      currentMode === FIRE_MODE.AUTOMATIC &&
      now - lastShootTimeRef.current > FIRE_RATE.automatic
    ) {
      createBullet();
      lastShootTimeRef.current = now;
    }

    if (
      currentMode === FIRE_MODE.BURST &&
      burstCountRef.current > 0 &&
      now - lastShootTimeRef.current > FIRE_RATE.burst
    ) {
      createBullet();
      burstCountRef.current--;
      lastShootTimeRef.current = now;
    }
  }
};

// 子弹更新
export const updateBullets = (bulletsRef, enemiesRef, scene, setScore) => {
  bulletsRef.current = bulletsRef.current.filter((bullet) => {
    bullet.position.add(bullet.userData.velocity);
    bullet.userData.life--;

    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      const dist = bullet.position.distanceTo(enemy.position);
      if (dist < 1.5) {
        enemy.userData.health--;
        if (enemy.userData.health <= 0) {
          scene.remove(enemy);
          enemiesRef.current.splice(i, 1);
          setScore((s) => s + 10);
        }
        scene.remove(bullet);
        return false;
      }
    }

    if (bullet.userData.life <= 0) {
      scene.remove(bullet);
      return false;
    }
    return true;
  });
};

// 敌人更新
export const updateEnemies = (
  enemiesRef,
  obstaclesRef,
  camera,
  setHealth,
  setGameOver
) => {
  const enemyRadius = 0.6;

  const checkEnemyCollision = (pos, excludeEnemy) => {
    for (const obstacle of obstaclesRef.current) {
      const box = new THREE.Box3().setFromObject(obstacle);
      box.expandByScalar(enemyRadius);
      if (box.containsPoint(new THREE.Vector3(pos.x, 1, pos.z))) {
        return true;
      }
    }
    for (const otherEnemy of enemiesRef.current) {
      if (otherEnemy !== excludeEnemy) {
        const dist = pos.distanceTo(otherEnemy.position);
        if (dist < enemyRadius * 2) {
          return true;
        }
      }
    }
    return false;
  };

  enemiesRef.current.forEach((enemy) => {
    const direction = new THREE.Vector3();
    direction.subVectors(camera.position, enemy.position);
    direction.y = 0;
    direction.normalize();

    const moveVector = direction.clone().multiplyScalar(enemy.userData.speed);

    const fullNewPos = enemy.position.clone().add(moveVector);
    if (!checkEnemyCollision(fullNewPos, enemy)) {
      enemy.position.add(moveVector);
    } else {
      const xOnlyPos = enemy.position.clone();
      xOnlyPos.x += moveVector.x;

      const zOnlyPos = enemy.position.clone();
      zOnlyPos.z += moveVector.z;

      if (!checkEnemyCollision(xOnlyPos, enemy)) {
        enemy.position.x = xOnlyPos.x;
      }

      if (!checkEnemyCollision(zOnlyPos, enemy)) {
        enemy.position.z = zOnlyPos.z;
      }
    }

    enemy.position.x = Math.max(-95, Math.min(95, enemy.position.x));
    enemy.position.z = Math.max(-95, Math.min(95, enemy.position.z));

    enemy.lookAt(camera.position.x, enemy.position.y, camera.position.z);

    const distToPlayer = enemy.position.distanceTo(camera.position);
    if (distToPlayer < 1.5) {
      setHealth((h) => {
        const newHealth = h - 10;
        if (newHealth <= 0) {
          setGameOver(true);
          document.exitPointerLock();
        }
        return Math.max(0, newHealth);
      });
    }
  });
};
