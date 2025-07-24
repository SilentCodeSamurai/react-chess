import { useGLTF } from "@react-three/drei";
import type { PlayerSide } from "../../engineV2/types";

export function usePawnMesh(color: PlayerSide) {
  const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
  const isWhite = color === "WHITE";
  return {
    body: {
      geometry: isWhite ? nodes.Pawn_Body_W1.geometry : nodes.Pawn_Body_B1.geometry,
      material: isWhite ? materials.Pawn_Body_White : materials.Pawn_Body_Black,
    },
    top: {
      geometry: isWhite ? nodes.Pawn_Top_W1.geometry : nodes.Pawn_Top_B1.geometry,
      material: isWhite ? materials.Pawn_Top_White : materials.Pawn_Top_Black,
      position: [-0.031, -0.015, 0.031],
    },
  };
} 