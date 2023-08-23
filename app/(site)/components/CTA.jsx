export default function Example({
  outerClass,
  title,
  subtitle,
  primaryLink,
  secondaryLink,
}) {
  return (
    <div
      className={`relative my-20 overflow-hidden rounded-xl bg-gradient-radial from-neutral-100 to-neutral-200 dark:from-neutral-700  dark:to-neutral-800 ${outerClass}`}
    >
      <div
        className="absolute inset-0 rounded-xl bg-fixed bg-repeat opacity-20"
        style={{
          backgroundImage: `url('/noise1.webp')`,
          backgroundSize: "200px",
        }}
      ></div>
      <div className="relative px-4 py-16">
        <div className="prose mx-auto text-center dark:prose-invert">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 opacity-90">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <a
              href={primaryLink}
              className="not-prose item-center group inline-flex flex-row gap-2 rounded-xl border-current bg-blue-800 p-4 px-6 text-white no-underline hover:bg-blue-700 hover:text-white active:translate-y-px dark:text-white"
            >
              Get started
            </a>
            <a href={secondaryLink} className="not-prose no-underline">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
