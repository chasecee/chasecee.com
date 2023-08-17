import Footer from "./Footer";
import Header from "./Header";

export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="root min-h-screen w-full bg-white font-normal text-neutral-900 dark:bg-neutral-900 dark:text-white">
      <div className="container mt-24 overflow-hidden px-8">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
