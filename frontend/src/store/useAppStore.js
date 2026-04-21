import { create } from "zustand";

const initialAnnotations = [
  { id: "a1", x: 80, y: 80, width: 120, height: 90, stroke: "#ff6b6b" },
];

export const useAppStore = create((set) => ({
  annotations: initialAnnotations,
  setAnnotations: (annotations) => set({ annotations }),
  addAnnotation: (annotation) =>
    set((state) => ({ annotations: [...state.annotations, annotation] })),
}));
