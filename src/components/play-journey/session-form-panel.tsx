"use client";

import { MapPin, Search, Star } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { LocationPickerMap } from "@/components/play-journey/location-picker-map";
import { createPlaySession } from "@/lib/actions/play-journey";
import {
  createSavedPlace,
  touchSavedPlace,
} from "@/lib/actions/play-saved-places";
import {
  resolvePlaceAction,
  searchPlacesAction,
} from "@/lib/actions/geocode";
import type { GeocodeResult } from "@/lib/play-geocode";
import {
  durationToHoursMinutes,
  isSameSavedPlace,
} from "@/lib/play-saved-place-utils";
import {
  JOURNEY_SPORT_LABELS,
  type JourneySport,
  type PlaySavedPlace,
} from "@/types/play-journey";
import { toISODate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  savedPlaces: PlaySavedPlace[];
  preset?: PlaySavedPlace | null;
  onClose: () => void;
  onSaved: () => void;
};

const SPORTS: JourneySport[] = ["pickleball", "badminton"];

export function SessionFormPanel({
  savedPlaces,
  preset = null,
  onClose,
  onSaved,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
  const [rememberPlace, setRememberPlace] = useState(false);

  const [playedOn, setPlayedOn] = useState(toISODate(new Date()));
  const [sportType, setSportType] = useState<JourneySport>("pickleball");
  const [startTime, setStartTime] = useState("");
  const [hours, setHours] = useState("2");
  const [minutes, setMinutes] = useState("0");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [teamName, setTeamName] = useState("");
  const [notes, setNotes] = useState("");

  const hasPin = latitude != null && longitude != null;

  const applySavedPlace = (place: PlaySavedPlace) => {
    setActiveSavedId(place.id);
    setVenueName(place.venue_name);
    setAddress(place.address);
    setTeamName(place.team_name);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    if (place.sport_type) setSportType(place.sport_type);
    const { hours: h, minutes: m } = durationToHoursMinutes(
      place.default_duration_minutes,
    );
    setHours(h);
    setMinutes(m);
    setResults([]);
    setError(null);
    setRememberPlace(false);
  };

  useEffect(() => {
    if (preset) applySavedPlace(preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preset on open only
  }, [preset?.id]);

  const alreadySaved = savedPlaces.some((p) =>
    isSameSavedPlace(p, {
      venue_name: venueName,
      team_name: teamName,
      latitude,
      longitude,
    }),
  );

  const applyPlace = (place: GeocodeResult) => {
    setAddress(place.display_name);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    setResults([]);
    setActiveSavedId(null);
    if (!venueName.trim()) {
      setVenueName(place.venue_name);
    }
    setError(null);
  };

  const runSearch = async () => {
    const q = address.trim();
    if (q.length < 2) {
      setError("請輸入完整地址或球館關鍵字（至少 2 字）");
      return;
    }
    setError(null);
    setSearching(true);
    try {
      const found = await searchPlacesAction(q);
      setResults(found);
      setActiveSavedId(null);
      if (!found.length) {
        setError(
          "搜尋不到這個地址。請確認門牌是否正確，或直接點下方地圖標記位置。",
        );
      } else if (found.length === 1) {
        applyPlace(found[0]);
      }
    } catch {
      setError("地址搜尋失敗，請稍後再試或直接點地圖標記");
    } finally {
      setSearching(false);
    }
  };

  const submit = () => {
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const duration = h * 60 + m;
    if (duration <= 0) {
      setError("請填寫打球時長");
      return;
    }
    if (!venueName.trim()) {
      setError("請填寫地點名稱（球館名或顯示名稱）");
      return;
    }
    if (!address.trim() && !hasPin) {
      setError("請填寫地址、選常用捷徑，或在地圖上點選位置");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        let lat = latitude;
        let lng = longitude;

        if (lat == null || lng == null) {
          const resolved = await resolvePlaceAction(
            address.trim() || venueName.trim(),
          );
          if (!resolved) {
            setError(
              "無法自動定位此地址。請按「搜尋地址」選結果，或直接點地圖標記球館位置。",
            );
            return;
          }
          lat = resolved.latitude;
          lng = resolved.longitude;
          setLatitude(lat);
          setLongitude(lng);
        }

        await createPlaySession({
          played_on: playedOn,
          sport_type: sportType,
          start_time: startTime || undefined,
          duration_minutes: duration,
          venue_name: venueName.trim(),
          team_name: teamName,
          notes: notes.trim() || undefined,
          latitude: lat,
          longitude: lng,
        });

        if (activeSavedId) {
          await touchSavedPlace(activeSavedId);
        }

        if (rememberPlace && !alreadySaved) {
          await createSavedPlace({
            venue_name: venueName.trim(),
            address: address.trim(),
            team_name: teamName.trim(),
            sport_type: sportType,
            latitude: lat,
            longitude: lng,
            default_duration_minutes: duration,
          });
        }

        onSaved();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "儲存失敗");
      }
    });
  };

  return (
    <div className="glass-card border-2 border-accent/30 p-4 sm:p-5">
      <h3 className="text-base font-semibold text-foreground">紀錄這次打球</h3>
      <p className="mb-4 text-xs text-muted">
        先點常用捷徑帶入，或填地址搜尋定位
      </p>

      {savedPlaces.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted">常用捷徑</p>
          <div className="flex flex-wrap gap-2">
            {savedPlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                className={cn(
                  "play-saved-chip",
                  activeSavedId === place.id && "play-saved-chip--active",
                )}
                onClick={() => applySavedPlace(place)}
              >
                <Star className="h-3 w-3 shrink-0 text-accent" />
                <span>{place.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">日期</span>
          <Input
            type="date"
            value={playedOn}
            onChange={(e) => setPlayedOn(e.target.value)}
          />
        </label>

        <div>
          <span className="mb-1 block text-sm text-muted">運動</span>
          <div className="flex gap-2">
            {SPORTS.map((s) => (
              <button
                key={s}
                type="button"
                className={cn(
                  "flex-1 rounded-[8px] border px-3 py-2 text-sm font-medium transition-colors",
                  sportType === s
                    ? s === "pickleball"
                      ? "border-primary bg-primary-subtle text-primary"
                      : "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-border bg-surface text-secondary-foreground hover:bg-surface-muted",
                )}
                onClick={() => setSportType(s)}
              >
                {JOURNEY_SPORT_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">開始（選填）</span>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">小時</span>
            <Input
              type="number"
              min={0}
              max={12}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">分鐘</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-muted">地點名稱</span>
          <Input
            value={venueName}
            onChange={(e) => {
              setVenueName(e.target.value);
              setActiveSavedId(null);
            }}
            placeholder="例：鳳山羽球館"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-muted">球隊（選填）</span>
          <Input
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              setActiveSavedId(null);
            }}
          />
        </label>

        <div>
          <span className="mb-1 block text-sm text-muted">地址（用於定位）</span>
          <div className="flex gap-2">
            <Input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setLatitude(null);
                setLongitude(null);
                setActiveSavedId(null);
              }}
              placeholder="有常用捷徑可略過；新地點請填完整地址"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void runSearch();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void runSearch()}
              loading={searching}
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">搜尋</span>
            </Button>
          </div>
          {results.length > 1 && (
            <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border bg-surface">
              {results.map((place) => (
                <li key={`${place.latitude}-${place.longitude}-${place.display_name}`}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
                    onClick={() => applyPlace(place)}
                  >
                    <span className="font-medium text-foreground">
                      {place.venue_name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted line-clamp-2">
                      {place.display_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
            hasPin
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning",
          )}
        >
          <MapPin className="h-4 w-4 shrink-0" />
          {hasPin ? (
            <span>
              已定位{" "}
              <span className="font-data text-xs">
                ({latitude!.toFixed(5)}, {longitude!.toFixed(5)})
              </span>
            </span>
          ) : (
            <span>尚未定位 — 選常用捷徑、搜尋地址或點地圖</span>
          )}
        </div>

        <LocationPickerMap
          latitude={latitude}
          longitude={longitude}
          onPick={({ latitude: lat, longitude: lng }) => {
            setLatitude(lat);
            setLongitude(lng);
            setActiveSavedId(null);
            setError(null);
          }}
        />

        <label className="block text-sm">
          <span className="mb-1 block text-muted">備註</span>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="今天練了什麼…"
          />
        </label>

        {!alreadySaved && venueName.trim() && hasPin && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary"
              checked={rememberPlace}
              onChange={(e) => setRememberPlace(e.target.checked)}
            />
            <Star className="h-3.5 w-3.5 text-accent" />
            記住這個地點與球隊，下次一鍵帶入
          </label>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-live">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="accent" onClick={submit} loading={pending}>
          寫入軌跡
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          取消
        </Button>
      </div>
    </div>
  );
}
