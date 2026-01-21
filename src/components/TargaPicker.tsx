import { useEffect, useMemo, useRef, useState } from "react";
import "./TargaPicker.css";

type TargaPickerProps = {
  value: string;
  onChange: (value: string) => void;
  targhe: string[];
  placeholder?: string;
  maxResults?: number;
  className?: string;
  inputClassName?: string;
};

const DEFAULT_MAX_RESULTS = 10;

export default function TargaPicker({
  value,
  onChange,
  targhe,
  placeholder,
  maxResults = DEFAULT_MAX_RESULTS,
  className,
  inputClassName,
}: TargaPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const query = value.trim().toUpperCase();
  const filtered = useMemo(() => {
    const base = query
      ? targhe.filter((t) => t.includes(query))
      : targhe;
    return base.slice(0, maxResults);
  }, [targhe, query, maxResults]);

  useEffect(() => {
    if (!open) setActiveIndex(-1);
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(filtered.length ? 0 : -1);
    }
  }, [filtered, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const handleInputChange = (next: string) => {
    onChange(next.toUpperCase());
    if (!open) setOpen(true);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((prev) => {
        if (!filtered.length) return -1;
        const next = prev < 0 ? 0 : Math.min(prev + 1, filtered.length - 1);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((prev) => {
        if (!filtered.length) return -1;
        const next = prev <= 0 ? 0 : prev - 1;
        return next;
      });
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault();
        handleSelect(filtered[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`targa-picker${className ? ` ${className}` : ""}`}
    >
      <input
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`targa-picker-input${inputClassName ? ` ${inputClassName}` : ""}`}
        autoComplete="off"
      />
      {open && (
        <div className="targa-picker-list">
          {filtered.length === 0 ? (
            <div className="targa-picker-empty">Nessun risultato</div>
          ) : (
            filtered.map((targa, index) => (
              <div
                key={targa}
                className={`targa-picker-item${
                  index === activeIndex ? " is-active" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(targa);
                }}
              >
                {targa}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
