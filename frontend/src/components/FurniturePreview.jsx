import { useId } from 'react';
import { motion } from 'framer-motion';
import { CUSHION_COLORS, FINISHES, getKamarLayout } from '../data/custom';

const CX = 210;
const FLOOR = 246;
const sp = { type: 'spring', stiffness: 220, damping: 26 };

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, v + amt));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
}

function R({ x, y, w, h, fill, rx = 0, stroke, sw = 0, dash, opacity }) {
  return (
    <motion.rect
      initial={false}
      animate={{ x, y, width: Math.max(w, 0), height: Math.max(h, 0) }}
      transition={sp}
      rx={rx}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeDasharray={dash}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
}

function E({ cx, cy, rx, ry, fill, stroke, sw = 0, dash, opacity }) {
  return (
    <motion.ellipse
      initial={false}
      animate={{ cx, cy, rx: Math.max(rx, 0), ry: Math.max(ry, 0) }}
      transition={sp}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeDasharray={dash}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
}

function HDim({ x1, x2, y, label }) {
  return (
    <g stroke="#8C7A6B" strokeWidth="1.2" fill="none">
      <line x1={x1} x2={x2} y1={y} y2={y} />
      <line x1={x1} x2={x1} y1={y - 5} y2={y + 5} />
      <line x1={x2} x2={x2} y1={y - 5} y2={y + 5} />
      <text x={(x1 + x2) / 2} y={y + 15} textAnchor="middle" fill="#5E4B3E" stroke="none" fontSize="11.5" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

function VDim({ y1, y2, x, label }) {
  return (
    <g stroke="#8C7A6B" strokeWidth="1.2" fill="none">
      <line x1={x} x2={x} y1={y1} y2={y2} />
      <line x1={x - 5} x2={x + 5} y1={y1} y2={y1} />
      <line x1={x - 5} x2={x + 5} y1={y2} y2={y2} />
      <text x={x + 8} y={(y1 + y2) / 2 + 4} fill="#5E4B3E" stroke="none" fontSize="11.5" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

const Shadow = ({ w }) => <ellipse cx={CX} cy={FLOOR + 2} rx={w / 2 + 14} ry="7.5" fill="rgba(43,33,25,.15)" />;

function HumanScale({ scale, x }) {
  const h = 170 * scale;
  const top = FLOOR - h;
  const headR = Math.max(4.5, 10.5 * scale);
  const col = 'rgba(122,74,43,0.20)';
  return (
    <g>
      <circle cx={x} cy={top + headR} r={headR} fill={col} />
      <rect x={x - headR * 1.15} y={top + headR * 2.15} width={headR * 2.3} height={h * 0.42} rx={headR * 0.7} fill={col} />
      <rect x={x - headR * 0.95} y={top + headR * 2.15 + h * 0.39} width={headR * 0.8} height={h * 0.48} rx={headR * 0.35} fill={col} />
      <rect x={x + headR * 0.15} y={top + headR * 2.15 + h * 0.39} width={headR * 0.8} height={h * 0.48} rx={headR * 0.35} fill={col} />
      <text x={x} y={top - 5} textAnchor="middle" fill="#7A6A5C" fontSize="9.5" fontWeight="600">
        170 cm
      </text>
    </g>
  );
}

/* ================================================================== */
/* KOMPONEN UKIRAN JEPARA ASLI (SULUR DAUN, BUNGA, MAHKOTA, CABRIOLE) */
/* ================================================================== */

// 1. Pita Ukiran Sulur Daun & Bunga Tengah (untuk apron meja, lis atas lemari/ranjang)
function JeparaScrollBorder({ cx, cy, width, height = 14, dark, light }) {
  const sx = Math.max(0.28, width / 180);
  const sy = Math.max(0.42, height / 20);
  const scrollHalf =
    'M10 0 C18 -9 30 -9 37 -1 C42 4 36 8 31 5 C28 3 30 -2 34 -1 ' +
    'M37 -1 C48 -10 62 -10 72 -1 C78 5 72 9 67 6 ' +
    'M46 2 C54 9 64 8 72 1 M72 -1 C79 -8 86 -6 88 0 C85 5 79 6 74 2';
  const leafHalf =
    'M16 -2 C22 -11 31 -11 35 -4 C29 -5 22 -4 16 -2 Z ' +
    'M48 -3 C55 -11 64 -10 69 -3 C62 -5 55 -4 48 -3 Z';
  const flower =
    'M0 -8 C3 -4 3 -1 0 0 C-3 -1 -3 -4 0 -8 Z ' +
    'M0 8 C3 4 3 1 0 0 C-3 1 -3 4 0 8 Z ' +
    'M-9 0 C-5 -3 -2 -3 0 0 C-2 3 -5 3 -9 0 Z ' +
    'M9 0 C5 -3 2 -3 0 0 C2 3 5 3 9 0 Z';

  return (
    <g transform={`translate(${cx} ${cy}) scale(${sx} ${sy})`}>
      {/* Bayangan pahatan relief */}
      <g transform="translate(0 1.2)" fill="none" stroke={dark} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity=".88">
        <path d={scrollHalf} />
        <g transform="scale(-1 1)"><path d={scrollHalf} /></g>
      </g>
      {/* Daun pahatan & bunga tengah */}
      <g fill={light} stroke={dark} strokeWidth="1" opacity=".92">
        <path d={leafHalf} />
        <g transform="scale(-1 1)"><path d={leafHalf} /></g>
        <path d={flower} fill={light} />
      </g>
      {/* Garis sulur ukel timbul */}
      <g fill="none" stroke={light} strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
        <path d={scrollHalf} />
        <g transform="scale(-1 1)"><path d={scrollHalf} /></g>
      </g>
      <circle cx="0" cy="0" r="2.2" fill={dark} />
    </g>
  );
}

// 2. Mahkota Ukir Jepara / Gunungan (untuk atas lemari, kursi ukir, kepala ranjang, cermin)
function JeparaCrest({ cx, y, width, height = 22, fill, dark, light }) {
  const sx = Math.max(0.25, width / 140);
  const sy = Math.max(0.35, height / 28);
  const body =
    'M-68 0 C-56 -2 -48 -14 -34 -12 C-22 -10 -16 -24 0 -27 ' +
    'C16 -24 22 -10 34 -12 C48 -14 56 -2 68 0 Z';
  const flourish =
    'M6 -6 C14 -16 24 -15 30 -8 C35 -3 42 -9 48 -6 C54 -3 58 -1 62 0 ' +
    'M14 -12 C18 -19 26 -18 27 -12';
  return (
    <g transform={`translate(${cx} ${y}) scale(${sx} ${sy})`}>
      <path d={body} fill={fill} stroke={dark} strokeWidth="1.6" strokeLinejoin="round" />
      <g fill="none" stroke={dark} strokeWidth="2" strokeLinecap="round" transform="translate(0 0.8)">
        <path d={flourish} />
        <g transform="scale(-1 1)"><path d={flourish} /></g>
      </g>
      <g fill="none" stroke={light} strokeWidth="1.35" strokeLinecap="round">
        <path d={flourish} />
        <g transform="scale(-1 1)"><path d={flourish} /></g>
      </g>
      {/* Kuncup bunga teratai puncak mahkota */}
      <path d="M0 -23 C4 -17 4 -11 0 -7 C-4 -11 -4 -17 0 -23 Z" fill={light} stroke={dark} strokeWidth="1" />
      <path d="M-8 -13 C-4 -16 -1 -12 0 -8 C1 -12 4 -16 8 -13 C5 -8 2 -7 0 -7 C-2 -7 -5 -8 -8 -13 Z" fill={light} stroke={dark} strokeWidth="0.9" />
    </g>
  );
}

// 3. Medali Ukiran Panel Tengah + Sulur Sudut (untuk pintu lemari, sandaran kursi, kepala ranjang)
function JeparaPanelMedallion({ cx, cy, w, h, dark, light }) {
  const s = Math.max(0.24, Math.min(w / 62, h / 78));
  const petal =
    'M0 -22 C7 -14 8 -6 0 0 C-8 -6 -7 -14 0 -22 Z ' +
    'M0 22 C7 14 8 6 0 0 C-8 6 -7 14 0 22 Z ' +
    'M-18 0 C-11 -6 -5 -6 0 0 C-5 6 -11 6 -18 0 Z ' +
    'M18 0 C11 -6 5 -6 0 0 C5 6 11 6 18 0 Z';
  const vine =
    'M5 -10 C14 -20 22 -18 22 -8 C22 -2 15 0 12 -4 ' +
    'M5 10 C14 20 22 18 22 8 C22 2 15 0 12 4';
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <g fill="none" stroke={dark} strokeWidth="2.4" strokeLinecap="round" transform="translate(0 1)">
        <path d={vine} />
        <g transform="scale(-1 1)"><path d={vine} /></g>
      </g>
      <g fill="none" stroke={light} strokeWidth="1.5" strokeLinecap="round">
        <path d={vine} />
        <g transform="scale(-1 1)"><path d={vine} /></g>
      </g>
      <path d={petal} fill={light} stroke={dark} strokeWidth="1.2" opacity=".92" />
      <circle cx="0" cy="0" r="3.4" fill={dark} />
      <circle cx="0" cy="0" r="1.4" fill={light} />
    </g>
  );
}

// 4. Ornamen Sudut Ukir Lengkung (untuk sudut bingkai cermin & pintu lemari)
function JeparaCorner({ x, y, sx = 1, sy = 1, size = 16, dark, light }) {
  const sc = size / 24;
  const p =
    'M0 0 L22 0 C17 3 13 6 11 10 C9 6 6 9 10 11 C6 13 3 17 0 22 Z ' +
    'M4 4 C10 4 14 8 15 14 M4 4 C4 10 8 14 14 15';
  return (
    <g transform={`translate(${x} ${y}) scale(${sx * sc} ${sy * sc})`}>
      <path d={p} fill={light} stroke={dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".92" />
    </g>
  );
}

// 5. Kaki Lengkung Ukir Klasik (Cabriole) untuk meja & kursi ukir
function CarvedCabrioleLeg({ x, y, w, h, flip = false, fill, dark, light }) {
  const cx = x + w / 2;
  const dir = flip ? -1 : 1;
  const p = [
    `M${cx - w * 0.55 * dir} ${y}`,
    `L${cx + w * 0.55 * dir} ${y}`,
    `C${cx + w * 0.72 * dir} ${y + h * 0.22} ${cx + w * 0.12 * dir} ${y + h * 0.62} ${cx + w * 0.36 * dir} ${y + h * 0.92}`,
    `C${cx + w * 0.48 * dir} ${y + h} ${cx + w * 0.05 * dir} ${y + h} ${cx - w * 0.22 * dir} ${y + h}`,
    `C${cx - w * 0.35 * dir} ${y + h * 0.88} ${cx - w * 0.16 * dir} ${y + h * 0.52} ${cx - w * 0.52 * dir} ${y + h * 0.22}`,
    'Z',
  ].join(' ');
  const scroll = `M${cx - w * 0.2 * dir} ${y + h * 0.12} C${cx + w * 0.32 * dir} ${y + h * 0.18} ${cx + w * 0.25 * dir} ${y + h * 0.34} ${cx - w * 0.05 * dir} ${y + h * 0.36}`;
  return (
    <g>
      <path d={p} fill={fill} stroke={dark} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={scroll} fill="none" stroke={light} strokeWidth="1.4" strokeLinecap="round" opacity=".9" />
    </g>
  );
}

/* ================================================================== */
/* 1. MEJA (Tampak Depan & Tampak Samping)                             */
/* ================================================================== */
function Meja({ dims, o, c, sheen, view, showScale, pid }) {
  const { w = 160, d = 85, h = 75 } = dims;
  const isSide = view === 'side';
  const span = isSide ? d : w;
  const s = Math.min(280 / span, 155 / h, 2.4);
  const W = span * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const th = Math.max(8, 4.2 * s);
  const lw = Math.max(8, (o.kaki === 'Ukir Klasik' ? 9 : 6) * s);
  const legH = H - th;
  const apronH = Math.min(16 * s, legH * 0.36);
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.ukiran === 'Ukiran Jepara';
  const hasDrawers = !isSide && o.laci === '2 Laci';

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(36, x0 - 38)} />}
      <Shadow w={W} />

      {/* Model Kaki */}
      {o.kaki === 'Silang (X)' ? (
        <g stroke={shade(c, -22)} strokeWidth={Math.max(7, lw * 1.1)} strokeLinecap="round">
          <line x1={x0 + 14} y1={top + th + 2} x2={x0 + W * 0.32} y2={FLOOR - 2} />
          <line x1={x0 + W * 0.32} y1={top + th + 2} x2={x0 + 14} y2={FLOOR - 2} />
          <line x1={x0 + W - 14} y1={top + th + 2} x2={x0 + W * 0.68} y2={FLOOR - 2} />
          <line x1={x0 + W * 0.68} y1={top + th + 2} x2={x0 + W - 14} y2={FLOOR - 2} />
        </g>
      ) : o.kaki === 'Ukir Klasik' ? (
        <>
          <CarvedCabrioleLeg x={x0 + 6} y={top + th} w={lw} h={legH} fill={shade(c, -16)} dark={dark} light={light} />
          <CarvedCabrioleLeg x={x0 + W - 6 - lw} y={top + th} w={lw} h={legH} flip fill={shade(c, -16)} dark={dark} light={light} />
        </>
      ) : (
        <>
          <R x={x0 + 6} y={top + th} w={lw} h={legH} fill={shade(c, -20)} rx={1.5} />
          <R x={x0 + W - 6 - lw} y={top + th} w={lw} h={legH} fill={shade(c, -20)} rx={1.5} />
        </>
      )}

      {/* Apron (dengan lekuk ukir Jepara asli jika dipilih!) */}
      {isCarved ? (
        <path
          d={`M${x0 + 6 + lw} ${top + th} L${x0 + W - 6 - lw} ${top + th} L${x0 + W - 6 - lw} ${top + th + apronH + 3} Q${CX + W * 0.2} ${top + th + apronH - 3} ${CX} ${top + th + apronH + 8} Q${CX - W * 0.2} ${top + th + apronH - 3} ${x0 + 6 + lw} ${top + th + apronH + 3} Z`}
          fill={shade(c, -10)}
          stroke={dark}
          strokeWidth="1.2"
        />
      ) : (
        <R x={x0 + 6 + lw} y={top + th} w={W - 12 - 2 * lw} h={apronH} fill={shade(c, -10)} />
      )}

      {/* Laci (2 laci) */}
      {hasDrawers &&
        [0, 1].map((i) => {
          const areaW = W - 24 - 2 * lw;
          const dw = areaW / 2 - 4;
          const dx = x0 + 12 + lw + i * (areaW / 2) + 2;
          return (
            <g key={i}>
              <R x={dx} y={top + th + 2} w={dw} h={apronH - 4} fill={shade(c, 8)} stroke={dark} sw={1.2} rx={2} />
              <circle cx={dx + dw / 2} cy={top + th + apronH / 2} r="2.8" fill="#C9A227" />
            </g>
          );
        })}

      {/* Ukiran Sulur Jepara Asli di Apron Meja */}
      {isCarved && !hasDrawers && (
        <JeparaScrollBorder
          cx={CX}
          cy={top + th + apronH * 0.56}
          width={Math.max(55, W - 26 - 2 * lw)}
          height={Math.max(11, apronH * 0.72)}
          dark={dark}
          light={light}
        />
      )}

      {/* Rak Bawah */}
      {o.rakBawah && (
        <R x={x0 + 6 + lw} y={FLOOR - legH * 0.28} w={W - 12 - 2 * lw} h={Math.max(5, 3 * s)} fill={shade(c, -6)} stroke={dark} sw={1} />
      )}

      {/* Daun Meja + Tekstur Serat Jati + Kilau */}
      <R x={x0 - 4} y={top} w={W + 8} h={th} fill={`url(#${pid}-wood)`} stroke={dark} sw={1} rx={3} />
      {sheen === 'glossy' && <R x={x0} y={top + 1.5} w={W} h={Math.max(2, th * 0.3)} fill="#fff" opacity={0.34} rx={3} />}

      <HDim x1={x0 - 4} x2={x0 + W + 4} y={FLOOR + 14} label={isSide ? `Lebar ${d} cm` : `Panjang ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 16} label={`T ${h} cm`} />
    </g>
  );
}

/* ================================================================== */
/* 2. KURSI (Tampak Depan & Tampak Samping)                            */
/* ================================================================== */
function Kursi({ dims, o, c, sheen, view, showScale, pid }) {
  const { w = 52, h = 96 } = dims;
  const d = 50;
  const seatH = 45;
  const isSide = view === 'side';
  const span = isSide ? d : w;
  const s = Math.min(240 / span, 158 / h, 2.4);
  const W = span * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const topY = FLOOR - H;
  const seatY = FLOOR - seatH * s;
  const th = Math.max(6, 4 * s);
  const pw = Math.max(6, 4.2 * s);
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const backH = 0.78 * (h - seatH) * s;
  const isCarved = o.ukiran === 'Ukiran Jepara';
  const kainHex = CUSHION_COLORS.find((x) => x.key === o.warnaKain)?.hex || '#EBE0CC';

  if (isSide) {
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(36, x0 - 40)} />}
        <Shadow w={W} />
        <R x={x0} y={topY} w={pw} h={H} fill={shade(c, -20)} rx={2} />
        {isCarved ? (
          <CarvedCabrioleLeg x={x0 + W - pw} y={seatY + th} w={pw * 1.15} h={FLOOR - seatY - th} flip fill={shade(c, -16)} dark={dark} light={light} />
        ) : (
          <R x={x0 + W - pw} y={seatY} w={pw} h={FLOOR - seatY} fill={shade(c, -20)} rx={2} />
        )}
        {o.armrest && (
          <>
            <R x={x0 + pw} y={seatY - 21 * s} w={W - pw} h={pw * 0.9} fill={shade(c, 8)} stroke={dark} sw={0.8} rx={3} />
            <R x={x0 + W - pw} y={seatY - 21 * s} w={pw} h={21 * s} fill={shade(c, -20)} rx={2} />
          </>
        )}
        <R x={x0} y={seatY} w={W + 2} h={th} fill={`url(#${pid}-wood)`} stroke={dark} sw={1} rx={2} />
        {o.bantalan === 'Pakai Jok' && (
          <R x={x0 + pw} y={seatY - 6 * s} w={W - pw} h={6 * s} fill={kainHex} stroke={shade(kainHex, -25)} sw={1} rx={5} />
        )}
        <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Kedalaman ±${d} cm`} />
        <VDim y1={topY} y2={FLOOR} x={x0 + W + 14} label={`T ${h} cm`} />
      </g>
    );
  }

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(36, x0 - 40)} />}
      <Shadow w={W} />

      {/* Tiang & Kaki */}
      <R x={x0} y={topY + 4} w={pw} h={seatY - topY} fill={shade(c, -20)} rx={2} />
      <R x={x0 + W - pw} y={topY + 4} w={pw} h={seatY - topY} fill={shade(c, -20)} rx={2} />
      {isCarved ? (
        <>
          <CarvedCabrioleLeg x={x0} y={seatY + th} w={pw * 1.1} h={FLOOR - seatY - th} fill={shade(c, -16)} dark={dark} light={light} />
          <CarvedCabrioleLeg x={x0 + W - pw * 1.1} y={seatY + th} w={pw * 1.1} h={FLOOR - seatY - th} flip fill={shade(c, -16)} dark={dark} light={light} />
        </>
      ) : (
        <>
          <R x={x0} y={seatY + th} w={pw} h={FLOOR - seatY - th} fill={shade(c, -20)} rx={2} />
          <R x={x0 + W - pw} y={seatY + th} w={pw} h={FLOOR - seatY - th} fill={shade(c, -20)} rx={2} />
        </>
      )}

      {/* Mahkota Ukiran Jepara di Puncak Sandaran */}
      {isCarved && (
        <JeparaCrest cx={CX} y={topY + 6} width={W * 0.96} height={Math.max(15, 16 * s * 0.65)} fill={`url(#${pid}-wood)`} dark={dark} light={light} />
      )}

      {/* Sandaran */}
      <R
        x={x0 + pw}
        y={topY + 5}
        w={W - 2 * pw}
        h={backH}
        fill={o.sandaran === 'Anyaman Rotan' ? '#DFC293' : `url(#${pid}-wood)`}
        stroke={dark}
        sw={1.2}
        rx={4}
      />
      {o.sandaran === 'Jeruji' && (
        <g stroke={dark} strokeWidth="1.8">
          {[-2, -1, 0, 1, 2].map((i) => (
            <line key={i} x1={CX + i * W * 0.14} x2={CX + i * W * 0.14} y1={topY + 9} y2={topY + backH} />
          ))}
        </g>
      )}
      {o.sandaran === 'Anyaman Rotan' && (
        <R x={x0 + pw + 4} y={topY + 9} w={W - 2 * pw - 8} h={backH - 8} fill="none" stroke="#9C753C" sw={1.2} dash="3 3" rx={2} />
      )}
      {/* Medali Ukiran Jepara di Tengah Sandaran */}
      {isCarved && (
        <JeparaPanelMedallion
          cx={CX}
          cy={topY + 5 + backH / 2}
          w={W - 2 * pw - 8}
          h={backH - 10}
          dark={dark}
          light={light}
        />
      )}

      {/* Armrest */}
      {o.armrest && (
        <>
          <R x={x0 - pw * 0.45} y={seatY - 20 * s} w={pw * 1.45} h={20 * s} fill={shade(c, -8)} stroke={dark} sw={0.8} rx={3} />
          <R x={x0 + W - pw} y={seatY - 20 * s} w={pw * 1.45} h={20 * s} fill={shade(c, -8)} stroke={dark} sw={0.8} rx={3} />
        </>
      )}

      {/* Dudukan & Apron Ukir */}
      <R x={x0 - 2} y={seatY} w={W + 4} h={th} fill={`url(#${pid}-wood)`} stroke={dark} sw={1} rx={2} />
      {isCarved && (
        <JeparaScrollBorder cx={CX} cy={seatY + th + 6} width={W - 16} height={10} dark={dark} light={light} />
      )}
      {sheen === 'glossy' && <R x={x0} y={seatY + 1} w={W} h={2} fill="#fff" opacity=".34" />}
      {o.bantalan === 'Pakai Jok' && (
        <R x={x0 + 3} y={seatY - 6 * s} w={W - 6} h={6 * s} fill={kainHex} stroke={shade(kainHex, -25)} sw={1.1} rx={6} />
      )}

      <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Lebar ${w} cm`} />
      <VDim y1={topY} y2={FLOOR} x={x0 + W + 14} label={`T ${h} cm`} />
    </g>
  );
}

/* ================================================================== */
/* 3. LEMARI (Tampak Depan & Tata Ruang Dalam)                         */
/* ================================================================== */
function Lemari({ dims, o, c, sheen, view, showScale, pid }) {
  const { w = 155, h = 205, d = 58 } = dims;
  const s = Math.min(275 / w, 165 / h, 2.0);
  const W = w * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const n = Number(o.pintu || 3);
  const plinth = Math.max(6, 6 * s);
  const crownH = Math.max(7, 5 * s);
  const drawerH = o.laci ? Math.min(24 * s, H * 0.2) : 0;
  const bodyH = H - plinth;
  const doorsH = bodyH - drawerH - crownH - 4;
  const doorW = (W - 8) / n;
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.ukiran === 'Ukiran Jepara';

  // Tab kedua khusus Lemari: Tata Ruang Dalam (bersih & mudah dimengerti!)
  if (view === 'side') {
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(30, x0 - 34)} />}
        <Shadow w={W} />
        <R x={x0} y={top} w={W} h={H} fill="#F5ECD9" stroke={dark} sw={2} rx={2} />
        <R x={x0 - 3} y={top - 1} w={W + 6} h={crownH} fill={shade(c, 8)} stroke={dark} sw={1.2} rx={2} />
        {Array.from({ length: n }).map((_, i) => {
          const dx = x0 + 4 + i * doorW;
          const isHanging = i < Math.ceil(n / 2);
          return (
            <g key={i}>
              <R x={dx + 1} y={top + crownH + 2} w={doorW - 2} h={doorsH} fill="#FAF4E8" stroke={shade(c, -15)} sw={1.2} />
              {isHanging ? (
                <>
                  <line x1={dx + 6} x2={dx + doorW - 6} y1={top + crownH + 22} y2={top + crownH + 22} stroke="#8C6239" strokeWidth="3" strokeLinecap="round" />
                  <text x={dx + doorW / 2} y={top + crownH + 40} textAnchor="middle" fill="#7A4A2B" fontSize="8.5" fontWeight="700">
                    GANTUNGAN
                  </text>
                  <line x1={dx + 4} x2={dx + doorW - 4} y1={top + crownH + doorsH * 0.78} y2={top + crownH + doorsH * 0.78} stroke={shade(c, -15)} strokeWidth="2.2" />
                </>
              ) : (
                [0.2, 0.4, 0.6, 0.8].map((r) => (
                  <line key={r} x1={dx + 4} x2={dx + doorW - 4} y1={top + crownH + doorsH * r} y2={top + crownH + doorsH * r} stroke={shade(c, -15)} strokeWidth="2.2" />
                ))
              )}
            </g>
          );
        })}
        {o.laci && (
          <R x={x0 + 5} y={top + bodyH - drawerH} w={W - 10} h={drawerH - 2} fill="#EFE2C6" stroke={shade(c, -15)} sw={1.2} />
        )}
        <text x={CX} y={top - 8} textAnchor="middle" fill="#7A4A2B" fontSize="10" fontWeight="700">
          ILUSTRASI TATA RUANG DALAM (BISA REQUEST SEKAT)
        </text>
        <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`L ${w} cm · Kedalaman ${d} cm`} />
        <VDim y1={top} y2={FLOOR} x={x0 + W + 14} label={`T ${h} cm`} />
      </g>
    );
  }

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(30, x0 - 34)} />}
      <Shadow w={W} />
      <R x={x0 + 3} y={FLOOR - plinth} w={W - 6} h={plinth} fill={dark} />
      <R x={x0} y={top} w={W} h={bodyH} fill={shade(c, -8)} stroke={dark} sw={1.3} rx={2} />

      {/* Mahkota Ukiran Jepara di Puncak Lemari */}
      {isCarved && (
        <JeparaCrest cx={CX} y={top} width={W * 0.92} height={22} fill={`url(#${pid}-wood)`} dark={dark} light={light} />
      )}

      {/* Lis Mahkota Atas */}
      <R x={x0 - (isCarved ? 6 : 2)} y={top - 1} w={W + (isCarved ? 12 : 4)} h={crownH} fill={shade(c, 12)} stroke={dark} sw={1.1} rx={2} />

      {/* Rel Pintu Geser */}
      {o.mekanisme === 'Geser (Sliding)' && (
        <line x1={x0 + 4} x2={x0 + W - 4} y1={top + crownH + 1} y2={top + crownH + 1} stroke="#3A2518" strokeWidth="2.4" />
      )}

      {/* Daun Pintu */}
      {Array.from({ length: n }).map((_, i) => {
        const dx = x0 + 4 + i * doorW;
        const dy = top + crownH + 3;
        const isMid = i === Math.floor(n / 2);
        const isMirror = o.cermin && isMid;
        const hx = i % 2 === 0 ? dx + doorW - 7 : dx + 7;

        return (
          <g key={i}>
            <R
              x={dx + 1}
              y={dy}
              w={doorW - 2}
              h={doorsH}
              fill={isMirror ? `url(#${pid}-glass)` : `url(#${pid}-wood)`}
              stroke={dark}
              sw={1.3}
              rx={2}
            />
            {isMirror && (
              <g stroke="#fff" strokeWidth="2.8" opacity=".68" strokeLinecap="round">
                <line x1={dx + doorW * 0.22} x2={dx + doorW * 0.52} y1={dy + doorsH * 0.16} y2={dy + doorsH * 0.06} />
                <line x1={dx + doorW * 0.18} x2={dx + doorW * 0.62} y1={dy + doorsH * 0.34} y2={dy + doorsH * 0.14} />
              </g>
            )}
            {!isMirror && (
              <R x={dx + 5} y={dy + 7} w={doorW - 10} h={doorsH - 14} fill="none" stroke={dark} sw={1} rx={2} opacity=".7" />
            )}
            {/* Ukiran Jepara Asli di Daun Pintu (Medali Bunga + Ornamen Sudut) */}
            {!isMirror && isCarved && (
              <>
                <JeparaPanelMedallion cx={dx + doorW / 2} cy={dy + doorsH / 2} w={doorW - 12} h={doorsH * 0.48} dark={dark} light={light} />
                <JeparaCorner x={dx + 6} y={dy + 8} size={11} dark={dark} light={light} />
                <JeparaCorner x={dx + doorW - 6} y={dy + 8} sx={-1} size={11} dark={dark} light={light} />
                <JeparaCorner x={dx + 6} y={dy + doorsH - 8} sy={-1} size={11} dark={dark} light={light} />
                <JeparaCorner x={dx + doorW - 6} y={dy + doorsH - 8} sx={-1} sy={-1} size={11} dark={dark} light={light} />
              </>
            )}
            <rect x={hx - 1.5} y={dy + doorsH * 0.44} width="3" height="16" rx="1.5" fill="#C9A227" />
          </g>
        );
      })}

      {/* Laci Bawah */}
      {o.laci &&
        [0, 1].map((i) => {
          const dw = (W - 8) / 2;
          const dx = x0 + 4 + i * dw;
          return (
            <g key={i}>
              <R x={dx + 1} y={top + bodyH - drawerH - 1} w={dw - 2} h={drawerH - 2} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} rx={2} />
              {isCarved && (
                <JeparaScrollBorder cx={dx + dw / 2} cy={top + bodyH - drawerH / 2 - 1} width={dw - 14} height={9} dark={dark} light={light} />
              )}
              <circle cx={dx + dw / 2} cy={top + bodyH - drawerH / 2 - 1} r="2.6" fill="#C9A227" />
            </g>
          );
        })}

      {sheen === 'glossy' && <R x={x0 + 4} y={top + crownH + 3} w={W * 0.24} h={doorsH} fill="#fff" opacity=".13" />}

      <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Lebar ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 14} label={`T ${h} cm`} />
    </g>
  );
}

/* ================================================================== */
/* 4. CERMIN (Tampak Depan & Tampak Samping)                           */
/* ================================================================== */
function Cermin({ dims, o, c, view, showScale, pid }) {
  const { w = 75, h = 160 } = dims;
  const s = Math.min(230 / w, 175 / h, 2.2);
  const W = w * s;
  const H = h * s;
  const isStanding = o.pemasangan === 'Berdiri (Standing)';
  const isVanity = o.pemasangan === 'Meja Rias';
  const cy = isStanding ? FLOOR - H / 2 - 2 : isVanity ? FLOOR - 64 - H / 2 : 128;
  const ft = Math.max(7, (o.ukiran === 'Ukiran Jepara' ? 9 : 6) * s * 0.75);
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.ukiran === 'Ukiran Jepara';

  if (view === 'side') {
    const sideW = isStanding ? 46 : isVanity ? 52 : 12;
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(40, CX - 80)} />}
        <Shadow w={sideW + 16} />
        {isStanding ? (
          <g>
            <line x1={CX - 8} y1={FLOOR - H} x2={CX - 18} y2={FLOOR} stroke={shade(c, -10)} strokeWidth={Math.max(6, ft * 0.75)} strokeLinecap="round" />
            <line x1={CX - 8} y1={FLOOR - H * 0.85} x2={CX + 22} y2={FLOOR} stroke={dark} strokeWidth="4.5" strokeLinecap="round" />
          </g>
        ) : (
          <R x={CX - 6} y={cy - H / 2} w={12} h={H} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} rx={2} />
        )}
        <HDim x1={CX - sideW / 2} x2={CX + sideW / 2} y={FLOOR + 14} label={isStanding ? 'Penyangga ±45 cm' : 'Tebal ±4 cm'} />
        <VDim y1={cy - H / 2} y2={cy + H / 2} x={CX + 30} label={`T ${h} cm`} />
      </g>
    );
  }

  const archPath = (x, y, bw, bh) => {
    const r = bw / 2;
    return `M${x} ${y + bh} L${x} ${y + r} A${r} ${r} 0 0 1 ${x + bw} ${y + r} L${x + bw} ${y + bh} Z`;
  };

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(36, CX - W / 2 - 44)} />}
      {(isStanding || isVanity) && <Shadow w={W * 0.9} />}

      {o.led && (
        <ellipse cx={CX} cy={cy} rx={W / 2 + 12} ry={H / 2 + 12} fill="#FDE68A" opacity=".5" filter={`url(#${pid}-glow)`} />
      )}

      {/* Mahkota Ukiran Jepara di Puncak Cermin */}
      {isCarved && (
        <JeparaCrest cx={CX} y={cy - H / 2 + 4} width={W * 0.88} height={20} fill={`url(#${pid}-wood)`} dark={dark} light={light} />
      )}

      {/* Bingkai + Kaca Cermin */}
      {o.bentuk === 'Oval' ? (
        <>
          <E cx={CX} cy={cy} rx={W / 2} ry={H / 2} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.5} />
          <E cx={CX} cy={cy} rx={W / 2 - ft} ry={H / 2 - ft} fill={`url(#${pid}-glass)`} stroke={dark} sw={1.2} />
          {/* Ukiran sulur bawah pada cermin oval */}
          {isCarved && (
            <g transform={`translate(${CX} ${cy + H / 2 - 2}) scale(1 -0.65)`}>
              <JeparaCrest cx={0} y={0} width={W * 0.65} height={18} fill={`url(#${pid}-wood)`} dark={dark} light={light} />
            </g>
          )}
        </>
      ) : o.bentuk === 'Lengkung (Arch)' ? (
        <>
          <path d={archPath(CX - W / 2, cy - H / 2, W, H)} fill={`url(#${pid}-wood)`} stroke={dark} strokeWidth="1.5" />
          <path d={archPath(CX - W / 2 + ft, cy - H / 2 + ft, W - 2 * ft, H - 2 * ft)} fill={`url(#${pid}-glass)`} stroke={dark} strokeWidth="1.2" />
          {isCarved && (
            <>
              <JeparaCorner x={CX - W / 2 + 2} y={cy + H / 2 - 2} sy={-1} size={15} dark={dark} light={light} />
              <JeparaCorner x={CX + W / 2 - 2} y={cy + H / 2 - 2} sx={-1} sy={-1} size={15} dark={dark} light={light} />
            </>
          )}
        </>
      ) : (
        <>
          <R x={CX - W / 2} y={cy - H / 2} w={W} h={H} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.5} rx={4} />
          <R x={CX - W / 2 + ft} y={cy - H / 2 + ft} w={W - 2 * ft} h={H - 2 * ft} fill={`url(#${pid}-glass)`} stroke={dark} sw={1.2} rx={2} />
          {isCarved && (
            <>
              <JeparaCorner x={CX - W / 2 + 2} y={cy - H / 2 + 2} size={16} dark={dark} light={light} />
              <JeparaCorner x={CX + W / 2 - 2} y={cy - H / 2 + 2} sx={-1} size={16} dark={dark} light={light} />
              <JeparaCorner x={CX - W / 2 + 2} y={cy + H / 2 - 2} sy={-1} size={16} dark={dark} light={light} />
              <JeparaCorner x={CX + W / 2 - 2} y={cy + H / 2 - 2} sx={-1} sy={-1} size={16} dark={dark} light={light} />
            </>
          )}
        </>
      )}

      {/* Meja Rias Bawah */}
      {isVanity && (
        <g>
          <R x={CX - W / 2 - 8} y={cy + H / 2 + 4} w={W + 16} h={16} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={2} />
          {isCarved && <JeparaScrollBorder cx={CX} cy={cy + H / 2 + 12} width={W} height={10} dark={dark} light={light} />}
          <circle cx={CX} cy={cy + H / 2 + 12} r="2.6" fill="#C9A227" />
          <R x={CX - W / 2 - 4} y={cy + H / 2 + 20} w={6} h={FLOOR - (cy + H / 2 + 20)} fill={shade(c, -20)} />
          <R x={CX + W / 2 - 2} y={cy + H / 2 + 20} w={6} h={FLOOR - (cy + H / 2 + 20)} fill={shade(c, -20)} />
        </g>
      )}

      <HDim x1={CX - W / 2} x2={CX + W / 2} y={Math.min(FLOOR + 14, cy + H / 2 + (isVanity ? 64 : 24))} label={`Lebar ${w} cm`} />
      <VDim y1={cy - H / 2} y2={cy + H / 2} x={CX + W / 2 + 16} label={`T ${h} cm`} />
    </g>
  );
}

/* ================================================================== */
/* 5. KAMAR SET (Tampak Depan & Tampak Samping — Skala Proporsional!)  */
/* ================================================================== */
function Kamar({ o, c, view, showScale, pid }) {
  const { bw, headH, items, gap, totalWidth, maxHeight } = getKamarLayout(o);
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.headboard === 'Ukiran Jepara';

  if (view === 'side') {
    const s = Math.min(255 / 212, 155 / headH, 1.45);
    const L = 212 * s;
    const H = headH * s;
    const x0 = CX - L / 2;
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(36, x0 - 34)} />}
        <Shadow w={L} />
        <text x={CX} y={24} textAnchor="middle" fill="#7A4A2B" fontSize="10" fontWeight="700">
          TAMPAK SAMPING DIPAN (KASUR {bw} × 200 CM)
        </text>
        <R x={x0} y={FLOOR - H} w={10 * s} h={H} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} rx={3} />
        <R x={x0 + 10 * s} y={FLOOR - 34 * s} w={L - 10 * s} h={22 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} />
        {o.laciDipan ? (
          [0, 1, 2].map((i) => (
            <g key={i}>
              <R x={x0 + 16 * s + i * 60 * s} y={FLOOR - 28 * s} w={54 * s} h={14 * s} fill={shade(c, 8)} stroke={dark} sw={1.1} rx={2} />
              <circle cx={x0 + 43 * s + i * 60 * s} cy={FLOOR - 21 * s} r="2.3" fill="#C9A227" />
            </g>
          ))
        ) : (
          <>
            <R x={x0 + 4} y={FLOOR - 14 * s} w={7 * s} h={14 * s} fill={shade(c, -22)} />
            <R x={x0 + L - 10 * s} y={FLOOR - 14 * s} w={7 * s} h={14 * s} fill={shade(c, -22)} />
          </>
        )}
        <R x={x0 + 11 * s} y={FLOOR - 56 * s} w={L - 14 * s} h={22 * s} fill="#F5F1E8" stroke="#CFC6B3" sw={1.2} rx={4} />
        <R x={x0 + 14 * s} y={FLOOR - 66 * s} w={38 * s} h={11 * s} fill="#fff" stroke="#DED6C4" sw={1.1} rx={6} />
        <HDim x1={x0} x2={x0 + L} y={FLOOR + 14} label="Panjang Ranjang ±210 cm (Kasur 200 cm)" />
        <VDim y1={FLOOR - H} y2={FLOOR} x={x0 + L + 12} label={`T ${headH} cm`} />
      </g>
    );
  }

  // Skala TETAP (0.64 px/cm) khusus Kamar Set agar:
  // 1. Ukuran tempat tidur TIDAK mengecil saat Nakas / Lemari / Meja Rias ditambahkan!
  // 2. Mengubah ukuran kasur (120 -> 160 -> 180 -> 200) benar-benar terlihat makin lebar.
  // 3. Total lebar di bawah terus bertambah secara nyata sesuai isi set.
  const s = 0.64;
  const totalPx = totalWidth * s;
  const startX = CX - totalPx / 2;
  let x = startX;

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(12, startX - 22)} />}
      <Shadow w={totalPx} />

      {items.map((it, idx) => {
        const X = x;
        const Wd = it.w * s;
        const midX = X + Wd / 2;
        x += Wd + gap * s;

        if (it.k === 'bed') {
          const mx = X + 7 * s;
          const mw = bw * s;
          const topY = FLOOR - headH * s;
          return (
            <g key={`${it.k}-${idx}`}>
              {/* Label ukuran unit ranjang */}
              <text x={midX} y={topY - (isCarved ? 18 : 8)} textAnchor="middle" fill="#7A4A2B" fontSize="9.5" fontWeight="700">
                Kasur {bw} cm
              </text>
              {isCarved && (
                <JeparaCrest cx={midX} y={topY + 4} width={Wd * 0.92} height={17} fill={`url(#${pid}-wood)`} dark={dark} light={light} />
              )}
              <R x={X} y={topY + (isCarved ? 3 : 0)} w={Wd} h={headH * s - 10 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={5} />
              {o.headboard === 'Busa Jok' && (
                <R x={X + 6 * s} y={FLOOR - (headH - 8) * s} w={Wd - 12 * s} h={(headH - 64) * s} fill="#EAE0CE" stroke="#C6B79C" sw={1.1} rx={4} />
              )}
              {isCarved && (
                <JeparaScrollBorder cx={midX} cy={FLOOR - (headH - 28) * s} width={Wd - 14 * s} height={11} dark={dark} light={light} />
              )}
              <R x={mx - 2 * s} y={FLOOR - 30 * s} w={mw + 4 * s} h={16 * s} fill={shade(c, -20)} />
              {o.laciDipan && (
                <g>
                  <R x={mx + 4 * s} y={FLOOR - 26 * s} w={mw * 0.44} h={10 * s} fill={shade(c, 8)} stroke={dark} sw={1} rx={1.5} />
                  <R x={mx + mw * 0.52} y={FLOOR - 26 * s} w={mw * 0.44} h={10 * s} fill={shade(c, 8)} stroke={dark} sw={1} rx={1.5} />
                </g>
              )}
              <R x={mx} y={FLOOR - 52 * s} w={mw} h={22 * s} fill="#F4EFE5" stroke="#CFC6B3" sw={1.1} rx={3.5} />
              <R x={mx} y={FLOOR - 42 * s} w={mw} h={12 * s} fill="#8FA98D" rx={2.5} />
              <R x={mx + mw * 0.08} y={FLOOR - 62 * s} w={mw * 0.4} h={11 * s} fill="#fff" stroke="#E0D9C9" sw={1} rx={5} />
              <R x={mx + mw * 0.52} y={FLOOR - 62 * s} w={mw * 0.4} h={11 * s} fill="#fff" stroke="#E0D9C9" sw={1} rx={5} />
              <R x={X + 2 * s} y={FLOOR - 14 * s} w={5 * s} h={14 * s} fill={shade(c, -22)} />
              <R x={X + Wd - 7 * s} y={FLOOR - 14 * s} w={5 * s} h={14 * s} fill={shade(c, -22)} />
            </g>
          );
        }

        if (it.k === 'nakas') {
          return (
            <g key={`${it.k}-${idx}`}>
              <text x={midX} y={FLOOR - 54 * s - 6} textAnchor="middle" fill="#8C7A6B" fontSize="8.5" fontWeight="600">
                45
              </text>
              <R x={X} y={FLOOR - 54 * s} w={Wd} h={49 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.1} rx={2} />
              <R x={X + 4 * s} y={FLOOR - 42 * s} w={Wd - 8 * s} h={14 * s} fill={shade(c, 10)} stroke={dark} sw={0.9} rx={1.5} />
              <circle cx={midX} cy={FLOOR - 35 * s} r="1.8" fill="#C9A227" />
              <R x={X + 3 * s} y={FLOOR - 5 * s} w={4 * s} h={5 * s} fill={shade(c, -22)} />
              <R x={X + Wd - 7 * s} y={FLOOR - 5 * s} w={4 * s} h={5 * s} fill={shade(c, -22)} />
            </g>
          );
        }

        if (it.k === 'lemari') {
          const topY = FLOOR - 195 * s;
          return (
            <g key={`${it.k}-${idx}`}>
              <text x={midX} y={topY - (isCarved ? 17 : 7)} textAnchor="middle" fill="#7A4A2B" fontSize="9" fontWeight="700">
                Lemari 120
              </text>
              {isCarved && <JeparaCrest cx={midX} y={topY} width={Wd * 0.9} height={14} fill={`url(#${pid}-wood)`} dark={dark} light={light} />}
              <R x={X} y={topY} w={Wd} h={189 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} rx={2} />
              {[0, 1, 2].map((d) => (
                <R key={d} x={X + 3 * s + (d * (Wd - 6 * s)) / 3 + 1} y={topY + 6 * s} w={(Wd - 6 * s) / 3 - 2} h={172 * s} fill={d === 1 ? `url(#${pid}-glass)` : 'none'} stroke={dark} sw={0.9} rx={1.2} />
              ))}
            </g>
          );
        }

        // Meja Rias (90 cm)
        return (
          <g key={`${it.k}-${idx}`}>
            <text x={midX} y={FLOOR - 152 * s - 5} textAnchor="middle" fill="#7A4A2B" fontSize="9" fontWeight="700">
              Rias 90
            </text>
            <E cx={midX} cy={FLOOR - 115 * s} rx={25 * s} ry={34 * s} fill={`url(#${pid}-glass)`} stroke={dark} sw={2.2} />
            <R x={X} y={FLOOR - 76 * s} w={Wd} h={6 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1} rx={2} />
            <R x={X + 3 * s} y={FLOOR - 70 * s} w={4 * s} h={70 * s} fill={shade(c, -22)} />
            <R x={X + Wd - 7 * s} y={FLOOR - 70 * s} w={4 * s} h={70 * s} fill={shade(c, -22)} />
            <R x={X + 8 * s} y={FLOOR - 70 * s} w={Wd - 16 * s} h={12 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1} rx={1.5} />
          </g>
        );
      })}

      {/* Dimensi total lebar yang benar-benar bertambah saat item ditambah */}
      <HDim
        x1={startX}
        x2={startX + totalPx}
        y={FLOOR + 14}
        label={
          items.length > 1
            ? `Total bentang ±${totalWidth} cm (${(totalWidth / 100).toFixed(1).replace('.', ',')} m)`
            : `Lebar rangka ±${totalWidth} cm (Kasur ${bw}×200 cm)`
        }
      />
      <VDim y1={FLOOR - maxHeight * s} y2={FLOOR} x={startX + totalPx + 10} label={`T ${maxHeight}`} />
    </g>
  );
}


/* ================================================================== */
/* 6. KITCHEN SET (Tampak Depan & Tampak Samping)                      */
/* ================================================================== */
function Kitchen({ dims, o, c, sheen, view, showScale, pid }) {
  const { w = 260, h = 225, d = 60 } = dims;
  const isSide = view === 'side';
  const span = isSide ? d + (o.minibar ? 45 : 0) : w;
  const s = Math.min(285 / span, 175 / h, 1.35);
  const W = span * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const baseH = 85 * s;
  const upperH = 72 * s;
  const baseY = FLOOR - baseH;
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.gaya === 'Ukiran Jepara';
  const isClassic = o.gaya === 'Klasik Profil' || isCarved;

  if (isSide) {
    const baseW = d * s;
    const upperW = d * 0.58 * s;
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(34, x0 - 34)} />}
        <Shadow w={W} />
        {/* Dinding belakang */}
        <line x1={x0} x2={x0} y1={top - 6} y2={FLOOR} stroke="#C7B299" strokeWidth="3" />
        {/* Kabinet Bawah */}
        <R x={x0} y={baseY + 4} w={baseW} h={baseH - 4} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={2} />
        <R x={x0 - 1} y={baseY} w={baseW + 5} h={5.5} fill="#E7E0D4" stroke="#B7AA96" sw={1} rx={1.5} />
        {/* Kabinet Atas */}
        {o.kabinetAtas && (
          <R x={x0} y={top} w={upperW} h={upperH} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={2} />
        )}
        {/* Island / Minibar */}
        {o.minibar && (
          <g>
            <R x={x0 + baseW + 16 * s} y={FLOOR - 92 * s} w={36 * s} h={92 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} rx={2} />
            <R x={x0 + baseW + 12 * s} y={FLOOR - 95 * s} w={44 * s} h={5.5} fill="#E7E0D4" stroke="#B7AA96" sw={1} rx={1.5} />
          </g>
        )}
        <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={o.minibar ? `D ${d} cm + Minibar` : `Kedalaman ${d} cm`} />
        <VDim y1={top} y2={FLOOR} x={x0 + W + 16} label={`T ${h} cm`} />
      </g>
    );
  }

  const doors = Math.max(3, Math.min(7, Math.round(w / 52)));
  const doorW = (W - 8) / doors;

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(24, x0 - 28)} />}
      <Shadow w={W} />

      {/* Backsplash keramik dapur */}
      <R x={x0 + 2} y={top + (o.kabinetAtas ? upperH : 35)} w={W - 4} h={baseY - (top + (o.kabinetAtas ? upperH : 35))} fill="#F4EFE7" stroke="#DFD4C4" sw={1} />

      {/* Kabinet Gantung Atas */}
      {o.kabinetAtas && (
        <g>
          {isCarved && (
            <JeparaCrest cx={CX} y={top + 2} width={W * 0.72} height={15} fill={`url(#${pid}-wood)`} dark={dark} light={light} />
          )}
          <R x={x0} y={top} w={W} h={upperH} fill={shade(c, -6)} stroke={dark} sw={1.3} rx={2} />
          {Array.from({ length: doors }).map((_, i) => {
            const dx = x0 + 4 + i * doorW;
            const isGlass = i === Math.floor(doors / 2);
            return (
              <g key={i}>
                <R
                  x={dx + 1}
                  y={top + 4}
                  w={doorW - 2}
                  h={upperH - 8}
                  fill={isGlass ? `url(#${pid}-glass)` : `url(#${pid}-wood)`}
                  stroke={dark}
                  sw={1.1}
                  rx={1.5}
                />
                {!isGlass && isClassic && (
                  <R x={dx + 4.5} y={top + 8} w={doorW - 9} h={upperH - 16} fill="none" stroke={dark} sw={0.9} rx={1} opacity=".75" />
                )}
                {!isGlass && isCarved && (
                  <JeparaPanelMedallion cx={dx + doorW / 2} cy={top + upperH / 2} w={doorW - 10} h={upperH - 16} dark={dark} light={light} />
                )}
                <rect x={dx + doorW - 6} y={top + upperH - 17} width="2.2" height="9" rx="1" fill="#C9A227" />
              </g>
            );
          })}
        </g>
      )}

      {/* Kabinet Bawah + Top Table Marmer */}
      <R x={x0} y={baseY + 5} w={W} h={baseH - 5} fill={shade(c, -8)} stroke={dark} sw={1.3} rx={2} />
      <R x={x0 - 3} y={baseY} w={W + 6} h={6} fill="#EFE9DE" stroke="#B7AA96" sw={1.1} rx={2} />
      {/* Indikator Kran & Kompor */}
      <path d={`M${x0 + W * 0.22} ${baseY} L${x0 + W * 0.22} ${baseY - 12} Q${x0 + W * 0.22 + 5} ${baseY - 18} ${x0 + W * 0.22 + 10} ${baseY - 11}`} stroke="#8E867E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <R x={x0 + W * 0.64} y={baseY - 2.5} w={Math.min(44, W * 0.22)} h={3} fill="#3A3430" rx={1} />

      {Array.from({ length: doors }).map((_, i) => {
        const dx = x0 + 4 + i * doorW;
        return (
          <g key={i}>
            <R x={dx + 1} y={baseY + 8} w={doorW - 2} h={baseH - 14} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.1} rx={1.5} />
            {isClassic && (
              <R x={dx + 4.5} y={baseY + 12} w={doorW - 9} h={baseH - 22} fill="none" stroke={dark} sw={0.9} rx={1} opacity=".7" />
            )}
            <rect x={dx + doorW / 2 - 5} y={baseY + 13} width="10" height="2.2" rx="1" fill="#C9A227" />
          </g>
        );
      })}

      {/* Indikator Sudut L / U atau Minibar */}
      {o.bentuk !== 'Lurus (I)' && (
        <text x={CX} y={top - (isCarved ? 18 : 7)} textAnchor="middle" fill="#7A4A2B" fontSize="9.5" fontWeight="700">
          LAYOUT {o.bentuk.toUpperCase()}{o.minibar ? ' + MINIBAR' : ''}
        </text>
      )}
      {sheen === 'glossy' && <R x={x0 + 4} y={baseY + 8} w={W * 0.24} h={baseH - 14} fill="#fff" opacity=".14" />}

      <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Panjang ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 12} label={`T ${h} cm`} />
    </g>
  );
}

/* ================================================================== */
/* 7. BUFFET & RAK TV (Tampak Depan & Tampak Samping)                  */
/* ================================================================== */
function Buffet({ dims, o, c, sheen, view, showScale, pid }) {
  const { w = 180, h = 68, d = 45 } = dims;
  const isBackdrop = o.model === 'Backdrop TV + Rak';
  const effectiveH = isBackdrop ? Math.max(h, 185) : h;
  const isSide = view === 'side';
  const span = isSide ? d : w;
  const s = Math.min(280 / span, 170 / effectiveH, 1.8);
  const W = span * s;
  const H = effectiveH * s;
  const credenzaH = Math.min(62, effectiveH * 0.55) * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const credY = FLOOR - credenzaH;
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.ukiran === 'Ukiran Jepara';

  if (isSide) {
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(36, x0 - 38)} />}
        <Shadow w={W} />
        {isBackdrop && <R x={x0} y={top} w={8} h={H} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.1} rx={2} />}
        <R x={x0} y={credY} w={W} h={credenzaH - 6} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={2} />
        <R x={x0 + 3} y={FLOOR - 6} w={6} h={6} fill={dark} />
        <R x={x0 + W - 9} y={FLOOR - 6} w={6} h={6} fill={dark} />
        <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Kedalaman ${d} cm`} />
        <VDim y1={top} y2={FLOOR} x={x0 + W + 14} label={`T ${effectiveH} cm`} />
      </g>
    );
  }

  const cols = Math.max(3, Math.min(5, Math.round(w / 52)));
  const cw = (W - 10) / cols;

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(26, x0 - 30)} />}
      <Shadow w={W} />

      {/* Backdrop Kisi-kisi & TV */}
      {isBackdrop && (
        <g>
          <R x={x0 + 4} y={top} w={W - 8} h={credY - top} fill={shade(c, 16)} stroke={dark} sw={1.2} rx={3} />
          {/* Kisi vertikal jati */}
          {Array.from({ length: 14 }).map((_, i) => (
            <line
              key={i}
              x1={x0 + 10 + (i * (W - 20)) / 13}
              x2={x0 + 10 + (i * (W - 20)) / 13}
              y1={top + 4}
              y2={credY - 4}
              stroke={dark}
              strokeWidth="1.2"
              opacity=".45"
            />
          ))}
          {/* Layar TV ilustrasi */}
          <R x={CX - W * 0.28} y={top + (credY - top) * 0.22} w={W * 0.56} h={(credY - top) * 0.54} fill="#22201E" stroke="#47423E" sw={2} rx={3} />
        </g>
      )}

      {/* Rak Pajang Samping */}
      {o.rakPajang && (
        <g>
          <R x={x0 + W - 36} y={isBackdrop ? top : credY - 90} w={32} h={isBackdrop ? credY - top : 90} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.1} rx={2} />
          {[0.25, 0.5, 0.75].map((r) => {
            const ry = (isBackdrop ? top : credY - 90) + (isBackdrop ? credY - top : 90) * r;
            return <line key={r} x1={x0 + W - 34} x2={x0 + W - 6} y1={ry} y2={ry} stroke={dark} strokeWidth="1.5" />;
          })}
        </g>
      )}

      {/* Badan Buffet Bawah */}
      <R x={x0 + 4} y={FLOOR - 7} w={8} h={7} fill={dark} />
      <R x={x0 + W - 12} y={FLOOR - 7} w={8} h={7} fill={dark} />
      <R x={x0} y={credY} w={W} h={credenzaH - 6} fill={shade(c, -8)} stroke={dark} sw={1.3} rx={3} />
      {Array.from({ length: cols }).map((_, i) => {
        const dx = x0 + 5 + i * cw;
        return (
          <g key={i}>
            <R x={dx + 1} y={credY + 5} w={cw - 2} h={credenzaH - 16} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.1} rx={2} />
            {isCarved && (
              <JeparaScrollBorder cx={dx + cw / 2} cy={credY + credenzaH / 2 - 2} width={cw - 10} height={9} dark={dark} light={light} />
            )}
            <circle cx={dx + cw / 2} cy={credY + 12} r="2.2" fill="#C9A227" />
          </g>
        );
      })}
      {sheen === 'glossy' && <R x={x0 + 2} y={credY + 1.5} w={W - 4} h={2.5} fill="#fff" opacity=".32" rx={2} />}

      <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Panjang ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 12} label={`T ${effectiveH} cm`} />
    </g>
  );
}

/* ================================================================== */
/* 8. PINTU & PARTISI (Tampak Depan & Tampak Samping)                  */
/* ================================================================== */
function Partisi({ dims, o, c, view, showScale, pid }) {
  const { w = 160, h = 225 } = dims;
  const isSide = view === 'side';
  const s = Math.min(260 / w, 175 / h, 1.5);
  const W = isSide ? 16 : w * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.ukiran === 'Ukiran Jepara';

  if (isSide) {
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(40, CX - 65)} />}
        <Shadow w={34} />
        <R x={CX - 8} y={top} w={16} h={H} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={2} />
        <HDim x1={CX - 14} x2={CX + 14} y={FLOOR + 14} label="Tebal ±4–12 cm" />
        <VDim y1={top} y2={FLOOR} x={CX + 26} label={`T ${h} cm`} />
      </g>
    );
  }

  if (o.model === 'Partisi Penyekat') {
    const slats = Math.max(6, Math.min(18, Math.round(w / 14)));
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(26, x0 - 28)} />}
        <Shadow w={W} />
        <R x={x0} y={top} w={W} h={H} fill="none" stroke={dark} sw={5} rx={2} />
        <R x={x0} y={top} w={W} h={H} fill="none" stroke={c} sw={3} rx={2} />
        {Array.from({ length: slats }).map((_, i) => {
          const sx = x0 + 8 + (i * (W - 16)) / Math.max(1, slats - 1);
          return <line key={i} x1={sx} x2={sx} y1={top + 4} y2={FLOOR - 4} stroke={shade(c, -6)} strokeWidth="4.2" />;
        })}
        {o.kisi && (
          <>
            <R x={x0 + W * 0.22} y={top + H * 0.34} w={W * 0.56} h={7} fill={`url(#${pid}-wood)`} stroke={dark} sw={1} rx={1.5} />
            <R x={x0 + W * 0.22} y={top + H * 0.62} w={W * 0.56} h={7} fill={`url(#${pid}-wood)`} stroke={dark} sw={1} rx={1.5} />
          </>
        )}
        <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Lebar ${w} cm`} />
        <VDim y1={top} y2={FLOOR} x={x0 + W + 12} label={`T ${h} cm`} />
      </g>
    );
  }

  const leaves = o.model === 'Pintu 2 Daun' ? 2 : 1;
  const leafW = (W - 12) / leaves;

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(28, x0 - 30)} />}
      <Shadow w={W} />
      {isCarved && <JeparaCrest cx={CX} y={top + 1} width={W * 0.9} height={18} fill={`url(#${pid}-wood)`} dark={dark} light={light} />}
      {/* Kusen Jati */}
      <R x={x0} y={top} w={W} h={H} fill={shade(c, -18)} stroke={dark} sw={1.5} rx={2} />
      {Array.from({ length: leaves }).map((_, i) => {
        const dx = x0 + 6 + i * leafW;
        return (
          <g key={i}>
            <R x={dx + 1} y={top + 6} w={leafW - 2} h={H - 8} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} rx={1.5} />
            <R x={dx + 8} y={top + 14} w={leafW - 16} h={H * 0.42} fill="none" stroke={dark} sw={1.2} rx={2} />
            <R x={dx + 8} y={top + H * 0.6} w={leafW - 16} h={H * 0.3} fill="none" stroke={dark} sw={1.2} rx={2} />
            {isCarved && (
              <JeparaPanelMedallion cx={dx + leafW / 2} cy={top + 14 + H * 0.21} w={leafW - 22} h={H * 0.36} dark={dark} light={light} />
            )}
            <rect
              x={leaves === 2 ? (i === 0 ? dx + leafW - 7 : dx + 5) : dx + leafW - 9}
              y={top + H * 0.52}
              width="2.6"
              height="16"
              rx="1.2"
              fill="#C9A227"
            />
          </g>
        );
      })}
      <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Lebar ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 12} label={`T ${h} cm`} />
    </g>
  );
}

/* ================================================================== */
/* 9. BEBAS REQUEST — REPLIKA NYATA (MIMBAR + ORANG, GAZEBO, KASIR,    */
/*    RAK BUKU, DIPAN TINGKAT, TANGGA, & KABINET CUSTOM SERBAGUNA)     */
/* ================================================================== */

function detectCustomReplica(name = '') {
  const s = String(name).toLowerCase();
  if (/(mimbar|podium|khotbah|khutbah|ceramah|pidato)/.test(s)) return 'mimbar';
  if (/(gazebo|saung|pendopo|bale)/.test(s)) return 'gazebo';
  if (/(kasir|bar|kafe|cafe|kopi|resepsionis|counter|resepsi)/.test(s)) return 'kasir';
  if (/(rak|buku|display|sepatu|pajang|etalase|perpustakaan)/.test(s)) return 'rak';
  if (/(tingkat|susun|bunk|ranjang\s?anak)/.test(s)) return 'dipan_tingkat';
  if (/(tangga|railing|undak)/.test(s)) return 'tangga';
  return 'kabinet';
}

// Figur Pembicara / Orang di Mimbar (berdiri di belakang mimbar/podium)
function MimbarPersonFront({ cx, floorY, scale, stepH = 16 }) {
  const feetY = floorY - stepH;
  const h = 168 * scale;
  const headY = feetY - h + 11 * scale;
  const headR = Math.max(6, 11 * scale);
  const shoulderY = headY + headR + 3 * scale;
  const bodyW = 36 * scale;
  return (
    <g>
      {/* Peci / kopiah rapi */}
      <rect x={cx - headR * 0.92} y={headY - headR * 1.18} width={headR * 1.84} height={headR * 0.72} rx={2.5} fill="#2B211A" />
      {/* Kepala */}
      <circle cx={cx} cy={headY} r={headR} fill="#E7C2A3" stroke="#8C6245" strokeWidth="1" />
      {/* Leher */}
      <rect x={cx - headR * 0.34} y={headY + headR * 0.85} width={headR * 0.68} height={headR * 0.48} fill="#DFB594" />
      {/* Baju koko / jas pembicara */}
      <path
        d={`M${cx - bodyW * 0.55} ${shoulderY + 8 * scale} Q${cx - bodyW * 0.52} ${shoulderY} ${cx - bodyW * 0.28} ${shoulderY} L${cx + bodyW * 0.28} ${shoulderY} Q${cx + bodyW * 0.52} ${shoulderY} ${cx + bodyW * 0.55} ${shoulderY + 8 * scale} L${cx + bodyW * 0.62} ${feetY - 35 * scale} L${cx - bodyW * 0.62} ${feetY - 35 * scale} Z`}
        fill="#F4EFE6"
        stroke="#BFA98E"
        strokeWidth="1.2"
      />
      {/* Plaket kerah koko */}
      <line x1={cx} y1={shoulderY + 2} x2={cx} y2={shoulderY + 24 * scale} stroke="#C69B3A" strokeWidth="1.8" />
      {/* Lengan kiri & kanan memegang tepi mimbar */}
      <ellipse cx={cx - bodyW * 0.52} cy={shoulderY + 34 * scale} rx={5.5 * scale} ry={4 * scale} fill="#E7C2A3" />
      <ellipse cx={cx + bodyW * 0.52} cy={shoulderY + 34 * scale} rx={5.5 * scale} ry={4 * scale} fill="#E7C2A3" />
    </g>
  );
}

function MimbarPersonSide({ x, floorY, scale, stepH = 16 }) {
  const feetY = floorY - stepH;
  const h = 168 * scale;
  const headR = Math.max(5.5, 10.5 * scale);
  const headY = feetY - h + headR;
  const shoulderY = headY + headR + 3 * scale;
  return (
    <g>
      {/* Kaki berdiri di pijakan */}
      <rect x={x - 6 * scale} y={feetY - 72 * scale} width={11 * scale} height={72 * scale} rx={4} fill="#3E342D" />
      {/* Badan menghadap kanan (ke mimbar) */}
      <rect x={x - 10 * scale} y={shoulderY} width={20 * scale} height={68 * scale} rx={7} fill="#F4EFE6" stroke="#BFA98E" strokeWidth="1.2" />
      {/* Lengan mengarah ke papan baca mimbar */}
      <path d={`M${x + 4 * scale} ${shoulderY + 12 * scale} L${x + 28 * scale} ${shoulderY + 30 * scale}`} stroke="#F4EFE6" strokeWidth={8 * scale} strokeLinecap="round" />
      <circle cx={x + 30 * scale} cy={shoulderY + 30 * scale} r={4.2 * scale} fill="#E7C2A3" />
      {/* Kepala + peci */}
      <circle cx={x + 2 * scale} cy={headY} r={headR} fill="#E7C2A3" stroke="#8C6245" strokeWidth="1" />
      <rect x={x - headR * 0.8} y={headY - headR * 1.18} width={headR * 1.9} height={headR * 0.68} rx={2.5} fill="#2B211A" />
    </g>
  );
}

// 9A. REPLIKA MIMBAR / PODIUM JATI + ORANG BERDIRI DI MIMBAR
function MimbarReplica({ dims, o, c, sheen, view, showScale, pid }) {
  const { w = 110, d = 95, h = 145 } = dims;
  const isSide = view === 'side';
  const span = isSide ? d : w;
  const effH = Math.max(h, 130);
  const s = Math.min(200 / span, 155 / Math.max(effH, 178), 1.18);
  const W = span * s;
  const H = effH * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.gaya === 'Ukiran Jepara';
  const isClassic = o.gaya === 'Klasik Profil' || isCarved;
  const podiumBodyH = Math.min(H, 128 * s);
  const podiumTop = FLOOR - podiumBodyH;
  const stepH = 16 * s;

  if (isSide) {
    const bodyW = W * 0.56;
    const bx = x0 + W - bodyW;
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(28, x0 - 38)} />}
        <Shadow w={W + 18} />
        {/* Pijakan tangga masuk di sisi belakang mimbar */}
        <R x={x0 - 8} y={FLOOR - stepH} w={W - bodyW + 14} h={stepH} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} rx={2} />
        <R x={x0 - 20} y={FLOOR - stepH * 0.52} w={16} h={stepH * 0.52} fill={shade(c, -10)} stroke={dark} sw={1.1} rx={1.5} />

        {/* Orang berdiri di pijakan mimbar menghadap ke papan baca */}
        <MimbarPersonSide x={x0 + (W - bodyW) * 0.45} floorY={FLOOR} scale={s} stepH={stepH} />

        {/* Bodi mimbar tampak samping */}
        <R x={bx} y={podiumTop + 10} w={bodyW} h={podiumBodyH - 10} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={2} />
        {/* Rak buku kecil di bagian belakang dalam mimbar */}
        <line x1={bx + 2} x2={bx + bodyW * 0.45} y1={podiumTop + podiumBodyH * 0.45} y2={podiumTop + podiumBodyH * 0.45} stroke={dark} strokeWidth="2.4" />
        {/* Papan baca miring (lectern) */}
        <polygon
          points={`${bx - 8},${podiumTop + 14} ${bx + bodyW + 6},${podiumTop + 2} ${bx + bodyW + 6},${podiumTop + 9} ${bx - 8},${podiumTop + 21}`}
          fill={shade(c, 12)}
          stroke={dark}
          strokeWidth="1.2"
        />
        {/* Mikrofon gooseneck mengarah ke pembicara */}
        <path
          d={`M${bx + bodyW * 0.45} ${podiumTop + 8} Q${bx + 4} ${podiumTop - 18} ${bx - 12} ${podiumTop - 10}`}
          fill="none"
          stroke="#262220"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <ellipse cx={bx - 14} cy={podiumTop - 9} rx="3.8" ry="2.6" fill="#262220" />
        {/* Tiang & kubah kecil atas bila tinggi > 155 */}
        {h >= 155 && (
          <g>
            <R x={bx + bodyW - 8} y={top + 18} w={7} h={podiumTop - top - 10} fill={shade(c, -12)} stroke={dark} sw={1} />
            <path d={`M${x0 - 4} ${top + 20} Q${CX} ${top - 6} ${bx + bodyW + 8} ${top + 20} Z`} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} />
          </g>
        )}

        <HDim x1={x0 - 16} x2={bx + bodyW} y={FLOOR + 14} label={`Kedalaman ${d} cm (incl. pijakan)`} />
        <VDim y1={h >= 155 ? top : podiumTop - 16} y2={FLOOR} x={bx + bodyW + 14} label={`T ${h} cm`} />
      </g>
    );
  }

  const baseW = W + 16;
  const colW = Math.max(8, W * 0.11);

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(24, x0 - 40)} />}
      <Shadow w={baseW} />

      {/* ORANG BERDIRI DI BELAKANG MIMBAR / PODIUM */}
      <MimbarPersonFront cx={CX} floorY={FLOOR} scale={s} stepH={stepH} />

      {/* Tiang penyangga & atap kubah mimbar masjid bila tinggi >= 155 cm */}
      {h >= 155 && (
        <g>
          <R x={x0 + 4} y={top + 22} w={colW * 0.72} h={podiumTop - top - 16} fill={shade(c, -12)} stroke={dark} sw={1.1} />
          <R x={x0 + W - 4 - colW * 0.72} y={top + 22} w={colW * 0.72} h={podiumTop - top - 16} fill={shade(c, -12)} stroke={dark} sw={1.1} />
          {/* Lengkungan kubah atap mimbar */}
          <path
            d={`M${x0 - 6} ${top + 24} Q${CX} ${top - 4} ${x0 + W + 6} ${top + 24} Z`}
            fill={`url(#${pid}-wood)`}
            stroke={dark}
            strokeWidth="1.4"
          />
          <circle cx={CX} cy={top + 2} r="4.5" fill="#C9A227" stroke={dark} strokeWidth="0.9" />
        </g>
      )}

      {/* Bodi Utama Podium / Mimbar (di depan orang) */}
      <R x={x0 - 8} y={FLOOR - 10} w={baseW} h={10} fill={shade(c, -16)} stroke={dark} sw={1.3} rx={2} />
      <R x={x0} y={podiumTop + 8} w={W} h={podiumBodyH - 18} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.4} rx={3} />

      {/* Pilar Samping Mimbar */}
      <R x={x0 + 2} y={podiumTop + 10} w={colW} h={podiumBodyH - 22} fill={shade(c, -8)} stroke={dark} sw={1} rx={1.5} />
      <R x={x0 + W - colW - 2} y={podiumTop + 10} w={colW} h={podiumBodyH - 22} fill={shade(c, -8)} stroke={dark} sw={1} rx={1.5} />

      {/* Panel Depan + Lengkungan Kubah / Ukiran Jepara */}
      <R x={x0 + colW + 6} y={podiumTop + 18} w={W - 2 * colW - 12} h={podiumBodyH - 36} fill={shade(c, 4)} stroke={dark} sw={1.1} rx={2.5} />
      {isClassic && (
        <path
          d={`M${x0 + colW + 12} ${FLOOR - 22} L${x0 + colW + 12} ${podiumTop + 42} Q${CX} ${podiumTop + 20} ${x0 + W - colW - 12} ${podiumTop + 42} L${x0 + W - colW - 12} ${FLOOR - 22} Z`}
          fill="none"
          stroke={dark}
          strokeWidth="1.2"
          opacity=".8"
        />
      )}
      {isCarved && (
        <>
          <JeparaPanelMedallion cx={CX} cy={podiumTop + podiumBodyH * 0.56} w={W - 2 * colW - 20} h={podiumBodyH * 0.45} dark={dark} light={light} />
          <JeparaCrest cx={CX} y={podiumTop + 11} width={W * 0.84} height={15} fill={`url(#${pid}-wood)`} dark={dark} light={light} />
        </>
      )}

      {/* Papan Baca Atas Podium + Naskah + Mikrofon */}
      <R x={x0 - 6} y={podiumTop + 3} w={W + 12} h={8} fill={shade(c, 14)} stroke={dark} sw={1.2} rx={2.5} />
      {/* Lembar Naskah/Kitab */}
      <R x={CX - 14} y={podiumTop - 1} w={28} h={5} fill="#FFFDF8" stroke="#CBBBA4" sw={0.9} rx={1} />
      {/* Mikrofon Gooseneck */}
      <path d={`M${CX + 18} ${podiumTop + 3} Q${CX + 22} ${podiumTop - 18} ${CX + 9} ${podiumTop - 21}`} fill="none" stroke="#262220" strokeWidth="2" strokeLinecap="round" />
      <circle cx={CX + 8} cy={podiumTop - 21} r="3.2" fill="#262220" />
      {sheen === 'glossy' && <R x={x0 - 3} y={podiumTop + 4.5} w={W + 6} h={2.2} fill="#fff" opacity=".38" rx={1} />}

      <HDim x1={x0 - 8} x2={x0 + W + 8} y={FLOOR + 14} label={`Lebar ${w} cm`} />
      <VDim y1={h >= 155 ? top : podiumTop} y2={FLOOR} x={x0 + W + 16} label={`T ${h} cm`} />
    </g>
  );
}

// 9B. REPLIKA GAZEBO TAMAN JATI (4 Tiang Soko, Atap Joglo/Limasan, Pagar, Tangga, & Orang Santai)
function GazeboReplica({ dims, o, c, view, showScale, pid }) {
  const { w = 260, d = 260, h = 280 } = dims;
  const isSide = view === 'side';
  const span = isSide ? d : w;
  const s = Math.min(255 / span, 178 / h, 0.92);
  const W = span * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const roofH = H * 0.36;
  const eaveY = top + roofH;
  const deckY = FLOOR - 26 * s;
  const railY = deckY - 38 * s;
  const postW = Math.max(7, 11 * s);
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.gaya === 'Ukiran Jepara';

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(22, x0 - 24)} />}
      <Shadow w={W + 24} />

      {/* Umpak Batu Alam */}
      <R x={x0 + 6} y={FLOOR - 10} w={postW + 6} h={10} fill="#8C8378" stroke="#5D564E" sw={1} rx={1.5} />
      <R x={x0 + W - 12 - postW} y={FLOOR - 10} w={postW + 6} h={10} fill="#8C8378" stroke="#5D564E" sw={1} rx={1.5} />

      {/* Tiang Belakang (lebih gelap untuk kedalaman 3D) */}
      <R x={x0 + 22} y={eaveY} w={postW * 0.8} h={deckY - eaveY} fill={shade(c, -26)} />
      <R x={x0 + W - 22 - postW * 0.8} y={eaveY} w={postW * 0.8} h={deckY - eaveY} fill={shade(c, -26)} />

      {/* Orang duduk santai di dalam gazebo */}
      <g opacity=".82">
        <circle cx={CX - W * 0.14} cy={deckY - 48 * s} r={Math.max(4.5, 9 * s)} fill="#7A4A2B" />
        <rect x={CX - W * 0.14 - 8 * s} y={deckY - 38 * s} width={16 * s} height={28 * s} rx={5} fill="#8E5B38" />
        <rect x={CX - W * 0.14 - 11 * s} y={deckY - 12 * s} width={26 * s} height={11 * s} rx={4} fill="#5E3820" />
      </g>

      {/* Lantai Panggung Kayu Jati */}
      <R x={x0 + 4} y={deckY} w={W - 8} h={11 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} rx={2} />
      {/* Anak Tangga Masuk (tampak depan) */}
      {!isSide && (
        <>
          <R x={CX - 22} y={FLOOR - 13 * s} w={44} h={6 * s} fill={shade(c, 8)} stroke={dark} sw={1} rx={1} />
          <R x={CX - 26} y={FLOOR - 6 * s} w={52} h={6 * s} fill={shade(c, -4)} stroke={dark} sw={1} rx={1} />
        </>
      )}

      {/* Pagar Keliling Berjeruji */}
      <R x={x0 + 9} y={railY} w={isSide ? W - 18 : W * 0.34} h={5} fill={shade(c, 8)} stroke={dark} sw={1} rx={1.5} />
      {!isSide && <R x={x0 + W - 9 - W * 0.34} y={railY} w={W * 0.34} h={5} fill={shade(c, 8)} stroke={dark} sw={1} rx={1.5} />}
      {Array.from({ length: isSide ? 9 : 4 }).map((_, i) => {
        const leftX = x0 + 16 + i * ((isSide ? W - 32 : W * 0.28) / (isSide ? 8 : 3));
        return (
          <g key={i}>
            <line x1={leftX} x2={leftX} y1={railY + 4} y2={deckY} stroke={dark} strokeWidth="2" />
            {!isSide && <line x1={x0 + W - (leftX - x0)} x2={x0 + W - (leftX - x0)} y1={railY + 4} y2={deckY} stroke={dark} strokeWidth="2" />}
          </g>
        );
      })}

      {/* Tiang Depan Soko Guru */}
      <R x={x0 + 9} y={eaveY} w={postW} h={FLOOR - 9 - eaveY} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={1.5} />
      <R x={x0 + W - 9 - postW} y={eaveY} w={postW} h={FLOOR - 9 - eaveY} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={1.5} />

      {/* Lisplang & Ukiran Jepara di bawah atap */}
      <R x={x0 + 2} y={eaveY} w={W - 4} h={10} fill={shade(c, -8)} stroke={dark} sw={1.1} rx={1.5} />
      {isCarved && <JeparaScrollBorder cx={CX} cy={eaveY + 5} width={W - 22} height={8} dark={dark} light={light} />}

      {/* Atap Limasan / Joglo Bertingkat */}
      <polygon
        points={`${x0 - 18},${eaveY + 2} ${x0 + W * 0.24},${top + roofH * 0.38} ${x0 + W * 0.76},${top + roofH * 0.38} ${x0 + W + 18},${eaveY + 2}`}
        fill="#7E3F24"
        stroke="#4A2312"
        strokeWidth="1.5"
      />
      <polygon
        points={`${x0 + W * 0.22},${top + roofH * 0.42} ${CX},${top + 4} ${x0 + W * 0.78},${top + roofH * 0.42}`}
        fill="#944B2A"
        stroke="#4A2312"
        strokeWidth="1.5"
      />
      {/* Mustaka puncak atap */}
      <path d={`M${CX - 5} ${top + 5} L${CX} ${top - 7} L${CX + 5} ${top + 5} Z`} fill="#C9A227" stroke="#5A3A10" strokeWidth="1" />

      <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={isSide ? `Kedalaman ${d} cm` : `Lebar ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 18} label={`T ${h} cm`} />
    </g>
  );
}

// 9C. REPLIKA MEJA KASIR / BAR KAFE + BARISTA BERDIRI DI BELAKANG COUNTER
function KasirReplica({ dims, o, c, sheen, view, showScale, pid }) {
  const { w = 200, d = 68, h = 108 } = dims;
  const isSide = view === 'side';
  const span = isSide ? d + 34 : w;
  const s = Math.min(265 / span, 145 / Math.max(h, 165), 1.32);
  const W = (isSide ? d : w) * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.gaya === 'Ukiran Jepara';

  if (isSide) {
    const bx = CX - W * 0.2;
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(24, bx - 64)} />}
        <Shadow w={W + 52} />
        {/* Figur Barista di sisi belakang meja */}
        <MimbarPersonSide x={bx - 22 * s} floorY={FLOOR} scale={s} stepH={0} />
        {/* Badan Counter & Laci Dalam */}
        <R x={bx} y={top + 6} w={W} h={H - 6} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={2} />
        <R x={bx - 4} y={top} w={W + 16} h={7} fill="#EFE9DE" stroke="#B7AA96" sw={1.1} rx={2} />
        {/* Monitor POS di atas meja */}
        <R x={bx + W * 0.25} y={top - 16} w={16} h={14} fill="#2A2624" stroke="#4D4642" sw={1.2} rx={2} />
        {/* Kursi Bar Tinggi (Bar Stool) di depan counter */}
        <R x={bx + W + 14} y={FLOOR - 70 * s} w={22 * s} h={5} fill={shade(c, -10)} stroke={dark} sw={1} rx={2} />
        <line x1={bx + W + 17} x2={bx + W + 15} y1={FLOOR - 65 * s} y2={FLOOR} stroke={dark} strokeWidth="2.4" />
        <line x1={bx + W + 14 + 19 * s} x2={bx + W + 14 + 21 * s} y1={FLOOR - 65 * s} y2={FLOOR} stroke={dark} strokeWidth="2.4" />
        <HDim x1={bx} x2={bx + W} y={FLOOR + 14} label={`Kedalaman ${d} cm`} />
        <VDim y1={top} y2={FLOOR} x={bx + W + 40} label={`T ${h} cm`} />
      </g>
    );
  }

  const slats = Math.max(8, Math.min(24, Math.round(w / 11)));
  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(24, x0 - 30)} />}
      <Shadow w={W + 12} />

      {/* Barista / Kasir berdiri di belakang counter */}
      <g>
        <circle cx={CX - W * 0.12} cy={FLOOR - 156 * s} r={Math.max(5.5, 10.5 * s)} fill="#E7C2A3" stroke="#8C6245" strokeWidth="1" />
        <path d={`M${CX - W * 0.12 - 11 * s} ${FLOOR - 160 * s} Q${CX - W * 0.12} ${FLOOR - 172 * s} ${CX - W * 0.12 + 11 * s} ${FLOOR - 160 * s} Z`} fill="#332218" />
        <rect x={CX - W * 0.12 - 17 * s} y={FLOOR - 143 * s} width={34 * s} height={58 * s} rx={8} fill="#4B2813" />
        <rect x={CX - W * 0.12 - 10 * s} y={FLOOR - 134 * s} width={20 * s} height={46 * s} rx={3} fill="#C69B3A" opacity=".82" />
      </g>

      {/* Mesin Kopi & Monitor POS di atas Counter */}
      <R x={x0 + W * 0.12} y={top - 22} w={28} h={22} fill="#36312E" stroke="#1E1B1A" sw={1.2} rx={3} />
      <R x={x0 + W * 0.12 + 5} y={top - 16} w={18} h={6} fill="#C9A227" rx={1} />
      <R x={x0 + W * 0.66} y={top - 19} w={24} h={15} fill="#252220" stroke="#534C48" sw={1.2} rx={2} />
      <R x={x0 + W * 0.66 + 9} y={top - 4} w={6} h={4} fill="#444" />

      {/* Badan Meja Kasir / Bar dengan Kisi-Kisi Kayu Jati */}
      <R x={x0} y={top + 7} w={W} h={H - 7} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.4} rx={2.5} />
      {Array.from({ length: slats }).map((_, i) => {
        const sx = x0 + 6 + (i * (W - 12)) / Math.max(1, slats - 1);
        return <line key={i} x1={sx} x2={sx} y1={top + 11} y2={FLOOR - 6} stroke={dark} strokeWidth="1.5" opacity=".48" />;
      })}
      {/* Plakat depan / Ukiran */}
      {isCarved ? (
        <JeparaScrollBorder cx={CX} cy={top + H * 0.45} width={W * 0.72} height={12} dark={dark} light={light} />
      ) : (
        <R x={CX - Math.min(44, W * 0.25)} y={top + H * 0.34} w={Math.min(88, W * 0.5)} h={20} fill="#FAF4E8" stroke={dark} sw={1} rx={4} />
      )}
      {!isCarved && (
        <text x={CX} y={top + H * 0.34 + 13} textAnchor="middle" fill="#4B2813" fontSize="8.5" fontWeight="700">
          COUNTER JATI
        </text>
      )}
      {/* Top Table Bar */}
      <R x={x0 - 5} y={top} w={W + 10} h={8} fill="#EFE9DE" stroke="#B7AA96" sw={1.1} rx={2.5} />
      {sheen === 'glossy' && <R x={x0 - 2} y={top + 1.5} w={W + 4} h={2} fill="#fff" opacity=".45" />}

      <HDim x1={x0 - 5} x2={x0 + W + 5} y={FLOOR + 14} label={`Panjang ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 16} label={`T ${h} cm`} />
    </g>
  );
}

// 9D. REPLIKA RAK BUKU / DISPLAY TINGGI (Ambalan, Buku, Pajangan, & Kabinet Bawah)
function RakBukuReplica({ dims, o, c, sheen, view, showScale, pid }) {
  const { w = 140, d = 42, h = 205 } = dims;
  const isSide = view === 'side';
  const span = isSide ? d : w;
  const s = Math.min(250 / span, 175 / h, 1.45);
  const W = span * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.gaya === 'Ukiran Jepara';
  const cabH = H * 0.26;
  const shelfAreaH = H - cabH - 12;
  const shelves = 4;

  if (isSide) {
    return (
      <g>
        {showScale && <HumanScale scale={s} x={Math.max(32, x0 - 38)} />}
        <Shadow w={W + 10} />
        <R x={x0} y={top} w={W} h={H} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.3} rx={2} />
        <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Kedalaman ${d} cm`} />
        <VDim y1={top} y2={FLOOR} x={x0 + W + 14} label={`T ${h} cm`} />
      </g>
    );
  }

  const bookColors = ['#8C3B2B', '#3E5C48', '#B8893A', '#4A5B73', '#6E3F22', '#A66B47'];

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(26, x0 - 32)} />}
      <Shadow w={W + 10} />
      {isCarved && <JeparaCrest cx={CX} y={top + 1} width={W * 0.9} height={18} fill={`url(#${pid}-wood)`} dark={dark} light={light} />}

      {/* Badan Belakang Rak */}
      <R x={x0} y={top} w={W} h={H} fill={shade(c, -10)} stroke={dark} sw={1.4} rx={2} />
      {/* Interior Rak Terbuka */}
      <R x={x0 + 6} y={top + 8} w={W - 12} h={shelfAreaH} fill="#F5ECD9" stroke={dark} sw={1} />

      {/* Ambalan + Isi Buku & Vas Pajangan */}
      {Array.from({ length: shelves }).map((_, i) => {
        const sy = top + 8 + ((i + 1) * shelfAreaH) / shelves;
        const rowH = shelfAreaH / shelves;
        return (
          <g key={i}>
            {/* Deretan buku berwarna hangat */}
            {Array.from({ length: 5 }).map((__, b) => {
              const bw = Math.max(4, (W - 28) / 11);
              const bh = rowH * (0.56 + ((b + i) % 3) * 0.11);
              const bx = x0 + 11 + (i % 2 === 0 ? b * (bw + 1.5) : W - 26 - (b + 1) * (bw + 1.5));
              return (
                <rect
                  key={b}
                  x={bx}
                  y={sy - bh - 3}
                  width={bw}
                  height={bh}
                  rx="1"
                  fill={bookColors[(b + i * 2) % bookColors.length]}
                  stroke="rgba(28,19,14,0.25)"
                  strokeWidth="0.6"
                />
              );
            })}
            {/* Vas pajangan kecil di sisi berlawanan */}
            <ellipse
              cx={i % 2 === 0 ? x0 + W - 22 : x0 + 22}
              cy={sy - 11}
              rx="6"
              ry="8"
              fill="#D4B895"
              stroke="#8C6D4F"
              strokeWidth="0.9"
            />
            <R x={x0 + 5} y={sy - 3} w={W - 10} h={4.5} fill={`url(#${pid}-wood)`} stroke={dark} sw={0.9} />
          </g>
        );
      })}

      {/* Kabinet 2 Pintu di Bagian Bawah */}
      {[0, 1].map((i) => {
        const dw = (W - 12) / 2;
        const dx = x0 + 6 + i * dw;
        return (
          <g key={i}>
            <R x={dx + 1} y={FLOOR - cabH} w={dw - 2} h={cabH - 4} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.1} rx={1.5} />
            <circle cx={i === 0 ? dx + dw - 7 : dx + 7} cy={FLOOR - cabH / 2} r="2.4" fill="#C9A227" />
          </g>
        );
      })}
      {sheen === 'glossy' && <R x={x0 + 4} y={top + 4} w={W * 0.2} h={H - 8} fill="#fff" opacity=".12" />}

      <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Lebar ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 14} label={`T ${h} cm`} />
    </g>
  );
}

// 9E. REPLIKA DIPAN TINGKAT / RANJANG SUSUN JATI
function DipanTingkatReplica({ dims, o, c, view, showScale, pid }) {
  const { w = 205, d = 105, h = 185 } = dims;
  const isSide = view === 'side';
  const span = isSide ? d : w;
  const s = Math.min(255 / span, 170 / h, 1.25);
  const W = span * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const postW = Math.max(6.5, 8 * s);
  const lowerY = FLOOR - 34 * s;
  const upperY = FLOOR - 124 * s;
  const dark = shade(c, -34);

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(24, x0 - 28)} />}
      <Shadow w={W + 10} />
      {/* 2 Tiang Sudut Tinggi */}
      <R x={x0} y={top} w={postW} h={H} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} rx={2} />
      <R x={x0 + W - postW} y={top} w={postW} h={H} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} rx={2} />

      {/* Kasur & Rangka Tingkat Bawah */}
      <R x={x0 + postW} y={lowerY - 18 * s} w={W - 2 * postW} h={18 * s} fill="#F4EFE5" stroke="#CFC6B3" sw={1.1} rx={3} />
      <R x={x0 + postW + 6} y={lowerY - 26 * s} w={26 * s} h={9 * s} fill="#fff" stroke="#DED6C4" sw={0.9} rx={4} />
      <R x={x0 + postW} y={lowerY} w={W - 2 * postW} h={13 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} />

      {/* Kasur & Rangka Tingkat Atas + Pagar Pengaman */}
      <R x={x0 + postW} y={upperY - 18 * s} w={W - 2 * postW} h={18 * s} fill="#F4EFE5" stroke="#CFC6B3" sw={1.1} rx={3} />
      <R x={x0 + postW + 6} y={upperY - 26 * s} w={26 * s} h={9 * s} fill="#fff" stroke="#DED6C4" sw={0.9} rx={4} />
      <R x={x0 + postW} y={upperY} w={W - 2 * postW} h={13 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.2} />
      {/* Pagar Pengaman Atas */}
      <R x={x0 + postW} y={upperY - 34 * s} w={isSide ? W - 2 * postW : W * 0.66} h={6 * s} fill={`url(#${pid}-wood)`} stroke={dark} sw={1} rx={1.5} />
      {Array.from({ length: isSide ? 4 : 6 }).map((_, i) => {
        const rx = x0 + postW + 10 + i * ((isSide ? W - 2 * postW - 20 : W * 0.66 - 20) / (isSide ? 3 : 5));
        return <line key={i} x1={rx} x2={rx} y1={upperY - 28 * s} y2={upperY} stroke={dark} strokeWidth="2.2" />;
      })}

      {/* Tangga Kayu Jati Naik (tampak depan) */}
      {!isSide && (
        <g>
          <R x={x0 + W - postW - 34 * s} y={upperY} w={5} h={FLOOR - upperY} fill={shade(c, 8)} stroke={dark} sw={1} />
          <R x={x0 + W - postW - 10 * s} y={upperY} w={5} h={FLOOR - upperY} fill={shade(c, 8)} stroke={dark} sw={1} />
          {[0.2, 0.42, 0.64, 0.84].map((r) => (
            <R key={r} x={x0 + W - postW - 33 * s} y={upperY + (FLOOR - upperY) * r} w={28 * s} h={4.5} fill={shade(c, 12)} stroke={dark} sw={0.9} />
          ))}
        </g>
      )}

      <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={isSide ? `Lebar ${d} cm` : `Panjang ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 14} label={`T ${h} cm`} />
    </g>
  );
}

// 9F. REPLIKA TANGGA & RAILING KAYU JATI
function TanggaReplica({ dims, c, showScale, pid }) {
  const { w = 240, h = 220 } = dims;
  const s = Math.min(265 / w, 170 / h, 1.15);
  const W = w * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const steps = 6;
  const sw = W / steps;
  const sh = H / steps;
  const dark = shade(c, -34);

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(24, x0 - 24)} />}
      <Shadow w={W} />
      {Array.from({ length: steps }).map((_, i) => {
        const sx = x0 + i * sw;
        const sy = FLOOR - (i + 1) * sh;
        return (
          <g key={i}>
            <R x={sx} y={sy} w={sw + 2} h={FLOOR - sy} fill={shade(c, -8)} stroke={dark} sw={1.1} />
            <R x={sx - 2} y={sy} w={sw + 4} h={5.5} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.1} rx={1.5} />
            {/* Baluster Railing */}
            <line x1={sx + sw * 0.5} x2={sx + sw * 0.5} y1={sy} y2={sy - 46 * s} stroke={shade(c, -12)} strokeWidth="2.6" />
          </g>
        );
      })}
      {/* Handrail miring kayu jati */}
      <line x1={x0 + sw * 0.3} y1={FLOOR - sh - 46 * s} x2={x0 + W} y2={top - 46 * s} stroke={shade(c, 8)} strokeWidth="6" strokeLinecap="round" />
      <line x1={x0 + sw * 0.3} y1={FLOOR - sh - 46 * s} x2={x0 + W} y2={top - 46 * s} stroke={dark} strokeWidth="1.2" strokeLinecap="round" />
      <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={`Bentang ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 14} label={`T ${h} cm`} />
    </g>
  );
}

// 9G. FALLBACK CERDAS (KABINET / KONSOL JATI CUSTOM — BUKAN KOTAK POLOS!)
function KabinetCustomReplica({ dims, o, c, sheen, view, showScale, pid }) {
  const { w = 160, d = 55, h = 135 } = dims;
  const isSide = view === 'side';
  const span = isSide ? d : w;
  const s = Math.min(255 / span, 165 / h, 1.4);
  const W = span * s;
  const H = h * s;
  const x0 = CX - W / 2;
  const top = FLOOR - H;
  const dark = shade(c, -34);
  const light = shade(c, 32);
  const isCarved = o.gaya === 'Ukiran Jepara';
  const title = (o.jenisBebas || 'Custom Khusus Jati').trim().slice(0, 30);

  return (
    <g>
      {showScale && <HumanScale scale={s} x={Math.max(26, x0 - 30)} />}
      <Shadow w={W + 10} />
      {!isSide && isCarved && (
        <JeparaCrest cx={CX} y={top + 1} width={W * 0.84} height={16} fill={`url(#${pid}-wood)`} dark={dark} light={light} />
      )}
      {/* Kaki jati kokoh */}
      <R x={x0 + 5} y={FLOOR - 12} w={9} h={12} fill={dark} rx={1.5} />
      <R x={x0 + W - 14} y={FLOOR - 12} w={9} h={12} fill={dark} rx={1.5} />
      {/* Bodi Utama */}
      <R x={x0} y={top} w={W} h={H - 11} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.4} rx={3} />
      <R x={x0 - 4} y={top} w={W + 8} h={7} fill={shade(c, 14)} stroke={dark} sw={1.1} rx={2} />
      {!isSide && (
        <>
          {/* Ruang rak terbuka atas */}
          <R x={x0 + 8} y={top + 13} w={W - 16} h={H * 0.28} fill="#F5ECD9" stroke={dark} sw={1} rx={1.5} />
          {/* 2 pintu berpanel di bawah */}
          {[0, 1].map((i) => {
            const dw = (W - 16) / 2;
            const dx = x0 + 8 + i * dw;
            return (
              <g key={i}>
                <R x={dx + 1} y={top + 18 + H * 0.28} w={dw - 2} h={H * 0.52 - 14} fill={`url(#${pid}-wood)`} stroke={dark} sw={1.1} rx={2} />
                <circle cx={i === 0 ? dx + dw - 7 : dx + 7} cy={top + 18 + H * 0.45} r="2.4" fill="#C9A227" />
              </g>
            );
          })}
          <text x={CX} y={top + 13 + H * 0.17} textAnchor="middle" fill="#4B2813" fontSize="9" fontWeight="700">
            {title}
          </text>
        </>
      )}
      {sheen === 'glossy' && <R x={x0 + 4} y={top + 8} w={W * 0.22} h={H - 22} fill="#fff" opacity=".14" />}
      <HDim x1={x0} x2={x0 + W} y={FLOOR + 14} label={isSide ? `Kedalaman ${d} cm` : `Panjang ${w} cm`} />
      <VDim y1={top} y2={FLOOR} x={x0 + W + 14} label={`T ${h} cm`} />
    </g>
  );
}

function Lainnya(props) {
  const replica = detectCustomReplica(props.o?.jenisBebas);
  if (replica === 'mimbar') return <MimbarReplica {...props} />;
  if (replica === 'gazebo') return <GazeboReplica {...props} />;
  if (replica === 'kasir') return <KasirReplica {...props} />;
  if (replica === 'rak') return <RakBukuReplica {...props} />;
  if (replica === 'dipan_tingkat') return <DipanTingkatReplica {...props} />;
  if (replica === 'tangga') return <TanggaReplica {...props} />;
  return <KabinetCustomReplica {...props} />;
}

export default function FurniturePreview({
  type,
  dims,
  opts,
  finish,
  sheen = 'doff',
  view = 'front',
  showScale = true,
}) {
  const pid = useId().replace(/:/g, '');
  const finObj = FINISHES.find((f) => f.key === finish) || FINISHES[0];
  const c = finObj.color;
  const common = { dims, o: opts, c, sheen, view, showScale, pid };

  return (
    <svg
      viewBox="-10 0 440 286"
      className="h-auto w-full select-none"
      role="img"
      aria-label="Pratinjau furnitur custom Meuble Le'Koyo"
    >
      <defs>
        <pattern id={`${pid}-wood`} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <rect width="18" height="18" fill={c} />
          <path d="M0 4 Q9 2 18 4 M0 11 Q9 13 18 11 M0 16 Q9 15 18 16" stroke={finObj.grain} strokeWidth="0.9" fill="none" opacity="0.28" />
        </pattern>
        <linearGradient id={`${pid}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ECF7FA" />
          <stop offset=".5" stopColor="#CCE3EB" />
          <stop offset="1" stopColor="#F5FBFC" />
        </linearGradient>
        <linearGradient id={`${pid}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FCF8F1" />
          <stop offset="1" stopColor="#EFE3CE" />
        </linearGradient>
        <filter id={`${pid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <rect x="-10" width="440" height={FLOOR} fill={`url(#${pid}-wall)`} />
      <ellipse cx={CX} cy="30" rx="140" ry="60" fill="#FFFDF8" opacity=".55" />
      <rect x="-10" y={FLOOR} width="440" height="44" fill="#E6D5BA" />
      <line x1="-10" x2="430" y1={FLOOR} y2={FLOOR} stroke="#D3BE9E" strokeWidth="2" />

      {type === 'kitchen' && <Kitchen {...common} />}
      {type === 'meja' && <Meja {...common} />}
      {type === 'kursi' && <Kursi {...common} />}
      {type === 'lemari' && <Lemari {...common} />}
      {type === 'kamar' && <Kamar {...common} />}
      {type === 'buffet' && <Buffet {...common} />}
      {type === 'partisi' && <Partisi {...common} />}
      {type === 'cermin' && <Cermin {...common} />}
      {type === 'lainnya' && <Lainnya {...common} />}
    </svg>
  );
}
