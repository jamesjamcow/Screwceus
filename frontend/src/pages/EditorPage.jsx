import AnnotationCanvas from "../components/AnnotationCanvas";
import ModelCanvas from "../components/ModelCanvas";

export default function EditorPage() {
  return (
    <section className="grid-two">
      <ModelCanvas />
      <AnnotationCanvas />
    </section>
  );
}
