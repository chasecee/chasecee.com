import Footer from "./Footer";
import Header from "./Header";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Container({ children, className }: ContainerProps) {
  return (
    <div className={`root min-h-screen w-full  font-normal ${className}`}>
      <div className="container overflow-hidden px-8 pt-24">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
