import Footer from "./Footer";
import Header from "./Header";
import CTA from "./CTA";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  showCTA?: boolean;
};

export default function Container({
  children,
  className,
  showCTA,
}: ContainerProps) {
  return (
    <div className={`root min-h-screen w-full ${className} px-0 md:mt-0`}>
      <div className="relative z-0 container">
        <Header />
        <main>{children}</main>
        {showCTA && (
          <CTA
            title="Let's get started"
            subtitle="I build powerful and beautiful applications for businesses of all sizes. I'm available for work, let's get started!"
            primaryLink="/contact"
            secondaryLink="/about"
            outerClass=""
          />
        )}
        <Footer />
      </div>
    </div>
  );
}
