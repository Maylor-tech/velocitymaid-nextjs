'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Circle,
  InfoWindow,
} from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';
import type { TravelZone } from '@prisma/client';
import {
  VM_HQ,
  ZONE_RADIUS_MILES,
} from '@/lib/geocoding/distance';
import type { CustomerMapStatusFilter } from '@/lib/geocoding/customerMapStatus';

const mapContainerStyle = { width: '100%', height: '100%' };

const defaultCenter = { lat: 43.6, lng: -72.8 };

interface MapProperty {
  id: string;
  name: string;
  address: string;
  branchName: string;
  branchSlug: string | null;
  travelZone: TravelZone | null;
  travelZoneLabel: string | null;
  latitude: number;
  longitude: number;
  statusCategory: 'active' | 'lead' | 'inactive';
  jobsCompleted: number;
  totalRevenue: number;
  distanceFromHqMiles: number | null;
}

interface MapSummary {
  totalProperties: number;
  avgDistanceFromHqMiles: number | null;
  zoneBreakdown: {
    ZONE_A: number;
    ZONE_B: number;
    ZONE_C: number;
    ZONE_D: number;
    unset: number;
    newJersey: number;
  };
}

type BranchFilter = 'all' | 'vermont' | 'new-jersey';

const ZONE_PIN_COLORS: Record<TravelZone, string> = {
  ZONE_A: '#22c55e',
  ZONE_B: '#06b6d4',
  ZONE_C: '#f59e0b',
  ZONE_D: '#ef4444',
};

const NJ_PIN_COLOR = '#7c3aed';
const UNSET_VT_PIN = '#1e3a5f';

function pinSvg(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path fill="${color}" stroke="#fff" stroke-width="1.5" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function hqPinSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><rect x="2" y="10" width="20" height="12" rx="1" fill="#0e7490"/><path fill="#1e3a5f" d="M12 2L2 10h4v12h12V10h4L12 2z"/><rect x="9" y="14" width="6" height="8" fill="#fff"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function propertyPinColor(p: MapProperty): string {
  if (p.branchSlug === 'new-jersey') return NJ_PIN_COLOR;
  if (p.travelZone) return ZONE_PIN_COLORS[p.travelZone];
  return UNSET_VT_PIN;
}

export function CustomerMapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'velocitymaid-admin-map',
  });

  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [summary, setSummary] = useState<MapSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [branchFilter, setBranchFilter] = useState<BranchFilter>('all');
  const [statusFilter, setStatusFilter] =
    useState<CustomerMapStatusFilter>('all');
  const [showZoneCircles, setShowZoneCircles] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (branchFilter !== 'all') params.set('branch', branchFilter);
      const res = await fetch(`/api/admin/map/customers?${params}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load map');
      setProperties(data.properties);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load map');
    } finally {
      setLoading(false);
    }
  }, [branchFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const visibleProperties = useMemo(
    () =>
      properties.filter(
        (p) => statusFilter === 'all' || p.statusCategory === statusFilter
      ),
    [properties, statusFilter]
  );

  const selected = visibleProperties.find((p) => p.id === selectedId) ?? null;

  const filteredSummary = useMemo(() => {
    const vt = visibleProperties.filter((p) => p.branchSlug !== 'new-jersey');
    const withDist = vt.filter((p) => p.distanceFromHqMiles != null);
    return {
      total: visibleProperties.length,
      avgDistance:
        withDist.length > 0
          ? withDist.reduce((s, p) => s + (p.distanceFromHqMiles ?? 0), 0) /
            withDist.length
          : null,
      zones: {
        ZONE_A: visibleProperties.filter((p) => p.travelZone === 'ZONE_A').length,
        ZONE_B: visibleProperties.filter((p) => p.travelZone === 'ZONE_B').length,
        ZONE_C: visibleProperties.filter((p) => p.travelZone === 'ZONE_C').length,
        ZONE_D: visibleProperties.filter((p) => p.travelZone === 'ZONE_D').length,
      },
    };
  }, [visibleProperties]);

  if (!apiKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <MapPin className="mb-4 h-12 w-12 text-vm-cyan" />
        <h2 className="font-heading text-lg font-bold text-vm-navy">
          Google Maps API key required
        </h2>
        <p className="mt-2 max-w-lg font-body text-sm text-vm-muted">
          Add <code className="rounded bg-vm-surface px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{' '}
          and <code className="rounded bg-vm-surface px-1">GOOGLE_MAPS_API_KEY</code> to your
          environment. Enable Maps JavaScript API and Geocoding API in Google Cloud, then redeploy.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 font-body text-sm text-vm-danger">
        Failed to load Google Maps: {loadError.message}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Stats */}
      <div className="border-b border-vm-border bg-vm-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-4">
          <Stat label="Properties on map" value={String(filteredSummary.total)} />
          <Stat
            label="Avg distance from HQ (VT)"
            value={
              filteredSummary.avgDistance != null
                ? `${filteredSummary.avgDistance.toFixed(1)} mi`
                : '—'
            }
          />
          <Stat label="Zone A" value={String(filteredSummary.zones.ZONE_A)} accent="#22c55e" />
          <Stat label="Zone B" value={String(filteredSummary.zones.ZONE_B)} accent="#06b6d4" />
          <Stat label="Zone C" value={String(filteredSummary.zones.ZONE_C)} accent="#f59e0b" />
          <Stat label="Zone D" value={String(filteredSummary.zones.ZONE_D)} accent="#ef4444" />
          {summary && (
            <Stat label="NJ" value={String(summary.zoneBreakdown.newJersey)} accent="#7c3aed" />
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-vm-border bg-vm-surface px-4 py-2">
        <FilterGroup
          label="Branch"
          options={[
            ['all', 'All'],
            ['vermont', 'Vermont'],
            ['new-jersey', 'NJ'],
          ]}
          value={branchFilter}
          onChange={(v) => setBranchFilter(v as BranchFilter)}
        />
        <FilterGroup
          label="Status"
          options={[
            ['all', 'All'],
            ['active', 'Active'],
            ['lead', 'Lead'],
            ['inactive', 'Inactive'],
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as CustomerMapStatusFilter)}
        />
        <label className="ml-auto flex cursor-pointer items-center gap-2 font-body text-xs text-vm-navy">
          <input
            type="checkbox"
            checked={showZoneCircles}
            onChange={(e) => setShowZoneCircles(e.target.checked)}
            className="rounded border-vm-border"
          />
          Show travel zone circles
        </label>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        {(loading || !isLoaded) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-vm-surface/80">
            <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
          </div>
        )}
        {error && (
          <div className="absolute inset-x-0 top-2 z-10 mx-auto max-w-md rounded-lg bg-vm-danger-bg px-4 py-2 text-center font-body text-sm text-vm-danger">
            {error}
          </div>
        )}

        {isLoaded && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={8}
            options={{
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          >
            <Marker
              position={{ lat: VM_HQ.lat, lng: VM_HQ.lng }}
              icon={{
                url: hqPinSvg(),
                scaledSize: { width: 32, height: 32 } as google.maps.Size,
                anchor: { x: 16, y: 32 } as google.maps.Point,
              }}
              title={VM_HQ.label}
              zIndex={1000}
            />

            {showZoneCircles &&
              ZONE_RADIUS_MILES.map((miles) => (
                <Circle
                  key={miles}
                  center={{ lat: VM_HQ.lat, lng: VM_HQ.lng }}
                  radius={miles * 1609.344}
                  options={{
                    fillColor:
                      miles === 20 ? '#22c55e' : miles === 40 ? '#06b6d4' : '#f59e0b',
                    fillOpacity: 0.06,
                    strokeColor:
                      miles === 20 ? '#22c55e' : miles === 40 ? '#06b6d4' : '#f59e0b',
                    strokeOpacity: 0.45,
                    strokeWeight: 1.5,
                  }}
                />
              ))}

            {visibleProperties.map((p) => (
              <Marker
                key={p.id}
                position={{ lat: p.latitude, lng: p.longitude }}
                icon={{
                  url: pinSvg(propertyPinColor(p)),
                  scaledSize: { width: 28, height: 36 } as google.maps.Size,
                  anchor: { x: 14, y: 36 } as google.maps.Point,
                }}
                onClick={() => setSelectedId(p.id)}
              />
            ))}

            {selected && (
              <InfoWindow
                position={{ lat: selected.latitude, lng: selected.longitude }}
                onCloseClick={() => setSelectedId(null)}
              >
                <div className="max-w-[220px] font-body text-sm text-vm-navy">
                  <p className="font-heading font-bold">{selected.name}</p>
                  <p className="mt-1 text-xs text-vm-muted">{selected.address}</p>
                  <p className="mt-2 text-xs">
                    <span className="font-semibold">Branch:</span> {selected.branchName}
                  </p>
                  {selected.travelZoneLabel && (
                    <p className="text-xs">
                      <span className="font-semibold">Travel zone:</span>{' '}
                      {selected.travelZoneLabel}
                    </p>
                  )}
                  {selected.distanceFromHqMiles != null && (
                    <p className="text-xs">
                      <span className="font-semibold">From HQ:</span>{' '}
                      {selected.distanceFromHqMiles.toFixed(1)} mi
                    </p>
                  )}
                  <p className="mt-1 text-xs">
                    {selected.jobsCompleted} job(s) completed · $
                    {selected.totalRevenue.toFixed(0)} revenue
                  </p>
                  <Link
                    href={`/admin/jobs?customerId=${selected.id}`}
                    className="mt-2 inline-block text-xs font-semibold text-vm-cyan-dark hover:underline"
                  >
                    View in Jobs →
                  </Link>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {accent && (
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
      )}
      <div>
        <p className="font-body text-[10px] uppercase tracking-wide text-vm-muted">{label}</p>
        <p className="font-heading text-sm font-bold text-vm-navy">{value}</p>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-heading text-[10px] font-semibold uppercase tracking-wide text-vm-muted">
        {label}
      </span>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1 font-body text-xs font-semibold transition-colors ${
            value === v
              ? 'bg-vm-navy text-vm-white'
              : 'bg-vm-white text-vm-navy hover:bg-vm-surface'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
