import React from "react";
import Header from "./Header";
import CTASection from "./CTASection";
import Footer from "./Footer";

interface ContainerHomeProps {
  children: React.ReactNode;
  className?: string;
  showCTA?: boolean;
}

const ContainerHome: React.FC<ContainerHomeProps> = ({
  children,
  className = "",
  showCTA = false,
}) => {
  return (
    <div className={`root min-h-screen w-full ${className} px-0 md:mt-0`}>
      <div className="relative z-0 container">
        <Header />
        <main>{children}</main>
        {showCTA && (
          <CTASection
            title="Let's get started"
            subtitle="I build powerful and beautiful applications for businesses of all sizes. I'm available for work, reach out!"
            primaryLink="/contact"
            secondaryLink="/about"
            outerClass=""
          />
        )}
        <Footer />
      </div>
    </div>
  );
};

export default ContainerHome;
