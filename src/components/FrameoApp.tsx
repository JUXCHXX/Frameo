import { useEffect, useMemo, useRef, useState } from 'react';
import ElectricLogo from './ui/ElectricLogo.jsx';
import Folder from './ui/Folder.jsx';
import { extractVideoToZip, type FrameFormat, type ExtractMode } from '../lib/frame-extractor';
import './FrameoApp.css';

type Phase = 'idle' | 'loading' | 'extracting' | 'zipping' | 'done' | 'error' | 'cancelled';
type FrameItem = { title: string; image: string };

const fmtBytes = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const fmtTime = (sec: number) => {
  if (!isFinite(sec)) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

async function detectFps(video: HTMLVideoElement): Promise<number | null> {
  const rvfc = (video as any).requestVideoFrameCallback;
  if (!rvfc || !isFinite(video.duration) || video.duration < 0.5) return null;
  return new Promise((resolve) => {
    let frames = 0;
    let start = -1;
    const done = (v: number | null) => { clearTimeout(maxWait); try { video.pause(); } catch {} resolve(v); };
    const maxWait = setTimeout(() => done(null), 900);
    const step = (_: number, meta: any) => {
      if (start < 0) start = meta.mediaTime;
      frames++;
      const elapsed = meta.mediaTime - start;
      if (elapsed >= 0.5) {
        const fps = Math.round(frames / elapsed);
        done(fps >= 8 && fps <= 120 ? fps : null);
        return;
      }
      rvfc(step);
    };
    video.muted = true;
    video.defaultMuted = true;
    video.play().then(() => rvfc(step)).catch(() => done(null));
  });
}

export default function FrameoApp() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [format, setFormat] = useState<FrameFormat>('png');
  const [mode, setMode] = useState<ExtractMode>('all');
  const [everyN, setEveryN] = useState(30);
  const [fps, setFps] = useState(30);
  const [detectedFps, setDetectedFps] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Listo para convertir.');
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [zipName, setZipName] = useState('');
  const [zipSize, setZipSize] = useState(0);
  const [resultCount, setResultCount] = useState(0);
  const [frameItems, setFrameItems] = useState<FrameItem[]>([]);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const downloadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);
  useEffect(() => () => { if (zipUrl) URL.revokeObjectURL(zipUrl); }, [zipUrl]);

  const estimated = useMemo(() => {
    if (!duration) return null;
    const f = Math.max(1, Math.min(60, Math.floor(fps || 30)));
    const n = Math.max(1, Math.floor(everyN || 1));
    const step = mode === 'every' ? n / f : 1 / f;
    return Math.max(1, Math.ceil(duration / step));
  }, [duration, fps, everyN, mode]);

  const tooMany = (estimated ?? 0) > 4000;
  const heavy = !!dims && (dims.w >= 3840 || dims.h >= 2160 || (estimated ?? 0) > 1800);
  const busy = ['loading', 'extracting', 'zipping'].includes(phase);
  const canStart = !!file && !busy && !tooMany;

  const autoTune = (dur: number, w: number, h: number, fpsGuess?: number | null) => {
    let nextFps = fpsGuess ?? (h >= 2160 || w >= 3840 ? 24 : 30);
    nextFps = Math.max(1, Math.min(60, nextFps));
    const maxFrames = 4000;
    if (dur * nextFps > maxFrames) nextFps = Math.max(1, Math.floor(maxFrames / dur));
    setFps(nextFps);
    if (dur * nextFps > 2000 || h >= 2160 || w >= 3840) setFormat('jpg'); else setFormat('png');
  };

  const clearZip = () => {
    setZipUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
    setZipBlob(null);
    setZipName(''); setZipSize(0); setResultCount(0);
  };

  const pickFile = async (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      setError('Formato no soportado. Carga un archivo de video válido (MP4, WebM, MOV...).');
      setPhase('error');
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    clearZip();
    setFrameItems([]);
    const url = URL.createObjectURL(f);
    setFile(f); setVideoUrl(url); setPhase('idle'); setError(''); setProgress(0);
    setDetectedFps(null);
    setStatus('Video cargado. Ajustando configuración automáticamente...');
  };

  const onVideoMeta = async (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    const dur = v.duration || 0;
    const w = v.videoWidth || 0;
    const h = v.videoHeight || 0;
    setDuration(dur); setDims({ w, h });
    autoTune(dur, w, h, null);
    setStatus('Detectando FPS y ajustando configuración...');
    const found = await detectFps(v);
    try { v.currentTime = 0; } catch {}
    if (found) {
      setDetectedFps(found);
      autoTune(dur, w, h, found);
      setStatus(`Video listo. FPS detectado: ${found}. Configuración ajustada automáticamente.`);
    } else {
      setStatus('Video listo. Configuración ajustada automáticamente.');
    }
  };

  const start = async () => {
    if (!file) return;
    clearZip();
    setFrameItems([]);
    setError(''); setPhase('loading'); setProgress(2); setStatus('Cargando video...');
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const res = await extractVideoToZip(file, {
        format, mode, everyN: Math.max(1, Math.floor(everyN)), fps: Math.max(1, Math.min(60, Math.floor(fps))), quality: 0.92,
        signal: ctrl.signal,
        onFrame: (frame) => {
          setFrameItems((prev) => {
            const next = [...prev, { title: frame.name, image: frame.preview }];
            return next.slice(-6);
          });
        },
        onProgress: (p) => {
          setPhase(p.phase);
          setProgress(Math.max(2, Math.min(100, Math.round(p.percent))));
          if (p.phase === 'extracting') { setStatus(`Extrayendo frames... ${p.current} guardados`); setResultCount(p.current); }
          if (p.phase === 'zipping') setStatus('Empaquetando ZIP...');
          if (p.phase === 'loading') setStatus('Cargando video...');
        },
      });
      const url = URL.createObjectURL(res.blob);
      setZipUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
      setZipBlob(res.blob);
      setZipName(res.filename);
      setZipSize(res.blob.size);
      setResultCount(res.count);
      setPhase('done'); setProgress(100); setStatus(`Listo. ${res.count} frames exportados.`);
      setTimeout(() => downloadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
    } catch (e: any) {
      if (e?.name === 'AbortError') { setPhase('cancelled'); setStatus('Proceso cancelado.'); setProgress(0); }
      else { setPhase('error'); setError(e?.message || 'Ocurrió un error al procesar el video.'); setStatus('Error al procesar.'); }
    } finally { abortRef.current = null; }
  };

  const cancel = () => abortRef.current?.abort();
  const downloadZip = () => {
    if (!zipBlob) return;
    const name = zipName || 'frameo_frames.zip';
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  const reset = () => {
    abortRef.current?.abort();
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    clearZip();
    setFile(null); setVideoUrl(null); setDuration(0); setDims(null); setDetectedFps(null);
    setPhase('idle'); setProgress(0); setStatus('Listo para convertir.'); setError('');
    setFrameItems([]);
  };

  const folderItems = frameItems.length ? frameItems : (file ? [{ title: file.name }, { title: 'Frames listos' }, { title: 'ZIP local' }] : [{ title: 'Carga un video' }, { title: 'Extrae frames' }, { title: 'Descarga ZIP' }]);

  return (
    <div className="frameo-app">
      <div className="motor-shell container">
        <div className="motor-head">
          <span className="eyebrow">Motor de Frameo</span>
          <h1>Convierte tu video en <span className="grad-text">frames</span></h1>
          <p>Carga o arrastra tu video. Frameo ajusta la configuración automáticamente y genera un ZIP local, sin subir nada.</p>
        </div>

        <section className="motor-stage glass">
          <div className="motor-glow" aria-hidden />
          <div className="motor-core">
            <div
              className={`drop-core ${drag ? 'drag' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); void pickFile(e.dataTransfer.files?.[0] ?? null); }}
            >
              {!file ? (
                <div className="drop-empty">
                  <div className="motor-orbit" aria-hidden>
                    <div className="orbit-ring" />
                    <div className="orbit-ring r2" />
                    <div className="orbit-ring r3" />
                    <div className="drop-loader">
                      <ElectricLogo src="/isotipo.svg" color="#00F5D4" glowColor="#C6FF3D" scale={0.78} strands={3} bend={0.35} crackle={0.55} arcs={1} speed={1.8} interactive={false} />
                    </div>
                  </div>
                  <p className="drop-title">Arrastra tu video aquí</p>
                  <p className="drop-sub">o selecciónalo desde tu computador. El procesamiento es 100% local.</p>
                  <button className="btn btn-primary" type="button" onClick={() => inputRef.current?.click()}>Seleccionar video</button>
                </div>
              ) : (
                <div className="file-card">
                  <div className="preview-wrap glass-soft">
                    <video src={videoUrl || undefined} className="preview" onLoadedMetadata={(e) => void onVideoMeta(e)} controls muted playsInline preload="metadata">
                      <track kind="captions" src="data:text/vtt;charset=utf-8,WEBVTT" srcLang="es" label="Captions" />
                    </video>
                  </div>
                  <div className="file-meta">
                    <strong>{file.name}</strong>
                    <span>{fmtBytes(file.size)}{dims ? ` · ${dims.w}×${dims.h}` : ''}{duration ? ` · ${fmtTime(duration)}` : ''}{detectedFps ? ` · ${detectedFps} FPS detectados` : ''}</span>
                  </div>
                  <div className="file-actions">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => inputRef.current?.click()} disabled={busy}>Cambiar video</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={reset} disabled={busy}>Quitar</button>
                  </div>
                </div>
              )}
              <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e) => { void pickFile(e.target.files?.[0] ?? null); e.currentTarget.value = ''; }} />
            </div>

            <div className="control-core">
              <div className="control-block glass-soft">
                <div className="block-head"><span>Configuración automática</span><span className="pill">{busy ? 'Procesando' : 'Auto'}</span></div>
                <div className="auto-grid">
                  <div className="auto-item"><small>Formato</small><strong>{format.toUpperCase()}</strong></div>
                  <div className="auto-item"><small>FPS base</small><strong>{fps}</strong></div>
                  <div className="auto-item"><small>Modo</small><strong>{mode === 'all' ? 'Todos' : `Cada ${everyN}`}</strong></div>
                  <div className="auto-item"><small>Estimado</small><strong>{estimated ? `~${estimated}` : '—'}</strong></div>
                </div>
                <div className="controls-row">
                  <label className="mini-control"><span>Formato</span>
                    <div className="segmented"><button type="button" className={format==='png'?'active':''} onClick={()=>setFormat('png')} disabled={busy}>PNG</button><button type="button" className={format==='jpg'?'active':''} onClick={()=>setFormat('jpg')} disabled={busy}>JPG</button></div>
                  </label>
                  <label className="mini-control"><span>Modo</span>
                    <div className="segmented"><button type="button" className={mode==='all'?'active':''} onClick={()=>setMode('all')} disabled={busy}>Todos</button><button type="button" className={mode==='every'?'active':''} onClick={()=>setMode('every')} disabled={busy}>Cada N</button></div>
                  </label>
                </div>
                <div className="controls-row">
                  {mode === 'every' && <label className="mini-control"><span>Cada N cuadros</span><input type="number" min={1} max={500} value={everyN} onChange={(e)=>setEveryN(Number(e.target.value)||1)} disabled={busy} /></label>}
                  <label className="mini-control"><span>FPS base</span><input type="number" min={1} max={60} value={fps} onChange={(e)=>setFps(Number(e.target.value)||30)} disabled={busy} /></label>
                </div>
                <p className="auto-note">{mode === 'every' ? `Guarda 1 frame cada ${Math.max(1,everyN)} cuadros.` : `Muestrea por FPS base.`} Se ajusta al cargar, pero puedes afinarlo.</p>
              </div>

              <div className="control-block glass-soft">
                <div className="actions">
                  <button className="btn btn-primary" type="button" onClick={() => void start()} disabled={!canStart}>{busy ? 'Procesando...' : 'Extraer frames'}</button>
                  {busy ? <button className="btn btn-ghost" type="button" onClick={cancel}>Cancelar</button> : null}
                </div>
                <div className={`progress-block ${busy ? 'busy' : ''}`} aria-live="polite">
                  <div className="progress-top"><span>{status}</span><span>{progress}%</span></div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                  {busy && <div className="generating"><div className="generating-logo"><ElectricLogo src="/isotipo.svg" color="#00F5D4" glowColor="#C6FF3D" scale={0.68} strands={3} bend={0.35} crackle={0.5} arcs={1} speed={1.8} interactive={false} /></div><span>Motor Frameo generando frames...</span></div>}
                </div>

                <div className="folder-zone">
                  <div className="folder-copy">
                    <span className="folder-kicker">Salida en vivo</span>
                    <strong>{busy ? 'Guardando frames en carpeta' : phase === 'done' ? 'Frames listos en tu ZIP' : 'Tus frames aparecerán aquí'}</strong>
                    <p>{busy ? `${resultCount || frameItems.length} frames procesados. Se van almacenando localmente antes de empaquetar.` : phase === 'done' ? `${resultCount} frames empaquetados en ${zipName}.` : 'Cuando inicies, verás el proceso y las imágenes entrando a la carpeta.'}</p>
                  </div>
                  <div className="folder-stage-wrap">
                    <Folder
                      label={phase === 'done' ? 'ZIP' : 'Frames'}
                      items={folderItems}
                      mode="book"
                      variant="glass"
                      layout={busy ? 'stack' : 'spread'}
                      color="#00F5D4"
                      paperColor="#f7fbff"
                      size={0.72}
                      open={busy || phase === 'done' ? true : undefined}
                      openOn="click"
                      peek={true}
                      intro={true}
                      theme="dark"
                    />
                  </div>
                </div>

                {tooMany && <div className="alert warn">El ajuste generaría ~{estimated} frames. Reduce FPS o usa "Cada N".</div>}
                {!tooMany && heavy && !busy && phase !== 'done' && <div className="alert warn">Video pesado/4K: puede calentar el equipo. Frameo ajusta automáticamente, pero puedes bajar FPS o usar JPG.</div>}
                {error && <div className="alert error">{error}</div>}
                {phase === 'cancelled' && <div className="alert warn">Proceso cancelado. Puedes intentarlo de nuevo.</div>}
                {phase === 'done' && zipBlob && (
                  <div ref={downloadRef} style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto', padding: '1rem 1.1rem', borderRadius: 16, background: 'linear-gradient(180deg, rgba(0,245,212,.16), rgba(0,245,212,.07))', boxShadow: 'inset 0 0 0 1px rgba(0,245,212,.22)', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '1rem', color: '#dffff7' }}>ZIP listo para descargar</strong>
                      <p style={{ margin: '.2rem 0 0', color: 'rgba(255,255,255,.74)', fontSize: '.85rem' }}>{resultCount} frames · {fmtBytes(zipSize)} · {zipName}</p>
                    </div>
                    <button type="button" aria-label={`Descargar ZIP ${zipName}`} onClick={downloadZip} style={{ position: 'relative', zIndex: 60, pointerEvents: 'auto', cursor: 'pointer', border: 'none', borderRadius: 999, padding: '.95rem 1.3rem', fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit', color: '#061014', background: 'linear-gradient(135deg, #00F5D4, #C6FF3D)', boxShadow: '0 10px 30px rgba(0,245,212,.22)' }}>Descargar ZIP</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
