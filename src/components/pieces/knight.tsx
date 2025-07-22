import { useGLTF } from "@react-three/drei";
import type { PlayerSide } from "../../engineV2/types";
import React, { useImperativeHandle, forwardRef } from "react";
import type { PieceProps } from "./types";
import { useSpring, animated } from "@react-spring/three";

export type KnightHandle = {
  playMoveAnimation: (from: [number, number, number], to: [number, number, number], onRest?: () => void) => void;
};

export const Knight = forwardRef<KnightHandle, PieceProps>(
  ({ color, position, onClick }, ref) => {
    const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
    const isWhite = color === "WHITE";
    const meshNode = isWhite ? nodes.Knight_W1 : nodes.Knight_B1;
    const meshMaterial = isWhite ? materials.Knight_White : materials.Knight_Black;

    const [springs, api] = useSpring(() => ({
      position,
      config: { mass: 0.1 },
    }));

    useImperativeHandle(ref, () => ({
      playMoveAnimation: (from, to, onRest) => {
        api.start({
          from: { position: from },
          to: { position: to },
          onRest,
        });
      },
    }));

    return (
      <animated.mesh
        castShadow
        receiveShadow
        geometry={meshNode.geometry}
        material={meshMaterial}
        position={springs.position.to((x, y, z) => [x, y, z])}
        onClick={onClick}
      />
    );
  }
);
