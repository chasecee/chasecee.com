
import Footer from './Footer';
import Header from './Header';


export default function Container({ children }: { children: React.ReactNode }) {

  return (
    <div className="root w-full min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-normal">
      <div className="container px-4 lg:px-0">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  )
}
