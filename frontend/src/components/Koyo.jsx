import { useEffect, useId, useRef, useState } from 'react';

// Karakter orisinal "Koyo": pemandu showroom digital Meuble Le'Koyo.
// - berkedip otomatis & bola mata mengikuti kursor
// - ekspresi hidup berdasarkan `mood`: 'happy' | 'excited' | 'thinking' | 'talking'
// - mulut bergerak (lip-sync) saat `speaking` = true

function Eye({ cx, flip, g, excited }) {
  return (
    <g transform={`translate(${cx} 174)${flip ? ' scale(-1 1)' : ''}`}>
      <g className="koyo-blink">
        <ellipse rx="17" ry="20" fill="#fff" />
        <g className="koyo-look">
          <ellipse rx="13.5" ry="17.5" fill={`url(#${g}-iris)`} />
          <ellipse rx="6.5" ry="10.5" fill="#2b140a" />
          <ellipse cx="-4.5" cy="-8" rx={excited ? 5.2 : 4.6} ry={excited ? 6.2 : 5.6} fill="#fff" />
          <circle cx="5" cy="8" r={excited ? 3.0 : 2.4} fill="#fff" opacity=".95" />
          {excited && <circle cx="-6" cy="4" r="1.8" fill="#ffe9a0" opacity=".95" />}
        </g>
        <path d="M-19 -4 C-17 -23 9 -27 19 -12" stroke="#1d100a" strokeWidth="4.6" fill="none" strokeLinecap="round" />
        <path d="M-19 -4 L-24 -9" stroke="#1d100a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M-14 17 C-6 22 6 22 14 17" stroke="#7a4a36" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".7" />
      </g>
    </g>
  );
}

function Mouth({ state, mood }) {
  if (state === 0) {
    if (mood === 'thinking') {
      return <path d="M142 213 Q150 211 158 214" stroke="#a0453a" strokeWidth="2.6" fill="none" strokeLinecap="round" />;
    }
    if (mood === 'excited') {
      return (
        <>
          <path d="M137 209 Q150 229 163 209 Q150 214 137 209 Z" fill="#8c2f3a" />
          <ellipse cx="150" cy="221" rx="5.5" ry="2.6" fill="#ff8fa0" />
        </>
      );
    }
    return <path d="M139 210 Q150 220 161 210" stroke="#a0453a" strokeWidth="2.6" fill="none" strokeLinecap="round" />;
  }
  if (state === 1) {
    return <path d="M141 209 Q150 223 159 209 Q150 213 141 209 Z" fill="#8c2f3a" />;
  }
  return (
    <>
      <path d="M138 208 Q150 233 162 208 Q150 213 138 208 Z" fill="#7a2431" />
      <ellipse cx="150" cy="222" rx="6.5" ry="3.2" fill="#ff8fa0" />
    </>
  );
}

export default function Koyo({
  speaking = false,
  mood = 'happy',
  face = false,
  tracking = true,
  className = '',
}) {
  const g = useId().replace(/:/g, '');
  const ref = useRef(null);
  const [mouth, setMouth] = useState(0);

  // Gerak mulut (lip-sync sederhana) saat bicara
  useEffect(() => {
    if (!speaking) return undefined;
    const id = setInterval(() => setMouth(() => [1, 2, 2, 1, 0, 2][Math.floor(Math.random() * 6)]), 110);
    return () => { clearInterval(id); setMouth(0); };
  }, [speaking]);

  // Bola mata mengikuti kursor
  useEffect(() => {
    if (!tracking) return undefined;
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 420));
        const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.45)) / 320));
        el.style.setProperty('--lx', (nx * 3.6).toFixed(2));
        el.style.setProperty('--ly', (ny * 2.8).toFixed(2));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, [tracking]);

  const isExcited = mood === 'excited';
  const isThinking = mood === 'thinking';

  return (
    <svg
      ref={ref}
      viewBox={face ? '56 44 188 214' : '0 0 300 380'}
      preserveAspectRatio={face ? 'xMidYMid slice' : 'xMidYMax meet'}
      className={`koyo-svg ${face ? '' : speaking ? 'koyo-talk' : 'koyo-sway'} ${className}`}
      role="img"
      aria-label="Koyo, pemandu showroom Meuble Le'Koyo"
    >
      <defs>
        <linearGradient id={`${g}-hair`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b3220" /><stop offset="1" stopColor="#1d100a" /></linearGradient>
        <linearGradient id={`${g}-skin`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe9d8" /><stop offset="1" stopColor="#f6c9ae" /></linearGradient>
        <linearGradient id={`${g}-vest`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a4527" /><stop offset="1" stopColor="#3a2013" /></linearGradient>
        <linearGradient id={`${g}-gold`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe9a0" /><stop offset="1" stopColor="#c9a227" /></linearGradient>
        <linearGradient id={`${g}-iris`} x1="0" y1="-1" x2="0" y2="1"><stop offset="0" stopColor="#ffd884" /><stop offset=".55" stopColor="#f08a2c" /><stop offset="1" stopColor="#a8431a" /></linearGradient>
      </defs>

      {/* kuncir kembar */}
      <path d="M96 112 C52 124 22 196 34 292 C40 332 78 344 86 304 C92 268 82 226 112 168 Z" fill={`url(#${g}-hair)`} />
      <path d="M204 112 C248 124 278 196 266 292 C260 332 222 344 214 304 C208 268 218 226 188 168 Z" fill={`url(#${g}-hair)`} />
      <path d="M60 170 C50 220 54 270 64 312" stroke="#b57544" strokeOpacity=".5" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M240 170 C250 220 246 270 236 312" stroke="#b57544" strokeOpacity=".5" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="84" y="112" width="20" height="12" rx="6" transform="rotate(-18 94 118)" fill={`url(#${g}-gold)`} />
      <rect x="196" y="112" width="20" height="12" rx="6" transform="rotate(18 206 118)" fill={`url(#${g}-gold)`} />

      {/* rambut belakang */}
      <path d="M86 150 C80 88 112 58 150 58 C188 58 220 88 214 150 C218 204 204 250 188 266 L112 266 C96 250 82 204 86 150 Z" fill={`url(#${g}-hair)`} />

      {/* badan */}
      <path d="M44 380 C44 316 88 280 150 276 C212 280 256 316 256 380 Z" fill={`url(#${g}-vest)`} />
      <path d="M104 290 C96 322 92 350 90 380" stroke={`url(#${g}-gold)`} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M196 290 C204 322 208 350 210 380" stroke={`url(#${g}-gold)`} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M118 276 L150 330 L182 276 C170 270 130 270 118 276 Z" fill="#fff3e4" />
      <path d="M118 276 L106 300 L140 304 Z" fill="#ffe6cc" />
      <path d="M182 276 L194 300 L160 304 Z" fill="#ffe6cc" />
      <path d="M150 304 L124 292 C120 300 120 312 124 320 Z" fill="#ff9d3d" />
      <path d="M150 304 L176 292 C180 300 180 312 176 320 Z" fill="#ff9d3d" />
      <rect x="143" y="296" width="14" height="16" rx="5" fill="#e07f1f" />
      <rect x="190" y="334" width="38" height="20" rx="5" fill="#3a2518" stroke="#C9A227" strokeWidth="1.4" />
      <text x="209" y="348" fontSize="9" fontWeight="700" textAnchor="middle" fill="#C9A227" fontFamily="Arial, sans-serif">KOYO</text>

      {/* leher */}
      <path d="M134 224 L134 268 C134 282 166 282 166 268 L166 224 Z" fill="#f2c2a5" />
      <path d="M134 246 C142 256 158 256 166 246 L166 232 L134 232 Z" fill="#e3a98a" opacity=".6" />

      {/* wajah */}
      <path d="M97 152 C97 112 120 92 150 92 C180 92 203 112 203 152 C203 192 182 232 150 240 C118 232 97 192 97 152 Z" fill={`url(#${g}-skin)`} />
      <ellipse cx="114" cy="196" rx={isExcited ? 14 : 12} ry={isExcited ? 7.5 : 6.5} fill="#ff8c9a" opacity={isExcited ? '.52' : '.38'} />
      <ellipse cx="186" cy="196" rx={isExcited ? 14 : 12} ry={isExcited ? 7.5 : 6.5} fill="#ff8c9a" opacity={isExcited ? '.52' : '.38'} />

      <Eye cx={125} g={g} excited={isExcited} />
      <Eye cx={175} g={g} flip excited={isExcited} />

      {/* alis dinamis sesuai mood */}
      {isThinking ? (
        <>
          <path d="M107 143 Q123 136 140 142" stroke="#3a2013" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M160 136 Q178 128 194 139" stroke="#3a2013" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : isExcited ? (
        <>
          <path d="M106 137 Q122 125 140 134" stroke="#3a2013" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M160 134 Q178 125 194 137" stroke="#3a2013" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M106 142 Q122 132 140 139" stroke="#3a2013" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M160 139 Q178 132 194 142" stroke="#3a2013" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      <path d="M149 200 Q151 204 153 202" stroke="#d29a80" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Mouth state={mouth} mood={mood} />

      {/* poni & rambut samping */}
      <path d="M94 158 C84 98 112 62 150 62 C188 62 216 98 206 158 C202 140 198 128 190 118 C188 134 182 144 172 148 C170 134 164 122 156 116 C152 128 146 138 138 142 C130 134 120 128 112 126 C104 132 98 144 94 158 Z" fill={`url(#${g}-hair)`} />
      <path d="M112 84 C128 70 150 68 168 74" stroke="#d09a68" strokeOpacity=".65" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M94 158 C88 198 92 228 104 250 C102 222 104 196 112 164 Z" fill={`url(#${g}-hair)`} />
      <path d="M206 158 C212 198 208 228 196 250 C198 222 196 196 188 164 Z" fill={`url(#${g}-hair)`} />

      {/* jepit daun emas */}
      <path d="M112 100 C120 84 138 82 144 90 C136 104 122 108 112 100 Z" fill={`url(#${g}-gold)`} />
      <path d="M114 100 C124 94 134 92 142 90" stroke="#a07a10" strokeWidth="1.2" fill="none" />

      {/* headset */}
      <path d="M92 150 C90 84 112 54 150 54 C188 54 210 84 208 150" stroke="#5a4030" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M92 150 C90 84 112 54 150 54 C188 54 210 84 208 150" stroke="#C9A227" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".9" />
      <rect x="84" y="140" width="15" height="34" rx="7" fill="#4a3426" stroke="#C9A227" strokeWidth="1.6" />
      <rect x="201" y="140" width="15" height="34" rx="7" fill="#4a3426" stroke="#C9A227" strokeWidth="1.6" />
      <circle cx="91.5" cy="157" r="3" fill="#C9A227" />
      <circle cx="208.5" cy="157" r="3" fill="#C9A227" />
      <path d="M208 172 C212 204 196 224 172 222" stroke="#5a4030" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx="170" cy="222" r="4.4" fill="#4a3426" stroke="#C9A227" strokeWidth="1.6" />

      {/* kilau bintang kecil saat bersemangat */}
      {isExcited && (
        <g fill="#C9A227">
          <path d="M72 86 L75 94 L83 97 L75 100 L72 108 L69 100 L61 97 L69 94 Z" />
          <path d="M226 74 L228 80 L234 82 L228 84 L226 90 L224 84 L218 82 L224 80 Z" opacity=".85" />
        </g>
      )}
    </svg>
  );
}
