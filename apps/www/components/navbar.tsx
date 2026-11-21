"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import "@/app/(marketing)/home.css";
import { usePageTransition } from "@/components/page-transition/page-transition-provider";
import Link from "@/components/site-link";
import { useButton3DHover } from "@/hooks/use-button-3d-hover";
import { NAV_EXPLORE, NAV_FLOWS, NAV_SOCIALS } from "@/lib/navigation";

import { SocialIcon } from "./social-icons";
import { UnderNavMarquee } from "./under-nav-marquee";

export interface NavbarProps {
  isMenuOpen?: boolean;
  isScrollingStarted?: boolean;
  onCloseMenu?: () => void;
  onToggleMenu?: () => void;
  scrollingDirection?: "up" | "down";
}

export function Navbar({
  isMenuOpen: isMenuOpenProp,
  onToggleMenu: onToggleMenuProp,
  onCloseMenu: onCloseMenuProp,
  isScrollingStarted: isScrollingStartedProp,
  scrollingDirection: scrollingDirectionProp,
}: NavbarProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useButton3DHover(containerRef);

  const pathname = usePathname();
  const { transitionTo } = usePageTransition();

  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const [internalScrollingStarted, setInternalScrollingStarted] =
    useState(false);
  const [internalScrollingDirection, setInternalScrollingDirection] = useState<
    "up" | "down"
  >("up");

  const isMenuOpen = isMenuOpenProp ?? internalMenuOpen;
  const isScrollingStarted = isScrollingStartedProp ?? internalScrollingStarted;
  const scrollingDirection =
    scrollingDirectionProp ?? internalScrollingDirection;

  const handleToggleMenu = useCallback(() => {
    if (onToggleMenuProp) {
      onToggleMenuProp();
    } else {
      setInternalMenuOpen((prev) => !prev);
    }
  }, [onToggleMenuProp]);

  const handleCloseMenu = useCallback(() => {
    if (onCloseMenuProp) {
      onCloseMenuProp();
    } else {
      setInternalMenuOpen(false);
    }
  }, [onCloseMenuProp]);

  const handleDocsPillClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      handleCloseMenu();
      return;
    }
    e.preventDefault();
    handleCloseMenu();
    transitionTo("/docs");
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      href.startsWith("http")
    ) {
      handleCloseMenu();
      return;
    }

    if (pathname === href) {
      handleCloseMenu();
      return;
    }

    e.preventDefault();
    handleCloseMenu();
    transitionTo(href);
  };

  // Reset navbar state on route navigation
  useEffect(() => {
    if (!pathname) {
      return;
    }
    setInternalMenuOpen(false);
    setInternalScrollingStarted(false);
    setInternalScrollingDirection("up");
    onCloseMenuProp?.();
  }, [pathname, onCloseMenuProp]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        handleCloseMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseMenu]);

  // Self-contained scroll monitoring when uncontrolled
  useEffect(() => {
    if (
      isScrollingStartedProp !== undefined &&
      scrollingDirectionProp !== undefined
    ) {
      return;
    }

    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setInternalScrollingStarted(currentScrollY > 30);

      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setInternalScrollingDirection("down");
      } else if (currentScrollY < lastScrollY) {
        setInternalScrollingDirection("up");
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isScrollingStartedProp, scrollingDirectionProp]);

  // Lock scroll when menu is open in uncontrolled mode
  useEffect(() => {
    if (isMenuOpenProp !== undefined || !internalMenuOpen) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [internalMenuOpen, isMenuOpenProp]);

  return (
    <div className="home-layout site-navbar-root w-full" ref={containerRef}>
      <div
        className="nav"
        data-marketing-theme="dark"
        data-nav-status={isMenuOpen ? "active" : "not-active"}
        data-nav-theme="light"
        data-scrolling-direction={scrollingDirection}
        data-scrolling-started={isScrollingStarted ? "true" : "false"}
        style={{
          opacity: 1,
          visibility: "visible",
        }}
      >
        {/* Background backdrop for menu drawer */}
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions -- Backdrop click closes menu */}
        <div
          className="nav__bg"
          data-nav-toggle="close"
          onClick={handleCloseMenu}
        />

        <div className="nav-bar__wrap">
          <div className="nav-bar__width">
            <div className="nav-bar">
              <div className="nav-bar__back">
                <div className="nav-bar__outline" />
                <div className="nav-bar__bg" />
              </div>

              {/* Top Bar */}
              <div className="nav-bar__top" data-nav-bar-height="">
                {/* Menu Hamburger Button */}
                <div className="nav-bar__menu">
                  {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions -- Interactive menu toggle */}
                  <div
                    className="nav-menu"
                    data-nav-toggle="toggle"
                    onClick={handleToggleMenu}
                  >
                    <div className="nav-menu__hamburger">
                      <div className="nav-menu__hamburger-bar" />
                      <div className="nav-menu__hamburger-bar" />
                    </div>
                    <span className="nav-menu__label relative inline-flex items-center">
                      <AnimatePresence initial={false} mode="wait">
                        <motion.span
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          initial={{ opacity: 0 }}
                          key={isMenuOpen ? "close" : "menu"}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                          {isMenuOpen ? "Close" : "Menu"}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </div>
                </div>

                {/* Logo (Wordmark <-> Icon Morph) */}
                <div className="nav-bar__logo">
                  <Link
                    aria-current="page"
                    aria-label="go to homepage"
                    className="nav-logo w--current w-inline-block"
                    href="/"
                    onClick={(e) => handleLinkClick(e, "/")}
                  >
                    {/* Wordmark set like the "Menu" label beside it. */}
                    <span className="nav-logo__wordmark-svg nav-logo__wordmark">
                      UI Playground
                    </span>
                    <Image
                      alt=""
                      className="nav-logo__icon-svg aspect-square rounded-[0.3em] object-cover"
                      height={128}
                      src="/brand/avatar-128.jpg"
                      width={128}
                    />
                  </Link>
                </div>

                {/* Action Buttons: 1st button 1.5rem (Flows) + 2nd button .875rem (Docs) */}
                <div className="nav-bar__buttons">
                  <div className="nav-bar__login-button">
                    <Link
                      className="button w-inline-block rounded-[1.5rem]! dark:text-white!"
                      data-button-rotate=""
                      data-button-rotate-hover=""
                      data-responsive=""
                      data-shape="round"
                      data-size=""
                      data-theme=""
                      href="/flows"
                      onClick={(e) => handleLinkClick(e, "/flows")}
                      style={{ borderRadius: "1.5rem" }}
                    >
                      <div
                        className="button-bg rounded-[1.5rem]! dark:bg-[color-mix(in_srgb,#201d1d_65%,#ffffff)]!"
                        data-wf--button-theme--variant="neutral-525"
                        style={{ borderRadius: "1.5rem" }}
                      />
                      <div className="button-label__wrap">
                        <div className="button-label dark:text-white!">
                          <span>Flows</span>
                        </div>
                        <div
                          aria-hidden="true"
                          className="button-label dark:text-white!"
                        >
                          <span>Flows</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                  <div className="nav-bar__signup-button">
                    <Link
                      className="button w-inline-block rounded-[.875rem]!"
                      data-button-rotate=""
                      data-button-rotate-hover=""
                      data-outseta-type="join"
                      data-responsive=""
                      data-shape=""
                      data-size=""
                      data-theme=""
                      href="/docs"
                      onClick={handleDocsPillClick}
                      style={{ borderRadius: ".875rem" }}
                    >
                      <div
                        className="button-bg rounded-[.875rem]!"
                        data-wf--button-theme--variant="electric"
                        style={{ borderRadius: ".875rem" }}
                      />
                      <div className="button-label__wrap">
                        <div className="button-label text-white">
                          <span>Docs</span>
                        </div>
                        <div
                          aria-hidden="true"
                          className="button-label text-white"
                        >
                          <span>Docs</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="nav-bar__line" />
              </div>

              {/* Bottom Drawer Content */}
              <div className="nav-bar__bottom">
                <div className="nav-bar__bottom-overflow">
                  <div className="nav-bar__bottom-inner" data-lenis-prevent="">
                    <div className="nav-bar__bottom-row">
                      {/* Flows Column */}
                      <div className="is--products nav-bar__bottom-col">
                        <div className="nav-bar__tag-row">
                          <span className="eyebrow">Flows</span>
                        </div>
                        <ul className="nav-bar__ul-big">
                          {NAV_FLOWS.map((item, index) => (
                            <li className="nav-bar__big-li" key={item.label}>
                              <Link
                                className="nav-bar__big-a w-inline-block"
                                data-hover=""
                                href={item.href}
                                onClick={(e) => handleLinkClick(e, item.href)}
                              >
                                <span
                                  className="nav-bar__big-span"
                                  data-underline-link=""
                                >
                                  {item.label}
                                </span>
                              </Link>
                              {index < NAV_FLOWS.length - 1 && (
                                <div className="is--nav-transparent line" />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Explore Column */}
                      <div className="nav-bar__bottom-col">
                        <div className="is--membership nav-bar__tag-row">
                          <span className="eyebrow">Explore</span>
                        </div>
                        <ul className="nav-bar__ul-big">
                          {NAV_EXPLORE.map((item, index) => (
                            <li className="nav-bar__big-li" key={item.label}>
                              <Link
                                className="nav-bar__big-a w-inline-block"
                                data-hover=""
                                href={item.href}
                                onClick={(e) => handleLinkClick(e, item.href)}
                              >
                                <span
                                  className="nav-bar__big-span"
                                  data-underline-link=""
                                >
                                  {item.label}
                                </span>
                              </Link>
                              {index < NAV_EXPLORE.length - 1 && (
                                <div className="is--nav-transparent line" />
                              )}
                            </li>
                          ))}
                        </ul>

                        {/* Socials */}
                        <div className="nav-bar__socials">
                          <div className="button-row">
                            {NAV_SOCIALS.map((social) => (
                              <a
                                aria-label={social.label}
                                className="square-button"
                                data-button-rotate-hover=""
                                data-shape={social.shape}
                                data-size="r"
                                data-theme=""
                                href={social.href}
                                key={social.label}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                <div
                                  className="button-bg"
                                  data-wf--button-theme--variant="neutral-600"
                                />
                                <div className="button-icon__wrap">
                                  <div className="button-icon">
                                    <SocialIcon type={social.type} />
                                  </div>
                                  <div className="button-icon">
                                    <SocialIcon type={social.type} />
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Featured Pro Ad / Promotion Column (Temporarily commented out) */}
                      {/* <div className="is--ad nav-bar__bottom-col">
                        <Link
                          className="nav-banner w-inline-block"
                          data-hover=""
                          href="/ui"
                          onClick={(e) => handleLinkClick(e, "/ui")}
                        >
                          <div className="nav-banner__before" />
                          <div className="nav-banner__content">
                            <div className="nav-banner__tags">
                              <div className="tag" data-shape="" data-theme="">
                                <div
                                  className="button-bg"
                                  data-wf--button-theme--variant="neutral-800"
                                />
                                <span className="is--relative eyebrow">
                                  Animated
                                </span>
                              </div>
                              <div
                                className="tag"
                                data-shape="round"
                                data-theme=""
                              >
                                <div
                                  className="button-bg"
                                  data-wf--button-theme--variant="purple"
                                />
                                <span className="is--relative eyebrow text-white">
                                  React UI
                                </span>
                              </div>
                            </div>
                            <div className="nav-banner__center-content">
                              <div className="nav-banner__title">
                                <h2 className="h-m">Enterprise UI Playground</h2>
                              </div>
                              <div className="nav-banner__btn">
                                <button
                                  className="button"
                                  data-button-rotate=""
                                  data-button-rotate-hover=""
                                  data-responsive=""
                                  data-shape=""
                                  data-size=""
                                  data-theme=""
                                  type="button"
                                >
                                  <div
                                    className="button-bg"
                                    data-wf--button-theme--variant="neutral-200"
                                  />
                                  <div className="button-label__wrap">
                                    <div className="button-label">
                                      <span>Explore Components</span>
                                    </div>
                                    <div
                                      aria-hidden="true"
                                      className="button-label"
                                    >
                                      <span>Explore Components</span>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <UnderNavMarquee
        isMenuOpen={isMenuOpen}
        isScrollingStarted={isScrollingStarted}
      />
    </div>
  );
}
