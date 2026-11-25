import { useState } from 'react';
import { LiveOrb } from './ui/LiveOrb';

const tips = [
  'Carga tu video en /app. Frameo lo procesa local en tu navegador: nada se sube.',
  'Elige PNG para máxima calidad o JPG para menor peso.',
  'Los frames salen ordenados como frame_00001.png para que no se desordenen.',
  'Al terminar descargas un ZIP. Todo pasa en tu dispositivo.',
];

export default function AssistantGuide() {
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState(0);

  return (
    <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 140, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      <div
        style={{
          width: 'min(320px, calc(100vw - 32px))',
          padding: '16px 16px 14px',
          borderRadius: 18,
          background: 'rgba(10,14,18,.88)',
          border: '1px solid rgba(255,255,255,.1)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 20px 50px rgba(0,0,0,.35)',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(10px) scale(.98)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .25s ease, transform .25s ease',
        }}
      >
        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#bffcef' }}>Guía Frameo</p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,.86)' }}>{tips[tip]}</p>
        <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
          <a href="/app" style={{ fontSize: 12, fontWeight: 600, color: '#C6FF3D', textDecoration: 'none' }}>Ir a /app</a>
          <button type="button" onClick={() => setTip((t) => (t + 1) % tips.length)} style={{ fontSize: 12, fontWeight: 600, color: '#00F5D4', background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>Otro tip</button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir guía Frameo"
        aria-expanded={open}
        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', filter: 'drop-shadow(0 12px 30px rgba(0,245,212,.22))' }}
      >
        <LiveOrb
          size={88}
          variant="webgl"
          colors={['#00F5D4', '#C6FF3D', '#7CFFE8']}
          interactive
          blink
        />
      </button>
    </div>
  );
}
