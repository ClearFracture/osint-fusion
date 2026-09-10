import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import type { GeoJsonGeometry } from '../types/request';

interface GeofenceMapProps {
  value?: GeoJsonGeometry;
  onChange?: (geometry: GeoJsonGeometry | undefined) => void;
  readOnly?: boolean;
}

/** Map for drawing (editable) or displaying (read-only) a geofence polygon or rectangle. */
export function GeofenceMap({ value, onChange, readOnly = false }: GeofenceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      dragging: !readOnly,
      scrollWheelZoom: !readOnly,
      doubleClickZoom: !readOnly,
      boxZoom: !readOnly,
      keyboard: !readOnly,
    }).setView([38.9, -77.0], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    if (value) {
      const layer = L.geoJSON(value as GeoJSON.Geometry);
      layer.eachLayer((feature) => drawnItems.addLayer(feature));
      if (drawnItems.getLayers().length > 0) {
        map.fitBounds(drawnItems.getBounds(), { padding: [20, 20] });
      }
    }

    if (!readOnly && onChangeRef.current) {
      const drawControl = new (L.Control as unknown as { Draw: new (options: unknown) => L.Control }).Draw({
        edit: { featureGroup: drawnItems },
        draw: {
          polygon: true,
          rectangle: true,
          polyline: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (event: L.LeafletEvent) => {
        const created = event as L.DrawEvents.Created;
        drawnItems.clearLayers();
        drawnItems.addLayer(created.layer);
        const geojson = created.layer.toGeoJSON() as GeoJSON.Feature;
        onChangeRef.current?.(geojson.geometry as GeoJsonGeometry);
      });

      map.on(L.Draw.Event.EDITED, () => {
        const layers = drawnItems.getLayers();
        if (layers.length === 0) {
          onChangeRef.current?.(undefined);
          return;
        }
        const geojson = (layers[0] as L.Polygon).toGeoJSON() as GeoJSON.Feature;
        onChangeRef.current?.(geojson.geometry as GeoJsonGeometry);
      });

      map.on(L.Draw.Event.DELETED, () => {
        onChangeRef.current?.(undefined);
      });
    }

    return () => {
      map.remove();
    };
  }, [readOnly, readOnly ? value : undefined]);

  return (
    <div
      ref={containerRef}
      className={`h-72 w-full overflow-hidden rounded border border-tactical-border ${readOnly ? 'pointer-events-none opacity-95' : ''}`}
    />
  );
}
