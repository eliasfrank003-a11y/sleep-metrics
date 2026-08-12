import { useState } from 'react';
import { Moon, Sun, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { WINDOWS, type NightWindow } from '@/hooks/useNightWindow';
import { PLACES, type Place } from '@/lib/sun';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  place: Place;
  onSelectPlace: (place: Place) => void;
  window: NightWindow;
  onSelectWindow: (window: NightWindow) => void;
  /** Surfaced here rather than on the chart: a sync error is not a night. */
  syncError: string | null;
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3 py-2 text-[13px] transition-colors ${
        active ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h2>
      {hint && <p className="mb-3 mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      <div className={hint ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

export function SettingsPanel({
  open,
  onClose,
  place,
  onSelectPlace,
  window,
  onSelectWindow,
  syncError,
}: SettingsPanelProps) {
  const { theme, toggle } = useTheme();
  const [lat, setLat] = useState(String(place.lat));
  const [lon, setLon] = useState(String(place.lon));

  if (!open) return null;

  const applyCoordinates = () => {
    const parsedLat = Number(lat);
    const parsedLon = Number(lon);
    if (!Number.isFinite(parsedLat) || Math.abs(parsedLat) > 90) return;
    if (!Number.isFinite(parsedLon) || Math.abs(parsedLon) > 180) return;
    onSelectPlace({ label: 'Custom', lat: parsedLat, lon: parsedLon });
  };

  return (
    <div className="app-scroll fixed inset-0 z-50 bg-background">
      <div className="mx-auto max-w-md px-5 pb-20 pt-8">
        <header className="mb-8 flex items-start justify-between">
          <h1 className="text-[26px] font-semibold tracking-tight">Settings</h1>
          {/* A 16px icon in the corner of a phone screen is not a target. The
              padding takes it to 40px square; the negative margin keeps it
              looking like it never moved. */}
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="-m-3 p-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <Section title="Nights shown">
          <div className="grid grid-cols-4 gap-2">
            {WINDOWS.map((option) => (
              <Choice key={option} active={option === window} onClick={() => onSelectWindow(option)}>
                {option}
              </Choice>
            ))}
          </div>
        </Section>

        <Section title="Sun" hint="Where sunrise and sunset are computed for.">
          <div className="grid grid-cols-3 gap-2">
            {PLACES.map((option) => (
              <Choice
                key={option.label}
                active={option.label === place.label}
                onClick={() => {
                  setLat(String(option.lat));
                  setLon(String(option.lon));
                  onSelectPlace(option);
                }}
              >
                {option.label}
              </Choice>
            ))}
          </div>

          {/* Labelled beside the field rather than by a placeholder: a
              placeholder is gone the moment the field has a value, which is
              always here - the preset fills both in. Two bare decimals with no
              label are unreadable. */}
          <p className="mb-2 mt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Or coordinates
          </p>
          <div className="flex items-center gap-2">
            <label className="flex w-full items-center gap-2 rounded-lg bg-card px-3 py-2">
              <span className="text-[11px] text-muted-foreground">Lat</span>
              <input
                value={lat}
                onChange={(event) => setLat(event.target.value)}
                onBlur={applyCoordinates}
                inputMode="decimal"
                className="w-full bg-transparent text-[13px] tabular-nums outline-none"
              />
            </label>
            <label className="flex w-full items-center gap-2 rounded-lg bg-card px-3 py-2">
              <span className="text-[11px] text-muted-foreground">Lon</span>
              <input
                value={lon}
                onChange={(event) => setLon(event.target.value)}
                onBlur={applyCoordinates}
                inputMode="decimal"
                className="w-full bg-transparent text-[13px] tabular-nums outline-none"
              />
            </label>
          </div>
        </Section>

        <Section title="Appearance">
          <button
            onClick={toggle}
            className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-[13px]"
          >
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </Section>

        {syncError && (
          <Section title="Calendar">
            <p className="text-xs text-destructive">{syncError}</p>
          </Section>
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Nights come from the Sleep calendar in Google Calendar, which the tracker writes to.
          Nothing is entered here by hand.
        </p>
      </div>
    </div>
  );
}
