import React from "react";
import Header from "./Header";
import CTASection from "./CTASection";
import Footer from "./Footer";
import type { ContainerProps } from "@/types/UI";

const Container: React.FC<ContainerProps> = ({
  children,
  className = "",
  showCTA = false,
}) => {
  return (
    <div className={`root min-h-screen w-full ${className} pt-24 lg:pt-32`}>
      <div className="container">
        <Header />
        <main>{children}</main>
        {showCTA && (
          <CTASection
            title="Let's build something spectacular."
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
};

export default Container;
