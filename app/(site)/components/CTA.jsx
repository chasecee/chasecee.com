export default function Example({
  outerClass,
  title,
  subtitle,
  primaryLink,
  secondaryLink,
}) {
  return (
    <div
      className={`bg-lg my-20 rounded-xl bg-neutral-800 bg-blend-multiply ${outerClass}`}
      style={{
        backgroundImage: `url('/noise1.png')`, // Path to the noise image in the /public folder
        backgroundRepeat: "repeat",
        backgroundSize: "150px",
      }}
    >
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="prose mx-auto text-center dark:prose-invert">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 opacity-90">
            {subtitle}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href={primaryLink}
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get started
            </a>
            <a
              href={secondaryLink}
              className="text-sm font-semibold leading-6 text-white"
            >
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
