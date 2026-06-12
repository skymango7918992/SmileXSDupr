export type GeocodeResult = {
  display_name: string;
  venue_name: string;
  latitude: number;
  longitude: number;
  source: "esri" | "google" | "nominatim" | "photon";
};

const USER_AGENT = "SmileXSDupr/1.0 (personal sports tracker)";

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const trimmed = v.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/** 台灣門牌常見寫法變體，提高命中率 */
export function buildTaiwanAddressVariants(query: string): string[] {
  const q = query.trim();
  if (!q) return [];

  const variants = [
    q,
    q.replace(/臺/g, "台"),
    q.replace(/台/g, "臺"),
    q.replace(/之(\d+)/g, "之$1"),
    q.replace(/號之\d+/, "號"),
    q.replace(/之\d+$/, ""),
    q.replace(/高雄市/g, "高雄市"),
    q.replace(/高雄市/g, "高雄"),
    q.replace(/(\d+)號之(\d+)/, "$1之$2號"),
  ];

  if (!/台灣|臺灣/.test(q)) {
    variants.push(`台灣${q}`, `臺灣${q}`);
  }

  return uniqueStrings(variants);
}

async function searchEsri(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    f: "json",
    countryCode: "TWN",
    maxLocations: "6",
    outFields: "Match_addr,Addr_type,City,Region",
    singleLine: query,
  });

  const res = await fetch(
    `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?${params}`,
    { next: { revalidate: 0 } },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    candidates?: Array<{
      address?: string;
      score?: number;
      location?: { x: number; y: number };
    }>;
  };

  return (data.candidates ?? [])
    .filter((c) => c.location && (c.score ?? 0) >= 70)
    .map((c) => ({
      display_name: c.address ?? query,
      venue_name: (c.address ?? query).split(",")[0]?.trim() || query,
      latitude: c.location!.y,
      longitude: c.location!.x,
      source: "esri" as const,
    }));
}

async function searchGoogle(
  query: string,
  apiKey: string,
): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    address: query,
    key: apiKey,
    language: "zh-TW",
    region: "tw",
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
    { next: { revalidate: 0 } },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    status?: string;
    results?: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
  };

  if (data.status !== "OK" || !data.results?.length) return [];

  return data.results.slice(0, 6).map((item) => ({
    display_name: item.formatted_address,
    venue_name: item.formatted_address.split(",")[0]?.trim() || query,
    latitude: item.geometry.location.lat,
    longitude: item.geometry.location.lng,
    source: "google" as const,
  }));
}

async function searchNominatim(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "6",
    countrycodes: "tw",
    "accept-language": "zh-TW",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 0 },
    },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    name?: string;
  }>;

  return data.map((item) => ({
    display_name: item.display_name,
    venue_name:
      item.name?.trim() || item.display_name.split(",")[0]?.trim() || query,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    source: "nominatim" as const,
  }));
}

async function searchPhoton(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "6",
  });

  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    features?: Array<{
      properties: {
        name?: string;
        street?: string;
        city?: string;
        state?: string;
        country?: string;
      };
      geometry: { coordinates: [number, number] };
    }>;
  };

  return (data.features ?? []).map((f) => {
    const p = f.properties;
    const label = [p.name, p.street, p.city, p.state, p.country]
      .filter(Boolean)
      .join(", ");
    return {
      display_name: label || query,
      venue_name: p.name?.trim() || p.street?.trim() || query,
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
      source: "photon" as const,
    };
  });
}

function dedupeResults(results: GeocodeResult[]): GeocodeResult[] {
  const seen = new Set<string>();
  const out: GeocodeResult[] = [];
  for (const r of results) {
    const key = `${r.latitude.toFixed(5)},${r.longitude.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export async function searchPlaces(
  query: string,
  options?: { googleApiKey?: string },
): Promise<GeocodeResult[]> {
  const variants = buildTaiwanAddressVariants(query);
  if (!variants.length) return [];

  const all: GeocodeResult[] = [];

  for (const variant of variants.slice(0, 4)) {
    const esri = await searchEsri(variant);
    all.push(...esri);
    if (esri.length) break;
  }

  if (!all.length && options?.googleApiKey) {
    for (const variant of variants.slice(0, 2)) {
      const google = await searchGoogle(variant, options.googleApiKey);
      all.push(...google);
      if (google.length) break;
    }
  }

  if (!all.length) {
    for (const variant of variants.slice(0, 3)) {
      const nominatim = await searchNominatim(variant);
      all.push(...nominatim);
      if (nominatim.length) break;
    }
  }

  if (!all.length) {
    const photon = await searchPhoton(variants[0]);
    all.push(...photon);
  }

  return dedupeResults(all).slice(0, 6);
}

export async function resolveBestPlace(
  query: string,
  options?: { googleApiKey?: string },
): Promise<GeocodeResult | null> {
  const results = await searchPlaces(query, options);
  return results[0] ?? null;
}
