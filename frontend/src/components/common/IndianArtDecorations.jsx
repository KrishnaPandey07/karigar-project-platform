import React from 'react';

/**
 * 1. RangoliMandala: Traditional floral and geometric Kolam / Rangoli vector artwork
 */
export function RangoliMandala({ className = 'w-24 h-24 text-amber-500/20' }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="76" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="54" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="28" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="8" fill="currentColor" />

      {/* 8 Symmetrical Lotus Petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <path
            d="M100 46 C90 60, 92 76, 100 82 C108 76, 110 60, 100 46 Z"
            fill="currentColor"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M100 16 C85 35, 90 56, 100 68 C110 56, 115 35, 100 16 Z"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="100" cy="12" r="2.5" fill="currentColor" />
          <circle cx="100" cy="38" r="1.5" fill="currentColor" />
          <circle cx="100" cy="88" r="2" fill="currentColor" />
        </g>
      ))}

      {/* Secondary diagonal decorative florets */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <path
            d="M100 30 Q94 48 100 58 Q106 48 100 30"
            stroke="currentColor"
            strokeWidth="0.9"
            fill="none"
          />
          <circle cx="100" cy="24" r="1.8" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

/**
 * 2. BandhaniRibbon: Traditional Bandhana / Bandhani tie-dye geometric diamond pattern
 */
export function BandhaniRibbon({ className = 'h-4 w-full text-amber-300' }) {
  return (
    <div className={`overflow-hidden select-none flex items-center ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 600 24"
        preserveAspectRatio="repeat-x"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <pattern id="bandhani-pattern" width="48" height="24" patternUnits="userSpaceOnUse">
          {/* Diamond motif with dots */}
          <polygon points="24,2 46,12 24,22 2,12" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.6" />
          <polygon points="24,6 38,12 24,18 10,12" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.15" />
          <circle cx="24" cy="12" r="2" fill="currentColor" />
          <circle cx="24" cy="4" r="1" fill="currentColor" />
          <circle cx="24" cy="20" r="1" fill="currentColor" />
          <circle cx="4" cy="12" r="1" fill="currentColor" />
          <circle cx="44" cy="12" r="1" fill="currentColor" />
          <circle cx="14" cy="7" r="0.8" fill="currentColor" />
          <circle cx="34" cy="7" r="0.8" fill="currentColor" />
          <circle cx="14" cy="17" r="0.8" fill="currentColor" />
          <circle cx="34" cy="17" r="0.8" fill="currentColor" />
        </pattern>
        <rect width="100%" height="24" fill="url(#bandhani-pattern)" />
      </svg>
    </div>
  );
}

/**
 * 3. WarliArtStrip: Authentic Warli folk art depicting artisans, community, music and honest craft
 */
export function WarliArtStrip({ className = 'h-12 w-full text-amber-900/40' }) {
  return (
    <div className={`overflow-x-auto overflow-y-hidden select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 800 48"
        className="w-[800px] sm:w-full h-full"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Baseline ground */}
        <line x1="0" y1="40" x2="800" y2="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 3" />

        {/* Figure 1: Artisan with hammer / tool */}
        <g transform="translate(40, 6)">
          <circle cx="10" cy="5" r="3.5" />
          <polygon points="10,9 5,20 15,20" />
          <polygon points="10,20 5,31 15,31" />
          <line x1="10" y1="31" x2="6" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="10" y1="31" x2="14" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="8" y1="13" x2="1" y2="18" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="13" x2="20" y2="8" stroke="currentColor" strokeWidth="1.8" />
          {/* Tool hammer in hand */}
          <line x1="19" y1="6" x2="23" y2="10" stroke="currentColor" strokeWidth="3" />
        </g>

        {/* Tree of Life motif */}
        <g transform="translate(100, 2)">
          <line x1="15" y1="40" x2="15" y2="10" stroke="currentColor" strokeWidth="2.5" />
          <line x1="15" y1="14" x2="6" y2="6" stroke="currentColor" strokeWidth="1.5" />
          <line x1="15" y1="14" x2="24" y2="6" stroke="currentColor" strokeWidth="1.5" />
          <line x1="15" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="1.5" />
          <line x1="15" y1="22" x2="26" y2="15" stroke="currentColor" strokeWidth="1.5" />
          <line x1="15" y1="30" x2="2" y2="24" stroke="currentColor" strokeWidth="1.5" />
          <line x1="15" y1="30" x2="28" y2="24" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="8" r="3" />
          <circle cx="5" cy="5" r="2" />
          <circle cx="25" cy="5" r="2" />
        </g>

        {/* Figure 2 & 3: Collaborative artisans / craftsman partnership */}
        <g transform="translate(170, 6)">
          <circle cx="10" cy="5" r="3.5" />
          <polygon points="10,9 5,20 15,20" />
          <polygon points="10,20 5,31 15,31" />
          <line x1="10" y1="31" x2="6" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="10" y1="31" x2="14" y2="40" stroke="currentColor" strokeWidth="1.8" />
          {/* Arms holding work */}
          <line x1="8" y1="13" x2="0" y2="10" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="13" x2="25" y2="15" stroke="currentColor" strokeWidth="1.8" />
        </g>
        <g transform="translate(205, 6)">
          <circle cx="10" cy="5" r="3.5" />
          <polygon points="10,9 5,20 15,20" />
          <polygon points="10,20 5,31 15,31" />
          <line x1="10" y1="31" x2="6" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="10" y1="31" x2="14" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="8" y1="13" x2="-10" y2="15" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="13" x2="20" y2="10" stroke="currentColor" strokeWidth="1.8" />
        </g>

        {/* Central Sun Mandala */}
        <g transform="translate(290, 8)">
          <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="16" cy="16" r="3" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line
              key={a}
              x1="16"
              y1="4"
              x2="16"
              y2="0"
              stroke="currentColor"
              strokeWidth="1.5"
              transform={`rotate(${a} 16 16)`}
            />
          ))}
        </g>

        {/* Figure 4: Musician / celebration */}
        <g transform="translate(370, 6)">
          <circle cx="10" cy="5" r="3.5" />
          <polygon points="10,9 5,20 15,20" />
          <polygon points="10,20 5,31 15,31" />
          <line x1="10" y1="31" x2="6" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="10" y1="31" x2="14" y2="40" stroke="currentColor" strokeWidth="1.8" />
          {/* Flute */}
          <line x1="8" y1="13" x2="22" y2="10" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="8" x2="26" y2="6" stroke="currentColor" strokeWidth="2.5" />
        </g>

        {/* Figure 5 & 6: Handcraft / weaving */}
        <g transform="translate(450, 6)">
          <circle cx="10" cy="5" r="3.5" />
          <polygon points="10,9 5,20 15,20" />
          <polygon points="10,20 5,31 15,31" />
          <line x1="10" y1="31" x2="7" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="10" y1="31" x2="13" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="8" y1="14" x2="1" y2="24" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="14" x2="19" y2="24" stroke="currentColor" strokeWidth="1.8" />
        </g>

        {/* Decorative pottery / vessel */}
        <g transform="translate(510, 16)">
          <path d="M6 24 C2 20, 2 12, 6 8 C9 5, 15 5, 18 8 C22 12, 22 20, 18 24 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="9" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="2" />
        </g>

        {/* Figure 7: Builder / artisan */}
        <g transform="translate(570, 6)">
          <circle cx="10" cy="5" r="3.5" />
          <polygon points="10,9 5,20 15,20" />
          <polygon points="10,20 5,31 15,31" />
          <line x1="10" y1="31" x2="6" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="10" y1="31" x2="14" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="8" y1="13" x2="3" y2="4" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="13" x2="17" y2="4" stroke="currentColor" strokeWidth="1.8" />
        </g>

        {/* Tree of Life 2 */}
        <g transform="translate(650, 2)">
          <line x1="15" y1="40" x2="15" y2="10" stroke="currentColor" strokeWidth="2.5" />
          <line x1="15" y1="14" x2="6" y2="6" stroke="currentColor" strokeWidth="1.5" />
          <line x1="15" y1="14" x2="24" y2="6" stroke="currentColor" strokeWidth="1.5" />
          <line x1="15" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="1.5" />
          <line x1="15" y1="22" x2="26" y2="15" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="8" r="3" />
        </g>

        {/* Figure 8 */}
        <g transform="translate(730, 6)">
          <circle cx="10" cy="5" r="3.5" />
          <polygon points="10,9 5,20 15,20" />
          <polygon points="10,20 5,31 15,31" />
          <line x1="10" y1="31" x2="6" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="10" y1="31" x2="14" y2="40" stroke="currentColor" strokeWidth="1.8" />
          <line x1="8" y1="13" x2="1" y2="18" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="13" x2="19" y2="18" stroke="currentColor" strokeWidth="1.8" />
        </g>
      </svg>
    </div>
  );
}

/**
 * 4. MadhubaniLotusMotif: Sacred double-outlined floral motif inspired by Mithila/Madhubani painting
 */
export function MadhubaniLotusMotif({ className = 'w-10 h-10 text-amber-600' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
      <circle cx="50" cy="50" r="41" stroke="currentColor" strokeWidth="1" />
      {/* Central Lotus */}
      <path
        d="M50 20 C42 35 44 55 50 62 C56 55 58 35 50 20 Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M50 62 C35 55 24 40 28 30 C35 34 45 48 50 62 Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M50 62 C65 55 76 40 72 30 C65 34 55 48 50 62 Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Base water wave */}
      <path
        d="M20 72 Q35 66 50 72 Q65 78 80 72"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M26 80 Q38 74 50 80 Q62 86 74 80"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="50" cy="62" r="3" fill="currentColor" />
    </svg>
  );
}

/**
 * 5. RangoliFloralDivider: Intricate repeating Kolam / Rangoli floral floor-art border
 */
export function RangoliFloralDivider({ className = 'h-5 w-full text-amber-600/30' }) {
  return (
    <div className={`overflow-hidden select-none flex items-center ${className}`} aria-hidden="true">
      <svg
        className="w-full h-full"
        viewBox="0 0 600 24"
        preserveAspectRatio="repeat-x"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <pattern id="rangoli-divider-pat" width="60" height="24" patternUnits="userSpaceOnUse">
          {/* Central 8-petaled mini rangoli floret */}
          <circle cx="30" cy="12" r="9" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
          <circle cx="30" cy="12" r="5" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.1" />
          <circle cx="30" cy="12" r="1.5" fill="currentColor" />

          {/* 4 Petals */}
          <path d="M30 3 Q27 8 30 10 Q33 8 30 3" fill="currentColor" fillOpacity="0.4" />
          <path d="M30 21 Q27 16 30 14 Q33 16 30 21" fill="currentColor" fillOpacity="0.4" />
          <path d="M21 12 Q26 9 28 12 Q26 15 21 12" fill="currentColor" fillOpacity="0.4" />
          <path d="M39 12 Q34 9 32 12 Q34 15 39 12" fill="currentColor" fillOpacity="0.4" />

          {/* Interlocking Kolam loops */}
          <path
            d="M0 12 Q15 0 30 12 Q45 24 60 12"
            stroke="currentColor"
            strokeWidth="0.9"
            fill="none"
          />
          <path
            d="M0 12 Q15 24 30 12 Q45 0 60 12"
            stroke="currentColor"
            strokeWidth="0.9"
            fill="none"
          />

          {/* Traditional Dots (Bindu) */}
          <circle cx="15" cy="6" r="1.2" fill="currentColor" />
          <circle cx="15" cy="18" r="1.2" fill="currentColor" />
          <circle cx="45" cy="6" r="1.2" fill="currentColor" />
          <circle cx="45" cy="18" r="1.2" fill="currentColor" />
        </pattern>
        <rect width="100%" height="24" fill="url(#rangoli-divider-pat)" />
      </svg>
    </div>
  );
}

/**
 * 6. RangoliCornerFiligree: Traditional 90-degree corner Rangoli motif for card corners
 */
export function RangoliCornerFiligree({ className = 'w-12 h-12 text-amber-500/30' }) {
  return (
    <svg
      viewBox="0 0 50 50"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M2 2 L48 2 M2 2 L2 48" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 10 Q10 10 10 2" stroke="currentColor" strokeWidth="1" />
      <path d="M2 20 Q20 20 20 2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 32 Q32 32 32 2" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="10" cy="10" r="2.5" fill="currentColor" fillOpacity="0.5" />
      <circle cx="18" cy="18" r="2" fill="currentColor" />
      <circle cx="26" cy="6" r="1.5" fill="currentColor" />
      <circle cx="6" cy="26" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * 7. ToranRibbon: Traditional auspicious Indian doorway Toran with mango leaves & marigold flowers
 */
export function ToranRibbon({ className = 'h-6 w-full text-amber-700/60' }) {
  return (
    <div className={`overflow-hidden select-none flex items-center ${className}`} aria-hidden="true">
      <svg
        className="w-full h-full"
        viewBox="0 0 600 24"
        preserveAspectRatio="repeat-x"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <pattern id="toran-ribbon-pat" width="40" height="24" patternUnits="userSpaceOnUse">
          {/* Hanging thread */}
          <line x1="0" y1="2" x2="40" y2="2" stroke="currentColor" strokeWidth="1.2" />

          {/* Auspicious Leaf (Amra Pallav) */}
          <path
            d="M20 3 C14 10 15 18 20 23 C25 18 26 10 20 3 Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="0.8"
          />
          <line x1="20" y1="3" x2="20" y2="22" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 1" />

          {/* Marigold flower bead */}
          <circle cx="20" cy="3" r="2.5" fill="currentColor" fillOpacity="0.8" />
          <circle cx="0" cy="2" r="1.5" fill="currentColor" />
          <circle cx="40" cy="2" r="1.5" fill="currentColor" />
        </pattern>
        <rect width="100%" height="24" fill="url(#toran-ribbon-pat)" />
      </svg>
    </div>
  );
}

/**
 * 8. DeepamLampMotif: Traditional earthen Diya / Deepam oil lamp motif symbolizing artisan illumination
 */
export function DeepamLampMotif({ className = 'w-10 h-10 text-amber-600' }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer subtle glow ring */}
      <circle cx="30" cy="30" r="27" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6" />
      {/* Diya Base */}
      <path
        d="M14 34 C16 46 44 46 46 34 C46 32 14 32 14 34 Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {/* Diya Rim filigree */}
      <path d="M12 33 Q30 36 48 33" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M18 40 Q30 45 42 40" stroke="currentColor" strokeWidth="0.8" />
      {/* Flame */}
      <path
        d="M30 10 C34 18 36 24 30 31 C24 24 26 18 30 10 Z"
        fill="currentColor"
        fillOpacity="0.55"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Inner flame core */}
      <path
        d="M30 16 C32 21 33 25 30 29 C27 25 28 21 30 16 Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      {/* Artisanal decorative dots */}
      <circle cx="30" cy="48" r="1.5" fill="currentColor" />
      <circle cx="24" cy="47" r="1" fill="currentColor" />
      <circle cx="36" cy="47" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * 9. ChowkPurnaPattern: Sacred stepped-square traditional floor art pattern
 */
export function ChowkPurnaPattern({ className = 'w-16 h-16 text-amber-700/25' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer diagonal square */}
      <rect x="15" y="15" width="70" height="70" transform="rotate(45 50 50)" stroke="currentColor" strokeWidth="1.2" />
      {/* Central inner square */}
      <rect x="25" y="25" width="50" height="50" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.05" />
      {/* Cross divisions */}
      <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
      {/* Sacred bindus */}
      <circle cx="50" cy="50" r="4" fill="currentColor" />
      <circle cx="35" cy="35" r="2.5" fill="currentColor" />
      <circle cx="65" cy="35" r="2.5" fill="currentColor" />
      <circle cx="35" cy="65" r="2.5" fill="currentColor" />
      <circle cx="65" cy="65" r="2.5" fill="currentColor" />
      {/* Corner chevrons */}
      <path d="M50 18 L42 26 M50 18 L58 26" stroke="currentColor" strokeWidth="1.2" />
      <path d="M50 82 L42 74 M50 82 L58 74" stroke="currentColor" strokeWidth="1.2" />
      <path d="M18 50 L26 42 M18 50 L26 58" stroke="currentColor" strokeWidth="1.2" />
      <path d="M82 50 L74 42 M82 50 L74 58" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * 10. SikkuKolamMotif: Continuous curved looped knot Kolam, symbol of unbroken community connection
 */
export function SikkuKolamMotif({ className = 'w-20 h-20 text-amber-700/30' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Dot Matrix (3x3 grid) */}
      {[35, 60, 85].map((x) =>
        [35, 60, 85].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="currentColor" />
        ))
      )}

      {/* Infinite Loop Ribbon Path weaving smoothly around the dots */}
      <path
        d="M60 12
           C40 12, 16 36, 16 60
           C16 84, 40 108, 60 108
           C80 108, 104 84, 104 60
           C104 36, 80 12, 60 12 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />
      <path
        d="M60 22
           C50 22, 26 42, 35 60
           C44 78, 60 70, 60 60
           C60 50, 76 42, 85 60
           C94 78, 70 98, 60 98
           C50 98, 26 78, 35 60"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* 4 Cardinal loops */}
      <path d="M60 20 C54 10, 66 10, 60 20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M60 100 C54 110, 66 110, 60 100" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 60 C10 54, 10 66, 20 60" stroke="currentColor" strokeWidth="1.5" />
      <path d="M100 60 C110 54, 110 66, 100 60" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}


