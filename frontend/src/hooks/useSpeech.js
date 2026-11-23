import { useCallback, useEffect, useRef, useState } from 'react';
import { safeGet, safeSet } from '../utils/format';

const KEY = 'lekoyo_voice';
const supported =
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

// Pilih suara Indonesia terbaik yang tersedia di perangkat.
// Suara "Natural/Online" (Edge: Gadis Online) jauh lebih halus dibanding suara standar.
function scoreVoice(v) {
  const n = `${v.name} ${v.voiceURI}`;
  let sc = 0;
  if (/natural|neural|online/i.test(n)) sc += 100;
  if (/gadis|damayanti|female|wanita|perempuan/i.test(n)) sc += 50;
  if (/google/i.test(n)) sc += 30;
  if (/ardi|male|pria|laki/i.test(n) && !/female/i.test(n)) sc -= 200; // hindari suara laki-laki
  return sc;
}

function pickVoice() {
  if (!supported) return null;
  const list = window.speechSynthesis.getVoices().filter((v) => /^id([-_]|$)/i.test(v.lang));
  if (!list.length) return null;
  return [...list].sort((x, y) => scoreVoice(y) - scoreVoice(x))[0];
}

export function useSpeech() {
  const [voiceOn, setVoiceOnState] = useState(() => safeGet(KEY) === '1');
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef(null);
  const tokenRef = useRef(0);

  useEffect(() => {
    if (!supported) return undefined;
    const load = () => { voiceRef.current = pickVoice(); };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    tokenRef.current += 1;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // Bicara per kalimat supaya tidak terpotong (batas ~15 detik di Chrome)
  const speak = useCallback((text, onEnd) => {
    if (!supported || !text) { onEnd?.(); return; }
    stop();
    const token = tokenRef.current;
    const chunks = (text.match(/[^.!?]+[.!?]*/g) || [text]).map((s) => s.trim()).filter(Boolean);
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = 'id-ID';
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 1.22; // lebih lincah, tidak lambat
      u.pitch = 1.12; // sedikit lebih tinggi agar ceria, tetap terdengar natural
      if (i === 0) u.onstart = () => { if (tokenRef.current === token) setSpeaking(true); };
      if (i === chunks.length - 1) {
        const finish = () => {
          if (tokenRef.current !== token) return;
          setSpeaking(false);
          onEnd?.();
        };
        u.onend = finish;
        u.onerror = finish;
      }
      window.speechSynthesis.speak(u);
    });
  }, [stop]);

  const setVoiceOn = useCallback((on) => {
    setVoiceOnState(on);
    safeSet(KEY, on ? '1' : '0');
    if (!on) stop();
  }, [stop]);

  return { supported, voiceOn, setVoiceOn, speaking, speak, stop };
}
