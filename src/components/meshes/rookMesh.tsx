import { useGLTF } from "@react-three/drei";
import type { PlayerSide } from "@/engine/types";

export function useRookMesh(color: PlayerSide) {
  const { nodes, materials } = useGLTF("/assets/ABeautifulGame.gltf") as any;
  const isWhite = color === "WHITE";
  return {
    body: {
      geometry: isWhite ? nodes.Castle_W1.geometry : nodes.Castle_B1.geometry,
      material: isWhite ? materials.Castle_White : materials.Castle_Black,
    },
    top: null,
  };
} 