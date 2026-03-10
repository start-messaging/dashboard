import { useState, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  countries,
  countryByCode,
  DEFAULT_COUNTRY_CODE,
  POPULAR_COUNTRIES,
  type Country,
} from '@/data/countries';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, disabled }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCountry = useMemo(() => {
    // Try to find which country matches the current value's dial code
    if (value) {
      // Sort by dial code length descending to match longest first
      const sorted = [...countries].sort(
        (a, b) => b.dialCode.length - a.dialCode.length,
      );
      for (const c of sorted) {
        if (value.startsWith(c.dialCode)) return c;
      }
    }
    return countryByCode.get(DEFAULT_COUNTRY_CODE)!;
  }, [value]);

  const localNumber = value
    ? value.replace(selectedCountry.dialCode, '')
    : '';

  const maxLength = Array.isArray(selectedCountry.phoneLength)
    ? selectedCountry.phoneLength[1]
    : selectedCountry.phoneLength;

  const handleLocalChange = (digits: string) => {
    const cleaned = digits.replace(/\D/g, '').slice(0, maxLength);
    onChange(selectedCountry.dialCode + cleaned);
  };

  const handleCountrySelect = (country: Country) => {
    setOpen(false);
    setSearch('');
    // Re-build E.164 with new dial code + existing local digits
    const currentLocal = localNumber.replace(/\D/g, '');
    const newMaxLength = Array.isArray(country.phoneLength)
      ? country.phoneLength[1]
      : country.phoneLength;
    onChange(country.dialCode + currentLocal.slice(0, newMaxLength));
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  const popularList = POPULAR_COUNTRIES.map(
    (code) => countryByCode.get(code)!,
  );

  return (
    <div
      className={cn(
        'flex h-8 w-full rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        disabled && 'pointer-events-none bg-input/50 opacity-50',
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex shrink-0 items-center gap-1 rounded-l-lg border-r border-input px-2 text-sm hover:bg-accent"
          >
            <span className="text-base leading-none">
              {selectedCountry.flag}
            </span>
            <span className="text-muted-foreground">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-64 p-0"
        >
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered ? (
              <>
                {filtered.length === 0 && (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No countries found
                  </p>
                )}
                {filtered.map((c) => (
                  <CountryRow
                    key={c.code}
                    country={c}
                    selected={c.code === selectedCountry.code}
                    onSelect={handleCountrySelect}
                  />
                ))}
              </>
            ) : (
              <>
                {popularList.map((c) => (
                  <CountryRow
                    key={c.code}
                    country={c}
                    selected={c.code === selectedCountry.code}
                    onSelect={handleCountrySelect}
                  />
                ))}
                <div className="my-1 h-px bg-border" />
                {countries.map((c) => (
                  <CountryRow
                    key={c.code}
                    country={c}
                    selected={c.code === selectedCountry.code}
                    onSelect={handleCountrySelect}
                  />
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <input
        type="tel"
        inputMode="numeric"
        value={localNumber}
        onChange={(e) => handleLocalChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        placeholder="Phone number"
        className="h-full w-full min-w-0 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

function CountryRow({
  country,
  selected,
  onSelect,
}: {
  country: Country;
  selected: boolean;
  onSelect: (c: Country) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(country)}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent',
        selected && 'bg-accent',
      )}
    >
      <span className="text-base leading-none">{country.flag}</span>
      <span className="truncate">{country.name}</span>
      <span className="ml-auto shrink-0 text-muted-foreground">
        {country.dialCode}
      </span>
    </button>
  );
}
