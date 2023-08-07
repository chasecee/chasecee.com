import Container from "@/app/(site)/components/Container";
import { Form } from "../components/Form";

export default function Contact() {
  return (
    <div>
      <Container>
        <div className="prose mx-auto max-w-[46ch] dark:prose-invert">
          <header>
            <h1>Contact</h1>
          </header>
          <Form />
        </div>
      </Container>
    </div>
  );
}
