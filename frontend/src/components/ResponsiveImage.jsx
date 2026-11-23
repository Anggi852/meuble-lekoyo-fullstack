import { useState } from 'react';
import { buildImageSrcSet, resizeImageUrl } from '../utils/image';

// Komponen gambar adaptif: otomatis memilih resolusi terbaik sesuai layar HP, tablet, atau laptop.
export default function ResponsiveImage({
  src,
  alt = '',
  sizes = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw',
  widths = [400, 640, 960, 1280],
  defaultWidth = 800,
  priority = false,
  className = '',
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const safeSrc = failed ? '/toko-mobile.jpg' : resizeImageUrl(src, defaultWidth);
  const srcSet = failed ? undefined : buildImageSrcSet(src, widths);

  return (
    <img
      src={safeSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (!failed) setFailed(true);
        setLoaded(true);
      }}
      className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-85'} ${className}`}
      {...rest}
    />
  );
}
