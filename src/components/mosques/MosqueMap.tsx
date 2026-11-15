import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Mosque } from "../../data/mosques/api";
import type { Coordinates } from "../../utils/geo";
import { formatDistance } from "../../utils/geo";

type Props = {
  user: Coordinates;
  mosques: Mosque[];
  lang: "ar" | "en";
  selectedId: string | null;
  onSelect: (mosque: Mosque) => void;
};

const userIcon = L.divIcon({
  className: "sj-map-user-wrap",
  html: '<span class="sj-map-user-dot" aria-hidden="true"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function mosqueIcon(index: number) {
  return L.divIcon({
    className: "sj-map-mosque-wrap",
    html: `<span class="sj-map-mosque-pin" aria-hidden="true"><span>${index + 1}</span></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

/**
 * خريطة المساجد (Leaflet + OpenStreetMap) — تُحمَّل كسولة داخل صفحة المساجد فقط.
 * القائمة النصية هي الأساس، والخريطة خيار بصري مساعد.
 */
export default function MosqueMap({ user, mosques, lang, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [user.latitude, user.longitude],
      zoom: 14,
      scrollWheelZoom: false,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const timer = window.setTimeout(() => map.invalidateSize(), 120);
    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [user.latitude, user.longitude]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    L.marker([user.latitude, user.longitude], { icon: userIcon, title: lang === "ar" ? "موقعك" : "Your location" })
      .addTo(layer)
      .bindPopup(lang === "ar" ? "موقعك الحالي" : "Your current location");

    mosques.forEach((mosque, index) => {
      const marker = L.marker([mosque.latitude, mosque.longitude], {
        icon: mosqueIcon(index),
        title: mosque.name,
        riseOnHover: true,
      });
      marker.bindPopup(() => {
        const box = document.createElement("div");
        box.className = "sj-map-popup";

        const title = document.createElement("strong");
        title.textContent = mosque.name;
        box.appendChild(title);

        const meta = document.createElement("span");
        meta.textContent = `${formatDistance(mosque.distanceKm, lang)}${
          mosque.address ? ` — ${mosque.address}` : ""
        }`;
        box.appendChild(meta);

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = lang === "ar" ? "عرض التفاصيل" : "View details";
        button.addEventListener("click", () => onSelectRef.current(mosque));
        box.appendChild(button);

        return box;
      });
      marker.addTo(layer);
    });

    const points: L.LatLngExpression[] = [
      [user.latitude, user.longitude],
      ...mosques.map((mosque) => [mosque.latitude, mosque.longitude] as [number, number]),
    ];
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 16 });
    } else {
      map.setView([user.latitude, user.longitude], 14);
    }
  }, [user.latitude, user.longitude, mosques, lang]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const mosque = mosques.find((item) => item.id === selectedId);
    if (mosque) map.setView([mosque.latitude, mosque.longitude], Math.max(map.getZoom(), 16));
  }, [selectedId, mosques]);

  return (
    <div
      ref={containerRef}
      className="sj-mosque-map"
      role="region"
      aria-label={lang === "ar" ? "خريطة المساجد القريبة" : "Nearby mosques map"}
    />
  );
}
