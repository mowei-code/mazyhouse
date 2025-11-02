import React, { useEffect, useRef } from 'react';
import type { Property, Filters } from '../types';
import { applyFilters } from '../utils';
// FIX: Import mockProperties to be used as a fallback.
import { PRICE_RANGES, BEDROOM_OPTIONS, YEAR_BUILT_RANGES, PRICE_PER_SQM_RANGES, SIZE_RANGES, mockProperties } from '../constants';

// Let TypeScript know that 'L' is a global from the script tag in index.html
declare const L: any;

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

// A distinct icon for nearby (non-selected) properties
const nearbyIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapViewProps {
  property: Property | null;
  properties: Property[];
  filters: Filters;
  onSelectProperty: (property: Property) => void;
}

const generateFilterSummary = (currentFilters: Filters): string[] => {
    const summary: string[] = [];
    if (currentFilters.type !== 'all') summary.push(currentFilters.type);

    const priceLabel = PRICE_RANGES.find(r => r.value === currentFilters.price)?.label;
    if (priceLabel && currentFilters.price !== 'all') summary.push(priceLabel);

    const bedLabel = BEDROOM_OPTIONS.find(o => o.value === currentFilters.bedrooms)?.label;
    if (bedLabel && currentFilters.bedrooms !== 'all') summary.push(bedLabel);
    
    const yearLabel = YEAR_BUILT_RANGES.find(r => r.value === currentFilters.yearBuilt)?.label;
    if (yearLabel && currentFilters.yearBuilt !== 'all') summary.push(yearLabel);
    
    const ppsqmLabel = PRICE_PER_SQM_RANGES.find(r => r.value === currentFilters.pricePerSqm)?.label;
    if (ppsqmLabel && currentFilters.pricePerSqm !== 'all') summary.push(ppsqmLabel);

    const sizeLabel = SIZE_RANGES.find(r => r.value === currentFilters.size)?.label;
    if (sizeLabel && currentFilters.size !== 'all') summary.push(sizeLabel);

    return summary;
};

export const MapView: React.FC<MapViewProps> = ({ property, properties, filters, onSelectProperty }) => {
  const mapRef = useRef<any | null>(null);
  const mainMarkerRef = useRef<any | null>(null);
  const nearbyMarkersRef = useRef<any | null>(null);
  const filterControlRef = useRef<any | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize map and layer group only once
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([25.0330, 121.5654], 13); // Default to Taipei

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
      
      nearbyMarkersRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // --- Cleanup previous markers and controls ---
    if (mainMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(mainMarkerRef.current);
      mainMarkerRef.current = null;
    }
    if (nearbyMarkersRef.current) {
      nearbyMarkersRef.current.clearLayers();
    }
    if (filterControlRef.current && mapRef.current) {
      mapRef.current.removeControl(filterControlRef.current);
      filterControlRef.current = null;
    }

    // Update map view and all markers when property changes
    if (mapRef.current && property) {
      const { latitude, longitude, address, id } = property;
      
      // Fly to location only if it's different to avoid re-centering on filter change
      const currentCenter = mapRef.current.getCenter();
      if(Math.abs(currentCenter.lat - latitude) > 0.0001 || Math.abs(currentCenter.lng - longitude) > 0.0001) {
        mapRef.current.flyTo([latitude, longitude], 15);
      }

      // --- Create Main Marker for selected property ---
      mainMarkerRef.current = L.marker([latitude, longitude], { 
        icon: defaultIcon,
        draggable: true,
        zIndexOffset: 1000, // Keep the main marker on top
      }).addTo(mapRef.current);

      mainMarkerRef.current.on('dragend', async (event: any) => {
        const marker = event.target;
        const position = marker.getLatLng();

        const loadingProperty: Property = {
            ...(properties[0] || {}),
            id: `custom_${Date.now()}`,
            address: '正在查詢地址...',
            latitude: position.lat,
            longitude: position.lng,
            district: '自訂位置',
            price: 0,
        };
        onSelectProperty(loadingProperty);

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.lat}&lon=${position.lng}`);
          if (!response.ok) throw new Error('Reverse geocoding failed');
          const data = await response.json();
          
          const fetchedAddress = data.display_name || `緯度: ${position.lat.toFixed(5)}, 經度: ${position.lng.toFixed(5)}`;
          const baseProperty = properties.length > 0 ? properties[Math.floor(Math.random() * properties.length)] : mockProperties[0];
          
          const customProperty: Property = {
            ...baseProperty,
            id: `custom_${Date.now()}`,
            address: fetchedAddress,
            latitude: position.lat,
            longitude: position.lng,
            district: data.address?.city || data.address?.county || '自訂位置',
            price: 0,
          };
          
          onSelectProperty(customProperty);
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          const fallbackProperty: Property = {
            ...loadingProperty,
            address: `緯度: ${position.lat.toFixed(5)}, 經度: ${position.lng.toFixed(5)}`,
          };
          onSelectProperty(fallbackProperty);
        }
      });
      
      mainMarkerRef.current.bindPopup(`<b>${address}</b>`).openPopup();

      // --- Create Nearby Markers (Filtered) ---
      const filteredProperties = applyFilters(properties, filters);
      filteredProperties.forEach(otherProperty => {
        if (otherProperty.id !== id) {
          const marker = L.marker([otherProperty.latitude, otherProperty.longitude], {
            icon: nearbyIcon,
          });

          marker.bindPopup(`<b>${otherProperty.address}</b><br/>點擊以查看詳情`);

          marker.on('click', () => {
            onSelectProperty(otherProperty);
          });
          
          nearbyMarkersRef.current.addLayer(marker);
        }
      });

      // --- Create Filter Summary Control ---
      const activeFilters = generateFilterSummary(filters);
      if (activeFilters.length > 0) {
        const FilterControl = L.Control.extend({
          onAdd: function() {
            const div = L.DomUtil.create('div', 'leaflet-control-layers leaflet-control-layers-expanded p-2 bg-white/80 backdrop-blur-sm rounded-md shadow');
            L.DomEvent.disableClickPropagation(div); // Prevent map clicks when interacting with the control
            div.innerHTML = `<h3 class="text-xs font-bold mb-1 text-slate-600">目前篩選</h3><div class="flex flex-wrap gap-1" style="max-width: 200px;">${activeFilters.map(f => `<span class="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">${f}</span>`).join('')}</div>`;
            return div;
          },
          onRemove: function() {}
        });
        filterControlRef.current = new FilterControl({ position: 'bottomright' });
        mapRef.current.addControl(filterControlRef.current);
      }
    }
  }, [property, properties, filters, onSelectProperty]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <div ref={mapContainerRef} className="h-64 md:h-80 rounded-lg" style={{ zIndex: 0 }}></div>
    </div>
  );
};