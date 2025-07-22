import Link from "next/link";
import Container from "../components/Container";
import CTASection from "../components/CTASection";

export default function SuccessPage() {
  return (
    <Container>
      <div className="prose dark:prose-invert mx-auto max-w-2xl">
        <h1>Thank You!</h1>
        <p>
          Your message has been sent successfully. I&apos;ll get back to you as
          soon as possible.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </Container>
  );
}
