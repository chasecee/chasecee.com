import Footer from "./Footer";
import Header from "./Header";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={`root min-h-screen w-full  font-normal ${className} pt-24 lg:pt-32`}
    >
      <div className="container overflow-hidden">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
