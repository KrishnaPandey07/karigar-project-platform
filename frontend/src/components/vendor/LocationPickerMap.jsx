import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import { createPinIcon } from '../../utils/leafletIcons';
import { MapPin, Navigation } from 'lucide-react';

function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({
  lat = 28.6139,
  lng = 77.2090,
  radiusKm = 10,
  onLocationChange,
  address,
}) {
  const position = useMemo(() => [lat, lng], [lat, lng]);
  const pinIcon = useMemo(() => createPinIcon('#16a34a'), []);

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    if (marker) {
      const newPos = marker.getLatLng();
      onLocationChange(newPos.lat, newPos.lng);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onLocationChange(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err.message);
        }
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-gray-600">
        <span className="flex items-center gap-1.5 font-medium">
          <MapPin className="w-4 h-4 text-brand-600" />
          Click anywhere or drag the green pin to position your service base
        </span>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md transition"
        >
          <Navigation className="w-3 h-3" /> Detect My Location
        </button>
      </div>

      <div className="h-72 w-full rounded-2xl overflow-hidden border border-gray-300 shadow-inner relative z-0">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationChange={onLocationChange} />
          <Marker
            position={position}
            draggable={true}
            icon={pinIcon}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          />
          {radiusKm > 0 && (
            <Circle
              center={position}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#16a34a',
                fillColor: '#22c55e',
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-gray-500">Service Center Coordinates:</span>{' '}
          <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-800">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </code>
        </div>
        {address && (
          <div className="text-gray-600 truncate max-w-xs">
            <span className="text-gray-500">Address:</span> {address}
          </div>
        )}
      </div>
    </div>
  );
}
