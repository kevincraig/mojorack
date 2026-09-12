interface PageDotsProps {
  count: number;
  active: number;
  onSelect: (index: number) => void;
}

export function PageDots({ count, active, onSelect }: PageDotsProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 shrink-0 py-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to page ${i + 1}`}
          onClick={() => onSelect(i)}
          className={`h-1.5 rounded-full transition-all ${
            i === active ? "w-5 bg-[var(--cyan)]" : "w-1.5 bg-[var(--line)]"
          }`}
        />
      ))}
    </div>
  );
}
