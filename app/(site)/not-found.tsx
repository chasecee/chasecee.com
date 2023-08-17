import Link from "next/link";
import Container from "./components/Container";

export default function NotFound() {
  return (
    <Container>
      <h2>Error: Not Found</h2>
      <pre>Could not find requested resource</pre>
      <Link href="/">Return Home</Link>
    </Container>
  );
}
