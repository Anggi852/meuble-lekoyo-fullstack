import { useCallback, useEffect, useRef, useState } from 'react';

// Efek mesin ketik. skip() langsung menampilkan seluruh teks.
export function useTypewriter(text, speed = 30) {
  const [state, setState] = useState({ text: '', count: 0 });
  const countRef = useRef(0);
  const count = state.text === text ? state.count : 0;

  useEffect(() => {
    if (!text) return undefined;
    countRef.current = 0;
    const id = setInterval(() => {
      countRef.current = Math.min(countRef.current + 1, text.length);
      setState({ text, count: countRef.current });
      if (countRef.current >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const skip = useCallback(() => {
    countRef.current = text?.length ?? 0;
    setState({ text, count: text?.length ?? 0 });
  }, [text]);

  return { shown: text ? text.slice(0, count) : '', done: !text || count >= text.length, skip };
}
