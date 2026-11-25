import { zipSync } from 'fflate';

export type FrameFormat = 'png' | 'jpg';
export type ExtractMode = 'all' | 'every';

export interface ExtractOptions {
  format: FrameFormat;
  mode: ExtractMode;
  everyN: number;
  fps: number;
  quality: number;
  signal?: AbortSignal;
  onProgress?: (p: { phase: 'loading' | 'extracting' | 'zipping'; current: number; total: number; percent: number }) => void;
  onFrame?: (frame: { index: number; name: string; preview: string }) => void;
}

export interface ExtractResult {
  blob: Blob;
  count: number;
  filename: string;
}

const pad = (n: number, size: number) => String(n).padStart(size, '0');
const baseName = (name: string) => name.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_') || 'video';

async function canvasToBytes(canvas: HTMLCanvasElement, format: FrameFormat, quality: number): Promise<Uint8Array> {
  const type = format === 'png' ? 'image/png' : 'image/jpeg';
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo crear la imagen del frame.'))), type, format === 'jpg' ? quality : undefined)
  );
  return new Uint8Array(await blob.arrayBuffer());
}

function waitEvent(target: EventTarget, name: string, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => { cleanup(); reject(new DOMException('Proceso cancelado.', 'AbortError')); };
    const onEvent = () => { cleanup(); resolve(); };
    const onErr = () => { cleanup(); reject(new Error('No se pudo leer el video. Verifica que el archivo no esté dañado.')); };
    const cleanup = () => {
      target.removeEventListener(name, onEvent);
      target.removeEventListener('error', onErr);
      signal?.removeEventListener('abort', onAbort);
    };
    if (signal?.aborted) return onAbort();
    signal?.addEventListener('abort', onAbort, { once: true });
    target.addEventListener(name, onEvent, { once: true });
    target.addEventListener('error', onErr, { once: true });
  });
}

export async function extractVideoToZip(file: File, opts: ExtractOptions): Promise<ExtractResult> {
  if (!file.type.startsWith('video/')) throw new Error('Formato no soportado. Usa un archivo de video válido.');
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;

  try {
    opts.onProgress?.({ phase: 'loading', current: 0, total: 1, percent: 2 });
    await waitEvent(video, 'loadedmetadata', opts.signal);
    if (opts.signal?.aborted) throw new DOMException('Proceso cancelado.', 'AbortError');
    if (!video.videoWidth || !video.videoHeight) throw new Error('El video no tiene dimensiones válidas.');
    if (!isFinite(video.duration) || video.duration <= 0) throw new Error('No se pudo leer la duración del video.');

    const fps = Math.max(1, Math.min(60, opts.fps || 30));
    const step = opts.mode === 'every' ? Math.max(1, opts.everyN) / fps : 1 / fps;
    const times: number[] = [];
    for (let t = 0; t < video.duration; t += step) times.push(Math.min(t, video.duration - 0.001));
    if (!times.length) times.push(0);
    const total = times.length;
    if (total > 4000) throw new Error(`Este ajuste generaría ${total} frames. Reduce la duración, baja FPS o usa "Cada N" para evitar problemas de memoria.`);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('No se pudo crear el canvas para extraer frames.');

    const thumb = document.createElement('canvas');
    const thumbW = Math.min(240, video.videoWidth);
    const thumbH = Math.max(1, Math.round((thumbW / video.videoWidth) * video.videoHeight));
    thumb.width = thumbW; thumb.height = thumbH;
    const tctx = thumb.getContext('2d');

    const files: Record<string, Uint8Array> = {};
    const ext = opts.format === 'png' ? 'png' : 'jpg';
    let saved = 0;

    for (let i = 0; i < times.length; i++) {
      if (opts.signal?.aborted) throw new DOMException('Proceso cancelado.', 'AbortError');
      video.currentTime = times[i];
      await waitEvent(video, 'seeked', opts.signal);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const bytes = await canvasToBytes(canvas, opts.format, opts.quality);
      saved++;
      const name = `frame_${pad(saved, 5)}.${ext}`;
      files[name] = bytes;
      if (opts.onFrame && tctx) {
        tctx.drawImage(canvas, 0, 0, thumbW, thumbH);
        try { opts.onFrame({ index: saved, name, preview: thumb.toDataURL('image/jpeg', 0.72) }); } catch {}
      }
      if (i % 2 === 0) await new Promise((r) => setTimeout(r, 0));
      opts.onProgress?.({ phase: 'extracting', current: saved, total, percent: Math.round(((i + 1) / total) * 100) });
    }

    if (opts.signal?.aborted) throw new DOMException('Proceso cancelado.', 'AbortError');
    opts.onProgress?.({ phase: 'zipping', current: saved, total: saved, percent: 100 });
    await new Promise((r) => setTimeout(r, 30));
    const zipped = zipSync(files, { level: opts.format === 'jpg' ? 0 : 6 });
    const buf = zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer;
    const zipBlob = new Blob([buf], { type: 'application/zip' });
    return { blob: zipBlob, count: saved, filename: `${baseName(file.name)}_frames.zip` };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
