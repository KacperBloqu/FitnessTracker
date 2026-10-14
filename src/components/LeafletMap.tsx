import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TrackPoint } from '../types/activity';

interface LeafletMapProps {
  trackPoints: TrackPoint[];
  hoveredPointIndex?: number | null;
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  trackPoints,
  hoveredPointIndex,
  className = 'h-80 w-full rounded-2xl overflow-hidden',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const hoverMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // CartoDB Dark Matter tile layer - sleek, dark, free, no API key needed
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Filter points with valid coordinates
    const validCoords = trackPoints
      .filter((p) => p.lat && p.lon && !isNaN(p.lat) && !isNaN(p.lon))
      .map((p) => [p.lat, p.lon] as [number, number]);

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (validCoords.length > 1) {
      // Neon cyan polyline with glow
      const polyline = L.polyline(validCoords, {
        color: '#00F0FF',
        weight: 4,
        opacity: 0.9,
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = polyline;

      // Start marker (emerald green)
      const startCoord = validCoords[0];
      L.circleMarker(startCoord, {
        radius: 6,
        fillColor: '#00E676',
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).bindTooltip('Start', { permanent: false, direction: 'top' }).addTo(map);

      // Finish marker (crimson red)
      const endCoord = validCoords[validCoords.length - 1];
      L.circleMarker(endCoord, {
        radius: 6,
        fillColor: '#FF2D55',
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).bindTooltip('Finish', { permanent: false, direction: 'top' }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [35, 35] });
    } else if (validCoords.length === 1) {
      map.setView(validCoords[0], 14);
    } else {
      map.setView([37.7749, -122.4194], 12);
    }

    // Invalidate size after layout renders
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [trackPoints]);

  // Synchronize hover marker from elevation/HR chart
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (hoveredPointIndex !== null && hoveredPointIndex !== undefined && trackPoints[hoveredPointIndex]) {
      const pt = trackPoints[hoveredPointIndex];
      if (pt.lat && pt.lon) {
        if (!hoverMarkerRef.current) {
          hoverMarkerRef.current = L.circleMarker([pt.lat, pt.lon], {
            radius: 8,
            fillColor: '#FFB800',
            color: '#FFFFFF',
            weight: 3,
            opacity: 1,
            fillOpacity: 1,
          }).addTo(map);
        } else {
          hoverMarkerRef.current.setLatLng([pt.lat, pt.lon]);
        }
      }
    } else if (hoverMarkerRef.current) {
      hoverMarkerRef.current.remove();
      hoverMarkerRef.current = null;
    }
  }, [hoveredPointIndex, trackPoints]);

  return (
    <div className={`relative ${className} border border-dark-border shadow-2xl`}>
      <div ref={mapContainerRef} className="h-full w-full" />
      <div className="absolute bottom-2 left-2 z-[400] bg-dark-card/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-slate-400 border border-dark-border">
        OpenStreetMap & CartoDB
      </div>
    </div>
  );
};
