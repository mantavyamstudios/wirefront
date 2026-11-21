import { Bunny } from "@/components/docs/bunny";

export const InfoSection = () => (
  <section className="info" data-theme-section="light">
    <div className="is--md-m container">
      <div className="info__wrap">
        <div className="info__small-col">
          <div className="info__graphic">
            <Bunny size={80} sleeping={false} />
          </div>
        </div>
        <div className="info__large-col">
          <div className="info__scribble">
            <p className="scribble">Why Wirefront?</p>
            <svg
              aria-hidden="true"
              className="scribble-arrow is--info-col"
              fill="none"
              viewBox="0 0 32 32"
              width="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Arrow</title>
              <path
                d="M30.3491 31.5811L30.558 30.3311L31.1618 29.9525C29.2036 30.1222 28.2898 27.0739 26.4295 26.369C25.8681 26.1568 25.7735 26.8128 25.9497 27.0119C25.9921 27.0609 26.6775 27.2502 27.0985 27.6516C27.4575 27.9975 29.1938 29.5543 28.8805 29.9492C23.8153 29.4434 19.1711 28.2358 14.7619 25.6477C5.77699 20.3802 0.852119 10.8502 0.0231477 0.612125C-0.616531 15.7327 12.0922 28.8428 26.9223 30.2821C26.5796 31.1372 23.8022 30.2234 23.9882 31.5811H30.3459H30.3491Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="info__title">
            <h3 className="is--long h-ml">
              Skip building screens from scratch. Install one as source you own,
              wire it to your backend and ship it.
            </h3>
          </div>
          <ul className="info__list">
            <li className="info__li">
              <div className="info__li-title">
                <h4 className="u--fw-medium p-l">Adaptive</h4>
              </div>
              <p className="p-m">
                Screens fit your stack, not ours. One provider hands them your
                router, toasts, locale, currency, copy and permissions, and they
                follow your theme tokens in light or dark, left to right or
                right to left.
              </p>
            </li>
            <li className="info__li">
              <div className="info__li-title">
                <h4 className="u--fw-medium p-l">Dynamic</h4>
              </div>
              <p className="p-m">
                Data in, events out. Every screen takes its data as props and
                hands each action to you as a promise, with zod schemas and an
                API contract for your backend to meet.
              </p>
            </li>
            <li className="info__li">
              <div className="info__li-title">
                <h4 className="u--fw-medium p-l">Responsive</h4>
              </div>
              <p className="p-m">
                From phone to wide desktop. Each screen is audited at 375, 768,
                1024 and 1440 pixels wide, with accessibility, tap targets and
                keyboard paths checked before it ships.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);
