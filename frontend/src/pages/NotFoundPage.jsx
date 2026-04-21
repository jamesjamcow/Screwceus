import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="hero">
      <h2>Page not found</h2>
      <p>This route does not exist.</p>
      <Link to="/">Go back home</Link>
    </section>
  );
}
