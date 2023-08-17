import Link from "next/link";
import Container from "../components/Container";

export default function NotFound() {
  return (
    <Container>
      <div className="prose mx-auto my-20 dark:prose-invert">
        <h2 className="text-6xl">Error 404: Not Found</h2>
        <p className="text-xl">Could not find requested resource</p>
        <Link href="/" className="text-xl" title="Return to Homepage">
          Return Home
        </Link>
      </div>
    </Container>
  );
}
