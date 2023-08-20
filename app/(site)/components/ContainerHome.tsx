import Footer from "./Footer";
import Header from "./Header";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={`root min-h-screen w-full  font-normal ${className} mt-24 px-0 md:mt-0 `}
    >
      <Header />
      <div className="container overflow-hidden ">
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
