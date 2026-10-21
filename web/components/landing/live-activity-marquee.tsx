"use client";

import { useEffect, useMemo, useState } from "react";

type LiveActivityMarqueeProps = {
  fallbackItems: string[];
};

function MarqueeRow({ items }: { items: string[] }) {
  return (
    <div className="marquee-content">
      {items.map((item, index) => (
        <span className="flex items-center gap-2" key={`${item}-${index}`}>
          <span className={`live-dot ${index % 3 === 0 ? "green" : index % 3 === 1 ? "blue" : "purple"}`} />
          {item}
          <span className="mx-8 text-slate-300">|</span>
        </span>
      ))}
    </div>
  );
}

export function LiveActivityMarquee({ fallbackItems }: LiveActivityMarqueeProps) {
  const [activityItems, setActivityItems] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/public/activity", {
          cache: "no-store",
          headers: { "content-type": "application/json" },
        });
        if (!response.ok) {
          throw new Error("Activity request failed");
        }
        const payload = (await response.json()) as { items?: string[] };
        if (!cancelled) {
          setActivityItems(Array.isArray(payload.items) ? payload.items : []);
        }
      } catch {
        if (!cancelled) {
          setActivityItems([]);
        }
      }
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const items = useMemo(() => {
    const merged = [...activityItems, ...fallbackItems];
    return merged.slice(0, Math.max(6, Math.min(16, merged.length)));
  }, [activityItems, fallbackItems]);

  return (
    <section className="relative overflow-hidden border-b border-slate-200/50 bg-white/40 py-6 backdrop-blur-sm">
      <div className="absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#f8fafc] to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#f8fafc] to-transparent" />
      <div className="marquee font-mono text-sm font-medium text-slate-500">
        <MarqueeRow items={items} />
        <MarqueeRow items={items} />
      </div>
    </section>
  );
}
