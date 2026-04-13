"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import AppCard from "@/components/AppCard";

export default function Home() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const appsLabelRef = useRef<HTMLHeadingElement>(null);
  const resourcesLabelRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      titleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7 }
    )
      .fromTo(
        subtitleRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.3"
      )
      .fromTo(
        appsLabelRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4 },
        "-=0.2"
      )
      .fromTo(
        cardsRef.current!.children,
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.12 },
        "-=0.2"
      )
      .fromTo(
        resourcesLabelRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4 },
        "-=0.15"
      )
      .fromTo(
        resourcesRef.current!.children,
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.12 },
        "-=0.2"
      );
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1
          ref={titleRef}
          className="text-3xl font-bold text-foreground opacity-0"
        >
          WashU Medicine Test Applications
        </h1>
        <p
          ref={subtitleRef}
          className="mt-3 text-muted text-lg opacity-0"
        >
	    Test applications for patient safety and clinical productivity 
        </p>
      </div>

      <h2
        ref={appsLabelRef}
        className="text-sm font-semibold text-muted uppercase tracking-wider mb-4 opacity-0"
      >
        Apps
      </h2>
      <div
        ref={cardsRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
      >
        <AppCard
          title="VigilMD"
          description="Your AI safety net at the bedside. VigilMD surfaces overlooked insights from patient data — catching what's easy to miss so nothing falls through the cracks."
          href="/vigilmd"
          icon="&#x2695;&#xFE0F;"
        />
        <AppCard
          title="Note Converter"
          description="Instantly convert your last progress note into a ready-made discharge summary. Configure verbosity and provide your own examples to match your style."
          href="/note-converter"
          icon="&#x1F4DD;"
        />
      </div>

      <h2
        ref={resourcesLabelRef}
        className="text-sm font-semibold text-muted uppercase tracking-wider mb-4 opacity-0"
      >
        Resources
      </h2>
      <div
        ref={resourcesRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AppCard
          title="How It Works"
          description="Architecture overview, security model, and technical documentation for the platform."
          href="/how-it-works"
          icon="&#x1F4D6;"
        />
      </div>
    </main>
  );
}
