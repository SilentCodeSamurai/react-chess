import { useGLTF } from "@react-three/drei";
import type { PlayerSide } from "../../engineV2/types";
import React, { useImperativeHandle, useRef, forwardRef } from "react";
import type { PieceProps } from "./types";
import { animated, useSpring } from "@react-spring/three";

export type PawnHandle = {
  playMoveAnimation: (from: [number, number, number], to: [number, number, number], onRest?: () => void) => void;
};

export const Pawn = forwardRef<PawnHandle, PieceProps>(
  ({ color, position, onClick }, ref) => {
    const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
    const isWhite = color === "WHITE";
    const bodyNode = isWhite ? nodes.Pawn_Body_W1 : nodes.Pawn_Body_B1;
    const topNode = isWhite ? nodes.Pawn_Top_W1 : nodes.Pawn_Top_B1;
    const bodyMaterial = isWhite
      ? materials.Pawn_Body_White
      : materials.Pawn_Body_Black;
    const topMaterial = isWhite
      ? materials.Pawn_Top_White
      : materials.Pawn_Top_Black;

    const [springs, api] = useSpring(() => ({
      position,
      config: { mass: 0.1 },
    }));

    // Expose imperative animation method
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
      <animated.group
        position={springs.position.to((x, y, z) => [x, y, z])}
        onClick={onClick}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={bodyNode.geometry}
          material={bodyMaterial}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={topNode.geometry}
          material={topMaterial}
          position={[-0.031, -0.015, 0.031]}
        />
      </animated.group>
    );
  }
);
