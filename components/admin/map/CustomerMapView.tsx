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
import { Loader2, MapPin, PanelRightOpen, PanelRightClose } from 'lucide-react';
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
  /** Sum of completed Job.totalPrice — not collected payments. */
  completedJobValue: number;
  distanceFromHqMiles: number | null;
}

interface MissingLocationRow {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  hasAddress: boolean;
  city: string | null;
  state: string | null;
  branchName: string | null;
  branchSlug: string | null;
  statusCategory: 'active' | 'lead' | 'inactive';
  canGeocode: boolean;
}

interface MapSummary {
  totalProperties: number;
  missingLocationCount: number;
  missingLocationsTruncated?: boolean;
  avgDistanceFromHqMiles: number | null;
  zoneBreakdown: {
    ZONE_A: number;
    ZONE_B: number;
    ZONE_C: number;
    ZONE_D: number;
    unset: number;
    newJersey: number;
  };
  statusBreakdown?: {
    active: number;
    lead: number;
    inactive: number;
  };
}

type BranchFilter = 'all' | 'vermont' | 'new-jersey';
type ColorMode = 'status' | 'zone';

const ZONE_PIN_COLORS: Record<TravelZone, string> = {
  ZONE_A: '#22c55e',
  ZONE_B: '#06b6d4',
  ZONE_C: '#f59e0b',
  ZONE_D: '#ef4444',
};

const STATUS_PIN_COLORS = {
  active: '#0d9488',
  lead: '#2563eb',
  inactive: '#94a3b8',
} as const;

const NJ_PIN_COLOR = '#7c3aed';
const UNSET_VT_PIN = '#1e3a5f';

const STATUS_LABEL: Record<'active' | 'lead' | 'inactive', string> = {
  active: 'Active customer',
  lead: 'Lead',
  inactive: 'Inactive',
};

function pinSvg(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path fill="${color}" stroke="#fff" stroke-width="1.5" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function hqPinSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><rect x="2" y="10" width="20" height="12" rx="1" fill="#0e7490"/><path fill="#1e3a5f" d="M12 2L2 10h4v12h12V10h4L12 2z"/><rect x="9" y="14" width="6" height="8" fill="#fff"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function propertyPinColor(p: MapProperty, colorMode: ColorMode): string {
  if (colorMode === 'status') {
    return STATUS_PIN_COLORS[p.statusCategory];
  }
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
  const [missingLocations, setMissingLocations] = useState<MissingLocationRow[]>(
    []
  );
  const [summary, setSummary] = useState<MapSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [branchFilter, setBranchFilter] = useState<BranchFilter>('all');
  const [statusFilter, setStatusFilter] =
    useState<CustomerMapStatusFilter>('all');
  const [colorMode, setColorMode] = useState<ColorMode>('status');
  const [showZoneCircles, setShowZoneCircles] = useState(false);
  const [showMissingPanel, setShowMissingPanel] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [geocodingId, setGeocodingId] = useState<string | null>(null);
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);

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
      setMissingLocations(data.missingLocations || []);
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

  const visibleMissing = useMemo(
    () =>
      missingLocations.filter(
        (m) => statusFilter === 'all' || m.statusCategory === statusFilter
      ),
    [missingLocations, statusFilter]
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
      status: {
        active: visibleProperties.filter((p) => p.statusCategory === 'active')
          .length,
        lead: visibleProperties.filter((p) => p.statusCategory === 'lead').length,
        inactive: visibleProperties.filter((p) => p.statusCategory === 'inactive')
          .length,
      },
    };
  }, [visibleProperties]);

  const focusProperty = useCallback(
    (p: MapProperty) => {
      setSelectedId(p.id);
      mapInstance?.panTo({ lat: p.latitude, lng: p.longitude });
      mapInstance?.setZoom(12);
    },
    [mapInstance]
  );

  const geocodeOne = useCallback(
    async (customerId: string) => {
      setGeocodingId(customerId);
      setGeocodeMessage(null);
      try {
        const res = await fetch(
          `/api/admin/map/customers/${customerId}/geocode`,
          { method: 'POST', credentials: 'include' }
        );
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Geocode failed');
        }
        setGeocodeMessage(`Pinned: ${data.address}`);
        await fetchData();
        setSelectedId(customerId);
        mapInstance?.panTo({ lat: data.latitude, lng: data.longitude });
        mapInstance?.setZoom(12);
      } catch (err) {
        setGeocodeMessage(
          err instanceof Error ? err.message : 'Geocode failed'
        );
      } finally {
        setGeocodingId(null);
      }
    },
    [fetchData, mapInstance]
  );

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
          <button
            type="button"
            onClick={() => setShowMissingPanel(true)}
            className="text-left"
          >
            <Stat
              label="Missing location"
              value={String(summary?.missingLocationCount ?? visibleMissing.length)}
              accent={
                (summary?.missingLocationCount ?? 0) > 0 ? '#ef4444' : undefined
              }
            />
          </button>
          <Stat
            label="Avg distance from HQ (VT)"
            value={
              filteredSummary.avgDistance != null
                ? `${filteredSummary.avgDistance.toFixed(1)} mi`
                : '—'
            }
          />
          {colorMode === 'status' ? (
            <>
              <Stat
                label="Active"
                value={String(filteredSummary.status.active)}
                accent={STATUS_PIN_COLORS.active}
              />
              <Stat
                label="Lead"
                value={String(filteredSummary.status.lead)}
                accent={STATUS_PIN_COLORS.lead}
              />
              <Stat
                label="Inactive"
                value={String(filteredSummary.status.inactive)}
                accent={STATUS_PIN_COLORS.inactive}
              />
            </>
          ) : (
            <>
              <Stat label="Zone A" value={String(filteredSummary.zones.ZONE_A)} accent="#22c55e" />
              <Stat label="Zone B" value={String(filteredSummary.zones.ZONE_B)} accent="#06b6d4" />
              <Stat label="Zone C" value={String(filteredSummary.zones.ZONE_C)} accent="#f59e0b" />
              <Stat label="Zone D" value={String(filteredSummary.zones.ZONE_D)} accent="#ef4444" />
              {summary && (
                <Stat label="NJ" value={String(summary.zoneBreakdown.newJersey)} accent="#7c3aed" />
              )}
            </>
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
        <FilterGroup
          label="Pin color"
          options={[
            ['status', 'Customer / Lead'],
            ['zone', 'Travel zone'],
          ]}
          value={colorMode}
          onChange={(v) => setColorMode(v as ColorMode)}
        />
        <label className="flex cursor-pointer items-center gap-2 font-body text-xs text-vm-navy">
          <input
            type="checkbox"
            checked={showZoneCircles}
            onChange={(e) => setShowZoneCircles(e.target.checked)}
            className="rounded border-vm-border"
          />
          Zone circles
        </label>
        <button
          type="button"
          onClick={() => setShowMissingPanel((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-vm-white px-2.5 py-1 font-body text-xs font-semibold text-vm-navy hover:bg-vm-surface"
        >
          {showMissingPanel ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" />
          )}
          Missing list ({summary?.missingLocationCount ?? visibleMissing.length})
        </button>
      </div>

      {/* Map + side panel */}
      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
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
          {geocodeMessage && (
            <div className="absolute inset-x-0 top-2 z-10 mx-auto max-w-lg rounded-lg bg-vm-white px-4 py-2 text-center font-body text-sm text-vm-navy shadow">
              {geocodeMessage}
            </div>
          )}

          {isLoaded && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={8}
              onLoad={(map) => setMapInstance(map)}
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
                    url: pinSvg(propertyPinColor(p, colorMode)),
                    scaledSize: { width: 28, height: 36 } as google.maps.Size,
                    anchor: { x: 14, y: 36 } as google.maps.Point,
                  }}
                  onClick={() => focusProperty(p)}
                  title={`${p.name} · ${STATUS_LABEL[p.statusCategory]}`}
                />
              ))}

              {selected && (
                <InfoWindow
                  position={{ lat: selected.latitude, lng: selected.longitude }}
                  onCloseClick={() => setSelectedId(null)}
                >
                  <div className="max-w-[240px] font-body text-sm text-vm-navy">
                    <p className="font-heading font-bold">{selected.name}</p>
                    <p className="mt-1 text-xs text-vm-muted">{selected.address}</p>
                    <p className="mt-2 text-xs">
                      <span className="font-semibold">Type:</span>{' '}
                      {STATUS_LABEL[selected.statusCategory]}
                    </p>
                    <p className="text-xs">
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
                      {selected.completedJobValue.toFixed(0)} Completed Job Value
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/customers/${selected.id}`}
                        className="text-xs font-semibold text-vm-cyan-dark hover:underline"
                      >
                        Customer →
                      </Link>
                      <Link
                        href={`/admin/jobs?customerId=${selected.id}`}
                        className="text-xs font-semibold text-vm-cyan-dark hover:underline"
                      >
                        Jobs →
                      </Link>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        {showMissingPanel && (
          <aside className="flex w-full max-w-sm flex-col border-l border-vm-border bg-vm-white md:w-96">
            <div className="border-b border-vm-border px-4 py-3">
              <h2 className="font-heading text-sm font-bold text-vm-navy">
                Missing location
              </h2>
              <p className="mt-1 font-body text-xs text-vm-muted">
                These people have no map pin yet. Geocode one at a time when the
                address looks right — nothing is bulk-updated.
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {visibleMissing.length === 0 ? (
                <p className="p-4 font-body text-sm text-vm-muted">
                  No missing locations for this filter.
                </p>
              ) : (
                <ul className="divide-y divide-vm-border">
                  {visibleMissing.map((row) => (
                    <li key={row.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-heading text-sm font-semibold text-vm-navy">
                            {row.name || 'Unnamed'}
                          </p>
                          <p className="mt-0.5 font-body text-[11px] text-vm-muted">
                            {STATUS_LABEL[row.statusCategory]}
                            {row.branchName ? ` · ${row.branchName}` : ''}
                          </p>
                          <p className="mt-1 font-body text-xs text-vm-navy">
                            {row.address || (
                              <span className="text-vm-danger">
                                No street address on file
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!row.canGeocode || geocodingId === row.id}
                          onClick={() => geocodeOne(row.id)}
                          className="rounded-md bg-vm-navy px-2.5 py-1 font-body text-[11px] font-semibold text-vm-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {geocodingId === row.id ? 'Geocoding…' : 'Geocode'}
                        </button>
                        <Link
                          href={`/admin/customers/${row.id}`}
                          className="rounded-md bg-vm-surface px-2.5 py-1 font-body text-[11px] font-semibold text-vm-navy hover:bg-vm-border/40"
                        >
                          Edit customer
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {summary?.missingLocationsTruncated && (
                <p className="border-t border-vm-border px-4 py-2 font-body text-[11px] text-vm-muted">
                  Showing first 100 missing records.
                </p>
              )}
            </div>
          </aside>
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
