import Footer from "./Footer";
import Header from "./Header";
import CTA from "./CTA"; // Make sure to import the Example component

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
    <div
      className={`root min-h-screen w-full font-normal ${className} pt-24 lg:pt-32`}
    >
      <div className="container overflow-hidden">
        <Header />
        <main>{children}</main>
        {showCTA && (
          <CTA
            title="Boost your productivity. Start using our app today."
            subtitle="Incididunt sint fugiat pariatur cupidatat consectetur sit cillum anim id veniam aliqua proident excepteur commodo do ea."
            primaryLink="#"
            secondaryLink="#"
            outerClass="bg-gray-400"
          />
        )}
        <Footer />
      </div>
    </div>
  );
}
