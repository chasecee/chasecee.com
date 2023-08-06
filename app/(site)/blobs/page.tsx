import Container from "@/app/(site)/components/Container";
import FireComponent from "../components/FireComponent";

export default function Blobs() {
  return (
    <div>
      <Container>
        <div className="prose mx-auto dark:prose-invert">
          <header>
            <h1>Database Blobs</h1>
          </header>
          <FireComponent />
        </div>
      </Container>
    </div>
  );
}
