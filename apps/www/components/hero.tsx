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
              A backend-agnostic catalogue of production-grade UI screens,
              organised by the experience they serve. Install any screen with
              the shadcn CLI, wire it to your backend and make it your own.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
