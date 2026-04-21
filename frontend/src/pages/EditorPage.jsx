import AnnotationCanvas from "../components/AnnotationCanvas";
import ModelCanvas from "../components/ModelCanvas";

export default function EditorPage() {
  return (
    <section className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
      <ModelCanvas />
      <AnnotationCanvas />
    </section>
  );
}
