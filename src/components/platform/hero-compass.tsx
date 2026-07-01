export function HeroCompass() {
  return (
    <div className="relative mx-auto h-48 w-48 sm:h-56 sm:w-56" aria-hidden>
      <div className="absolute inset-0 rounded-full border border-[var(--primary)]/15" />
      <div className="absolute inset-3 rounded-full border border-[var(--primary)]/10" />
      <div className="absolute inset-7 rounded-full border border-[var(--primary)]/8" />
      <div className="absolute inset-11 rounded-full border border-[var(--primary)]/6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <div
          key={deg}
          className="absolute left-1/2 top-1/2 h-px w-[46%] origin-left bg-gradient-to-r from-[var(--primary)]/25 to-transparent"
          style={{ transform: `rotate(${deg}deg)` }}
        />
      ))}
      <div className="absolute left-1/2 top-1/2 h-[42%] w-[3px] -translate-x-1/2 -translate-y-full origin-bottom rotate-[35deg] rounded-full bg-[var(--primary)]" />
      <div className="absolute left-1/2 top-1/2 h-[30%] w-[3px] -translate-x-1/2 origin-bottom rotate-[215deg] rounded-full bg-[var(--warning)]" />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--panel-secondary)]" />
    </div>
  );
}
