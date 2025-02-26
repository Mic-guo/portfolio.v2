import React, { useRef, useEffect, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

export function Rope({
  physicsWorld,
  yOffset = 2,
  onRopeReady,
  ropeSegments = 60,
  ropeLength = 6,
}) {
  const ropeMeshRef = useRef();
  const [softBody, setSoftBody] = useState(null);
  const initialSegmentLength = ropeLength / (ropeSegments - 1);
  const modelSegmentLength = ropeSegments / 9;
  const allModels = useRef(new Map());

  // Load rope texture using drei's useTexture
  const ropeTexture = useTexture("src/textures/white_string.jpg");
  useEffect(() => {
    ropeTexture.wrapS = THREE.RepeatWrapping;
    ropeTexture.wrapT = THREE.RepeatWrapping;
    ropeTexture.repeat.set(1, 1);
  }, [ropeTexture]);

  // Initialize physics
  useEffect(() => {
    if (!physicsWorld) return;

    // Create soft body
    const softBodyHelpers = new Ammo.btSoftBodyHelpers();
    const ropeStart = new Ammo.btVector3(-8, yOffset, 0);
    const ropeEnd = new Ammo.btVector3(8, yOffset, 0);

    const newSoftBody = softBodyHelpers.CreateRope(
      physicsWorld.getWorldInfo(),
      ropeStart,
      ropeEnd,
      ropeSegments - 1,
      0
    );

    const sbConfig = newSoftBody.get_m_cfg();
    sbConfig.set_viterations(20); // Velocity iterations
    sbConfig.set_piterations(20); // Position iterations
    sbConfig.set_kDP(0.001); // Damping coefficient
    sbConfig.set_kLF(0.001); // Resistance to movement

    // Fix end points
    const nodes = newSoftBody.get_m_nodes();
    const firstNode = nodes.at(0);
    const lastNode = nodes.at(nodes.size() - 1);
    firstNode.set_m_im(0);
    lastNode.set_m_im(0);

    physicsWorld.addSoftBody(newSoftBody, 1, -1);
    newSoftBody.setTotalMass(0.01, false);

    setSoftBody(newSoftBody);
    if (onRopeReady) {
      onRopeReady({
        softBody: newSoftBody,
        setNodePosition,
        attachModel,
      });
    }

    // Cleanup
    return () => {
      if (physicsWorld && newSoftBody) {
        physicsWorld.removeSoftBody(newSoftBody);
      }
    };
  }, [physicsWorld, yOffset, ropeSegments]);

  // Update rope visuals
  useFrame(() => {
    if (!softBody || !ropeMeshRef.current) return;

    const nodes = softBody.get_m_nodes();

    // Update models
    allModels.current.forEach((model, nodeIndex) => {
      const node = nodes.at(nodeIndex);
      const pos = node.get_m_x();
      model.updatePosition(new THREE.Vector3(pos.x(), pos.y(), pos.z()));
    });

    // Update rope segments
    for (let i = 0; i < nodes.size() - 1; i++) {
      const node = nodes.at(i);
      const nextNode = nodes.at(i + 1);
      const pos = node.get_m_x();
      const nextPos = nextNode.get_m_x();

      const position = new THREE.Vector3(pos.x(), pos.y(), pos.z());
      const direction = new THREE.Vector3(
        nextPos.x() - pos.x(),
        nextPos.y() - pos.y(),
        nextPos.z() - pos.z()
      );

      const currentLength = direction.length();
      const quaternion = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      quaternion.setFromUnitVectors(up, direction.normalize());

      const scale = new THREE.Vector3(
        1,
        currentLength / initialSegmentLength,
        1
      );

      const matrix = new THREE.Matrix4();
      matrix.compose(position, quaternion, scale);
      ropeMeshRef.current.setMatrixAt(i, matrix);
    }

    ropeMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  const setNodePosition = useCallback(
    (index, position) => {
      if (!softBody) return;

      const nodes = softBody.get_m_nodes();
      const node = nodes.at(index);
      const pos = new Ammo.btVector3(position.x, position.y, position.z);
      node.set_m_x(pos);
      node.set_m_v(new Ammo.btVector3(0, 0, 0));
    },
    [softBody]
  );

  const attachModel = useCallback((model, nodeIndex) => {
    allModels.current.set(nodeIndex, model);
  }, []);

  useEffect(() => {
    const handleWind = (event) => {
      const windForce = event.detail;
      
      // Apply wind force to each node of the soft body
      const numNodes = softBody.get_m_nodes().size();
      for (let i = 0; i < numNodes; i++) {
        const node = softBody.get_m_nodes().at(i);
        const force = new Ammo.btVector3(
          windForce.x,
          windForce.y,
          windForce.z
        );
        node.m_f.setX(node.m_f.x() + force.x());
        node.m_f.setY(node.m_f.y() + force.y());
        node.m_f.setZ(node.m_f.z() + force.z());
        
        // Clean up the temporary btVector3
        Ammo.destroy(force);
      }
    };

    window.addEventListener('wind-update', handleWind);
    
    return () => {
      window.removeEventListener('wind-update', handleWind);
    };
  }, [softBody]);

  // Create instanced mesh for rope segments
  return (
    <instancedMesh ref={ropeMeshRef} args={[null, null, ropeSegments - 1]}>
      <cylinderGeometry args={[0.02, 0.02, initialSegmentLength, 8]}>
        <cylinderGeometry
          attach="translate"
          args={[0, initialSegmentLength / 2, 0]}
        />
      </cylinderGeometry>
      <meshPhongMaterial
        map={ropeTexture}
        bumpMap={ropeTexture}
        bumpScale={0.1}
        color="#ffffff"
      />
    </instancedMesh>
  );
}
