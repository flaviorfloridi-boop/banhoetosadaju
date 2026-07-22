import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
    __initTaxiMap?: () => void;
  }
}

export interface TaxiStop {
  id: string;
  label: string;
  address: string;
  horario: string;
}

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

let mapsLoader: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (mapsLoader) return mapsLoader;
  if (!BROWSER_KEY) return Promise.reject(new Error("Google Maps não configurado"));
  mapsLoader = new Promise<void>((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    window.__initTaxiMap = () => resolve();
    const s = document.createElement("script");
    const channel = TRACKING ? `&channel=${TRACKING}` : "";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__initTaxiMap${channel}`;
    s.async = true;
    s.onerror = () => reject(new Error("Falha ao carregar Google Maps"));
    document.head.appendChild(s);
  });
  return mapsLoader;
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    const g = window.google?.maps;
    if (!g) { resolve(null); return; }
    const geocoder = new g.Geocoder();
    geocoder.geocode({ address: address + ", Brasil" }, (results: any[], status: string) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else resolve(null);
    });
  });
}

export function TaxiMap({ stops }: { stops: TaxiStop[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps().then(async () => {
      if (cancelled || !ref.current) return;
      const g = window.google.maps;
      const map = new g.Map(ref.current, {
        center: { lat: -23.5505, lng: -46.6333 },
        zoom: 12,
      });
      mapRef.current = map;
      const bounds = new g.LatLngBounds();
      let count = 0;
      for (const s of stops) {
        const pos = await geocode(s.address);
        if (!pos) continue;
        new g.Marker({
          position: pos,
          map,
          label: { text: s.horario.slice(0, 5), className: "font-bold" },
          title: `${s.horario.slice(0,5)} — ${s.label} — ${s.address}`,
        });
        bounds.extend(pos);
        count++;
      }
      if (count > 0) {
        map.fitBounds(bounds);
        if (count === 1) map.setZoom(14);
      }
    }).catch((e) => setErr(e.message));
    return () => { cancelled = true; };
  }, [JSON.stringify(stops)]);

  if (err) {
    return <div className="bg-card border border-border rounded-2xl p-6 text-sm text-ink/60">{err}</div>;
  }
  return <div ref={ref} className="w-full h-[420px] rounded-2xl border border-border overflow-hidden" />;
}