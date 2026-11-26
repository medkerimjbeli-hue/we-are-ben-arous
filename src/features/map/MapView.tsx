import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import type { Lang } from '../../types';
import { AVAILABLE_GOVERNORATES, BEN_AROUS, bbox, geoName, loadDelegations, loadGovernorates, type DelFC, type GovFC } from './geo';

export interface MapPin { id: string; lat: number; lng: number; label: string }

interface Props {
  mode: 'country' | 'region';
  lang: Lang;
  selectedDelegationId?: string | null;
  pins?: MapPin[];
  selectedPinId?: string | null;
  onGovernorate?: (id: string, name: string) => void;
  onDelegation?: (id: string) => void;
  onPin?: (id: string) => void;
  className?: string;
  interactiveZoom?: boolean;
}

const RED = '#F0002E';
const styles = {
  govAvailable: { color: RED, weight: 2, fillColor: RED, fillOpacity: 0.55 },
  govLocked: { color: '#3a3a3a', weight: 1, fillColor: '#1b1b1b', fillOpacity: 1, dashArray: '' },
  govLockedHover: { color: '#777', weight: 1.5, fillColor: '#262626', fillOpacity: 1 },
  govContext: { color: '#2a2a2a', weight: 1, fillColor: '#141414', fillOpacity: 1 },
  del: { color: '#ffffff', weight: 1.2, fillColor: '#2a0008', fillOpacity: 0.9 },
  delHover: { color: '#ffffff', weight: 2, fillColor: '#5c0012', fillOpacity: 0.95 },
  delSelected: { color: '#ffffff', weight: 3, fillColor: RED, fillOpacity: 0.75 },
  delDimmed: { color: '#555', weight: 1, fillColor: '#1a0005', fillOpacity: 0.7 },
} satisfies Record<string, L.PathOptions>;

/** Makes an SVG path keyboard-accessible (Tab + Enter/Space). */
function a11y(layer: L.Path, label: string, onActivate: () => void) {
  const el = (layer as unknown as { _path?: SVGPathElement })._path;
  if (!el) return;
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', label);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(); } });
  el.addEventListener('focus', () => layer.fire('mouseover'));
  el.addEventListener('blur', () => layer.fire('mouseout'));
}

export default function MapView(props: Props) {
  const { mode, lang, selectedDelegationId, pins = [], selectedPinId, className = '', interactiveZoom = true } = props;
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const shapes = useRef<L.LayerGroup | null>(null);
  const pinLayer = useRef<L.LayerGroup | null>(null);
  const delLayers = useRef(new Map<string, L.Path>());
  const cb = useRef(props);
  cb.current = props;
  const [data, setData] = useState<{ gov: GovFC; del: DelFC } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([loadGovernorates(), loadDelegations()])
      .then(([gov, del]) => alive && setData({ gov, del }))
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, []);

  // Create the map once.
  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, {
      zoomSnap: 0.25, minZoom: 5, maxZoom: 16, scrollWheelZoom: false, attributionControl: true, zoomControl: interactiveZoom,
      maxBounds: L.latLngBounds([29.5, 6.5], [38.5, 12.5]), maxBoundsViscosity: 0.8,
    });
    m.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>');
    m.attributionControl.addAttribution('Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · <a href="https://github.com/Alaa-Taieb/map-tunisia" target="_blank" rel="noopener noreferrer">Map Tunisia</a> (ODbL)');
    m.setView([34, 9.5], 6);
    shapes.current = L.layerGroup().addTo(m);
    pinLayer.current = L.layerGroup().addTo(m);
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(box.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; };
  }, [interactiveZoom]);

  // Draw boundaries for the current mode.
  useEffect(() => {
    const m = map.current, g = shapes.current;
    if (!m || !g || !data) return;
    g.clearLayers();
    delLayers.current.clear();
    if (mode === 'country') {
      const layer = L.geoJSON(data.gov, {
        style: (f) => (AVAILABLE_GOVERNORATES.has(f!.properties.id) ? styles.govAvailable : styles.govLocked),
        onEachFeature: (f, l) => {
          const p = f.properties, name = geoName(p, lang), avail = AVAILABLE_GOVERNORATES.has(p.id);
          const status = avail ? t('map.available') : t('map.comingSoon');
          const path = l as L.Path;
          path.bindTooltip(`<strong>${name}</strong><br/><span>${status}</span>`, { sticky: true, direction: 'top', className: 'wab-tip' });
          const activate = () => cb.current.onGovernorate?.(p.id, name);
          path.on({
            click: activate,
            mouseover: () => path.setStyle(avail ? { fillOpacity: 0.85 } : styles.govLockedHover),
            mouseout: () => path.setStyle(avail ? styles.govAvailable : styles.govLocked),
          });
          path.once('add', () => a11y(path, `${name} — ${status}`, activate));
        },
      }).addTo(g);
      // Visible text label for available governorates (status is not conveyed by colour alone).
      for (const f of data.gov.features.filter((x) => AVAILABLE_GOVERNORATES.has(x.properties.id))) {
        const [[s, w], [n]] = bbox(f.geometry);
        const label = `${geoName(f.properties, lang)} · ${t('map.available')}`;
        L.marker([(s + n) / 2, w], {
          interactive: false, keyboard: false,
          icon: L.divIcon({ className: 'wab-callout', html: `<span dir="auto">${label}</span>`, iconSize: [0, 0], iconAnchor: [0, 0] }),
        }).addTo(g);
      }
      layer.eachLayer((l) => { if (AVAILABLE_GOVERNORATES.has(((l as L.GeoJSON).feature as GeoJSON.Feature).properties!.id)) (l as L.Path).bringToFront(); });
      m.fitBounds(layer.getBounds(), { padding: [12, 12] });
    } else {
      L.geoJSON(data.gov, { style: (f) => (f!.properties.id === BEN_AROUS ? { ...styles.govContext, color: '#555' } : styles.govContext), interactive: false }).addTo(g);
      const layer = L.geoJSON(data.del, {
        style: () => styles.del,
        onEachFeature: (f, l) => {
          const p = f.properties, name = geoName(p, lang), path = l as L.Path;
          delLayers.current.set(p.id, path);
          path.bindTooltip(name, { permanent: true, direction: 'center', className: 'wab-label' });
          const activate = () => cb.current.onDelegation?.(p.id);
          path.on({
            click: activate,
            mouseover: () => { if (cb.current.selectedDelegationId !== p.id) path.setStyle(styles.delHover); },
            mouseout: () => restyle(),
          });
          path.once('add', () => a11y(path, name, activate));
        },
      }).addTo(g);
      if (!cb.current.selectedDelegationId) m.fitBounds(layer.getBounds(), { padding: [16, 16] });
    }
    restyle();
    focusSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, data, lang, t]);

  function restyle() {
    const sel = cb.current.selectedDelegationId;
    delLayers.current.forEach((path, id) => {
      path.setStyle(sel ? (id === sel ? styles.delSelected : styles.delDimmed) : styles.del);
      if (id === sel) path.bringToFront();
    });
  }
  function focusSelection() {
    const m = map.current;
    const sel = cb.current.selectedDelegationId;
    if (!m || cb.current.mode !== 'region' || !data) return;
    const f = sel ? data.del.features.find((x) => x.properties.id === sel) : null;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (f) m.flyToBounds(bbox(f.geometry), { padding: [30, 30], duration: reduce ? 0 : 0.8, maxZoom: 14 });
    else if (delLayers.current.size) m.flyToBounds(L.featureGroup([...delLayers.current.values()]).getBounds(), { padding: [16, 16], duration: reduce ? 0 : 0.8 });
  }

  useEffect(() => { restyle(); focusSelection(); }, [selectedDelegationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Discovery pins (verified coordinates only — filtered by the caller).
  const pinKey = pins.map((p) => `${p.id}:${p.lat}:${p.lng}`).join('|');
  useEffect(() => {
    const g = pinLayer.current;
    if (!g) return;
    g.clearLayers();
    for (const p of pins) {
      const icon = L.divIcon({ className: `wab-pin${p.id === selectedPinId ? ' is-selected' : ''}`, html: '<span></span>', iconSize: [36, 40], iconAnchor: [18, 38] });
      const mk = L.marker([p.lat, p.lng], { icon, title: p.label, alt: p.label, keyboard: true, riseOnHover: true });
      mk.on('click', () => cb.current.onPin?.(p.id));
      mk.on('add', () => { const el = mk.getElement(); if (el) { el.setAttribute('role', 'button'); el.setAttribute('aria-label', p.label); el.setAttribute('aria-pressed', String(p.id === selectedPinId)); } });
      mk.addTo(g);
    }
  }, [pinKey, selectedPinId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-line ${className}`}>
      <div ref={box} role="region" aria-label={mode === 'country' ? t('map.tunisiaLabel') : t('map.regionLabel')} className="h-full w-full" />
      {!data && !error && <div className="absolute inset-0 grid place-items-center bg-ink/70 text-muted" role="status">{t('common.loading')}</div>}
      {error && <div className="absolute inset-0 grid place-items-center bg-ink/90 p-6 text-center text-muted" role="alert">{t('map.loadError')}</div>}
    </div>
  );
}
