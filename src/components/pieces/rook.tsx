import { useGLTF } from "@react-three/drei";
import type { PlayerSide } from "../../engineV2/types";
import React, { useImperativeHandle, forwardRef } from "react";
import type { PieceProps } from "./types";
import { useSpring, animated } from "@react-spring/three";

export type RookHandle = {
  playMoveAnimation: (from: [number, number, number], to: [number, number, number], onRest?: () => void) => void;
};

export const Rook = forwardRef<RookHandle, PieceProps>(
  ({ color, position, onClick }, ref) => {
    const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
    const isWhite = color === "WHITE";
    const meshNode = isWhite ? nodes.Castle_W1 : nodes.Castle_B1;
    const meshMaterial = isWhite ? materials.Castle_White : materials.Castle_Black;

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
