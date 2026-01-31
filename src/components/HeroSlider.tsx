"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
// framer-motion is large; lazy-load it at runtime to keep initial client bundle small
// We import it dynamically inside the component.
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    id: 1,
    title: "EXPLORE THE FUTURE OF COMMERCE",
    subtitle: "New Galactic Arrival",
    description: "Discover cutting-edge technology and stellar deals designed for the next generation. Join the cosmic revolution today.",
    image: "https://images.unsplash.com/photo-1614728263952-84ea206f99b6?q=80&w=2000",
    link: "/products",
    buttonText: "Shop All Deals",
    accent: "orange",
  },
  {
    id: 2,
    title: "QUANTUM COMPUTING REVOLUTION",
    subtitle: "Limited Time Offer",
    description: "Experience power beyond imagination with our new line of quantum-ready workstations. Up to 30% off for early adopters.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000",
    link: "/products?category=electronics",
    buttonText: "Upgrade Now",
    accent: "blue",
  },
  {
    id: 3,
    title: "STAY CONNECTED ACROSS ORBITS",
    subtitle: "Global Network",
    description: "Our high-speed satellite communicators keep you synced no matter where your journey takes you in the solar system.",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2000",
    link: "/products",
    buttonText: "View Comms Gear",
    accent: "orange",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [motionModule, setMotionModule] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    import("framer-motion").then((mod) => {
      if (mounted) setMotionModule(mod);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // If framer-motion hasn't loaded yet, render a non-animated fallback to avoid blocking.
  if (!motionModule) {
    return (
      <section className="relative h-[600px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={slides[current].image}
            alt={slides[current].title}
            fill
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cosmic-black via-cosmic-black/60 to-transparent" />

          <div className="container relative mx-auto flex h-full flex-col justify-center px-4">
            <div className="max-w-2xl">
              <div style={{ opacity: 1 }} className="mb-4">
                <Badge className="mb-4 bg-cosmic-orange/20 text-cosmic-orange border-cosmic-orange/30 hover:bg-cosmic-orange/30">
                  {slides[current].subtitle}
                </Badge>
              </div>

              <h1 className="mb-6 text-5xl font-extrabold tracking-tighter text-white sm:text-7xl">
                {slides[current].title}
              </h1>

              <p className="mb-8 text-lg text-white/70 sm:text-xl">{slides[current].description}</p>

              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-cosmic-orange text-black hover:bg-cosmic-orange/90 orange-glow">
                  <Link href={slides[current].link}>{slides[current].buttonText}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                  <Link href="/products?category=electronics">Explore Tech</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { motion: M, AnimatePresence: AP } = motionModule;

  return (
    <section className="relative h-[600px] w-full overflow-hidden">
      <AP mode="wait">
        <M.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <Image
            src={slides[current].image}
            alt={slides[current].title}
            fill
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cosmic-black via-cosmic-black/60 to-transparent" />

          <div className="container relative mx-auto flex h-full flex-col justify-center px-4">
            <div className="max-w-2xl">
              <M.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="mb-4 bg-cosmic-orange/20 text-cosmic-orange border-cosmic-orange/30 hover:bg-cosmic-orange/30">
                  {slides[current].subtitle}
                </Badge>
              </M.div>

              <M.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-5xl font-extrabold tracking-tighter text-white sm:text-7xl"
              >
                {slides[current].title.split(" ").map((word, i) => (
                  <span key={i} className={word === "FUTURE" || word === "REVOLUTION" || word === "CONNECTED" ? "text-cosmic-orange orange-text-glow mr-2" : "mr-2"}>
                    {word}
                  </span>
                ))}
              </M.h1>

              <M.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8 text-lg text-white/70 sm:text-xl"
              >
                {slides[current].description}
              </M.p>

              <M.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                <Button asChild size="lg" className="bg-cosmic-orange text-black hover:bg-cosmic-orange/90 orange-glow">
                  <Link href={slides[current].link}>{slides[current].buttonText}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                  <Link href="/products?category=electronics">Explore Tech</Link>
                </Button>
              </M.div>
            </div>
          </div>
        </M.div>
      </AP>

      {/* Controls */}
      <div className="absolute bottom-8 right-8 flex gap-2">
        <Button
          onClick={prevSlide}
          size="icon"
          variant="outline"
          className="rounded-full border-white/10 bg-black/20 text-white hover:bg-cosmic-orange hover:text-black transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          onClick={nextSlide}
          size="icon"
          variant="outline"
          className="rounded-full border-white/10 bg-black/20 text-white hover:bg-cosmic-orange hover:text-black transition-all"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              current === i ? "w-8 bg-cosmic-orange" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)}>
      {children}
    </span>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
