import manifest from "@/lib/flows/flows.manifest.json";

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
              Enterprise UI <span className="sr-only">Playground</span>
            </h1>
            <p aria-hidden className="h-xl">
              Playground
            </p>
          </div>
          <div className="home-hero__description-row">
            <p className="home-hero__description-p">
              {manifest.totals.subflows} real Flutter user flows, from sign-in
              to checkout, that you can tap through live, with the full Dart
              source of every screen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
