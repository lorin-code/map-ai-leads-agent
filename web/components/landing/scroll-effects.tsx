"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = ".reveal";

export function ScrollEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    const workflowDemoCards = Array.from(document.querySelectorAll<HTMLElement>(".index-landing .workflow-demo-card"));
    const indexMockup = document.querySelector<HTMLElement>(".index-landing .mockup-3d");

    revealTargets.forEach((target, index) => {
      target.classList.add("scroll-observed");
      target.style.setProperty("--scroll-delay", `${Math.min(index % 5, 4) * 54}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      {
        rootMargin: "0px 0px -14% 0px",
        threshold: 0.16,
      },
    );

    revealTargets.forEach((target) => observer.observe(target));

    let frame = 0;

    const updateScrollMotion = () => {
      frame = 0;
      const viewportCenter = window.innerHeight * 0.52;
      const influence = window.innerHeight * 0.72;
      const heroProgress = Math.min(Math.max(window.scrollY / Math.max(window.innerHeight * 0.82, 1), 0), 1);

      if (indexMockup) {
        indexMockup.style.setProperty("--mockup-scroll-y", `${(heroProgress * -28).toFixed(1)}px`);
        indexMockup.style.setProperty("--mockup-scroll-rotate-x", `${(8 - heroProgress * 4.8).toFixed(2)}deg`);
        indexMockup.style.setProperty("--mockup-scroll-rotate-y", `${(-4 + heroProgress * 2.6).toFixed(2)}deg`);
        indexMockup.style.setProperty("--mockup-scroll-rotate-z", `${(2 - heroProgress * 1.4).toFixed(2)}deg`);
        indexMockup.style.setProperty("--mockup-scroll-scale", (0.95 + heroProgress * 0.035).toFixed(3));
        indexMockup.style.setProperty("--mockup-shadow-alpha", (0.15 - heroProgress * 0.04).toFixed(3));
      }

      workflowDemoCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height * 0.5;
        const distance = Math.abs(cardCenter - viewportCenter);
        const progress = Math.max(0, 1 - Math.min(distance / influence, 1));
        const stagger = index % 2 === 0 ? -1 : 1;

        card.style.setProperty("--workflow-card-y", `${((1 - progress) * 34).toFixed(1)}px`);
        card.style.setProperty("--workflow-card-x", `${((1 - progress) * stagger * 12).toFixed(1)}px`);
        card.style.setProperty("--workflow-card-scale", (0.97 + progress * 0.03).toFixed(3));
        card.style.setProperty("--workflow-card-opacity", (0.72 + progress * 0.28).toFixed(3));
        card.style.setProperty("--workflow-card-shadow-alpha", (0.06 + progress * 0.08).toFixed(3));
      });
    };

    const scheduleScrollMotion = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrollMotion);
    };

    updateScrollMotion();
    window.addEventListener("scroll", scheduleScrollMotion, { passive: true });
    window.addEventListener("resize", scheduleScrollMotion);

    return () => {
      observer.disconnect();
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", scheduleScrollMotion);
      window.removeEventListener("resize", scheduleScrollMotion);
    };
  }, []);

  return null;
}
