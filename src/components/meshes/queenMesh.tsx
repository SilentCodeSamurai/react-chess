import { useGLTF } from "@react-three/drei";
import type { PlayerSide } from "@/engine/types";

export function useQueenMesh(color: PlayerSide) {
  const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
  const isWhite = color === "WHITE";
  return {
    body: {
      geometry: isWhite ? nodes.Queen_W.geometry : nodes.Queen_B.geometry,
      material: isWhite ? materials.Queen_White : materials.Queen_Black,
    },
    top: null,
  };
} 