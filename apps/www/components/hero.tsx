import manifest from "@/lib/screens/screens.manifest.json";

export function Hero() {
  return (
    <section className="home-hero" data-theme-section="light">
      <div
        className="padding-hero"
        data-wf--padding-hero--variant="nav-large"
      />

      <div className="is--md-m container">
        <div className="home-hero__content">
          <div className="home-hero__title-row">
            <h1 className="h-xl">
              Wire<span className="sr-only">front</span>
            </h1>
            <p aria-hidden className="h-xl">
              front
            </p>
          </div>
          <div className="home-hero__description-row">
            <p className="home-hero__description-p">
              {manifest.totals.screens} responsive, ready-to-wire UI screens,
              from sign-in to checkout, that you can try live, then install
              with the shadcn CLI and wire to your own data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
