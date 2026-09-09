import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ArrowDown, Check, ChevronLeft, ChevronRight, Expand, Grid2X2, Heart, Image, LockKeyhole, Orbit, Pause, Play, RefreshCw, Sparkles, X } from 'lucide-react'
import { albumApi, initialPhotos, nextIndex, photosForMode, parseRemotePhotos, type BabyEffect, type BabyMode, type BabyPhoto } from './babyData'
import { BabyPortrait } from './BabyPortrait'
import { animateTransition, clearSnapshots, snapshot } from './babyEffects'
import { useMediaQuery } from '../common/useMediaQuery'

const modes = [{ value: 'photo', label: '照片', icon: Image }, { value: 'svg', label: '纸片', icon: Sparkles }, { value: '3d', label: '3D', icon: Orbit }] as const
const effects = [{ value: 'mix', label: '惊喜混合' }, { value: 'particles', label: '星尘聚合' }, { value: 'hologram', label: '全息扫描' }, { value: 'fragments', label: '纸片翻页' }] as const

export default function BabyAlbum({ onLock }: { onLock: () => void }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [mode, setMode] = useState<BabyMode>('photo')
  const [effect, setEffect] = useState<BabyEffect>('mix')
  const [active, setActive] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [seconds, setSeconds] = useState(8)
  const [sync, setSync] = useState<'loading' | 'ok' | 'offline'>('loading')
  const [remoteCount, setRemoteCount] = useState(0)
  const abort = useRef<AbortController | null>(null)
  const refresh = useCallback(async () => {
    abort.current?.abort()
    const controller = new AbortController(); abort.current = controller
    setSync('loading')
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(`${albumApi}/album`, { signal: controller.signal, credentials: 'omit', cache: 'no-store' })
      if (!response.ok) throw new Error('相册暂不可用')
      const remote = parseRemotePhotos(await response.json())
      if (abort.current !== controller) return
      setPhotos(previous => {
        const next = [...initialPhotos, ...remote]
        return JSON.stringify(previous) === JSON.stringify(next) ? previous : next
      })
      setRemoteCount(remote.length); setSync('ok')
    } catch { if (abort.current === controller) setSync('offline') }
    finally { clearTimeout(timeout) }
  }, [])
  useEffect(() => {
    void refresh()
    const timer = setInterval(() => { if (!document.hidden) void refresh() }, 60000)
    const visible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', visible)
    return () => { clearInterval(timer); abort.current?.abort(); abort.current = null; document.removeEventListener('visibilitychange', visible); clearSnapshots() }
  }, [refresh])
  const displayed = useMemo(() => photosForMode(photos, mode), [photos, mode])
  const selected = Math.max(0, displayed.findIndex(photo => photo.id === active))
  const changeMode = (next: BabyMode) => {
    const available = photosForMode(photos, next)
    if (active && !available.some(photo => photo.id === active)) setActive(available[0].id)
    setMode(next)
  }
  const open = (photo: BabyPhoto, autoplay = false) => { setPlaying(autoplay); setActive(photo.id) }

  return <>
    <div className="baby-ambient" aria-hidden="true" />
    <header className="baby-header">
      <div className="baby-brand"><Orbit size={28} strokeWidth={1.3} /><span>小小宇宙<small>LITTLE UNIVERSE</small></span></div>
      <div className="baby-header-actions"><span className="baby-family"><span />FAMILY COLLECTION</span><button className="baby-icon" onClick={onLock} aria-label="锁定相册"><LockKeyhole size={18} /></button></div>
    </header>
    <section className="baby-intro">
      <div><p className="baby-eyebrow"><span /> EVERY LITTLE MOMENT IS A STAR</p><h1>你是我的<br /><em>小小宇宙<span>✳</span></em></h1><p className="baby-intro-copy">把长大的瞬间，收藏成一片星空。<br />慢慢看，轻轻点，让时间在这里停一会儿。</p>
        <div className="baby-intro-actions"><button className="baby-primary" onClick={() => open(displayed[0], true)}><Play size={16} fill="currentColor" />开启幻灯片</button><a className="baby-text-action" href="#baby-memories">探索每个瞬间 <ArrowDown size={16} /></a></div>
      </div>
      <div className="baby-orbit-display" aria-hidden="true"><div className="baby-orbit-ring" /><div className="baby-orbit-ring baby-orbit-ring--two" /><span className="baby-orbit-star">✳</span><div className="baby-cover"><BabyPortrait photo={displayed[0]} mode={mode} /></div><div className="baby-memory-seal"><Heart size={13} fill="currentColor" />一些小事 · 无限珍贵</div><span className="baby-orbit-coordinate">25° N / A WORLD OF YOU</span></div>
    </section>
    <section id="baby-memories" className="baby-memories" aria-labelledby="baby-memories-title">
      <div className="baby-collection-bar"><div><p className="baby-eyebrow">THE MEMORY ATLAS</p><h2 id="baby-memories-title">闪闪发光的日常 <sup>{String(displayed.length).padStart(2, '0')}</sup></h2></div><ModeSwitch value={mode} onChange={changeMode} /></div>
      <div className="baby-gallery" data-testid="baby-gallery">
        {displayed.map((photo, index) => <button key={photo.id} className="baby-card" style={{ '--order': Math.min(index, 16), '--tilt': `${[-3, 2, -1, 3, -2][index % 5]}deg`, '--hue': [180, 260, 32, 330, 155][index % 5] } as CSSProperties} onClick={() => open(photo)} aria-label={`打开${photo.title}`}>
          <div className="baby-card-image"><span className="baby-card-number">{String(index + 1).padStart(2, '0')} / MOMENT</span><BabyPortrait photo={photo} mode={mode} /><span className="baby-card-open"><Expand size={17} /></span>{mode === '3d' && <span className="baby-card-3d">3D · 卡通数字人</span>}</div>
          <div className="baby-card-caption"><span>{photo.title}</span><span aria-hidden="true">↗</span></div>
        </button>)}
      </div>
      <div className="baby-collection-foot"><span><span className={`baby-sync-dot ${sync}`} />{sync === 'loading' ? '正在接收新的回忆…' : sync === 'ok' ? `已同步 · ${remoteCount} 张新回忆` : '正在展示已载入的回忆 · 云端暂未连接'}</span><button className="baby-text-action" onClick={() => void refresh()} disabled={sync === 'loading'}><RefreshCw size={14} />刷新相册</button></div>
    </section>
    <footer className="baby-footer"><Heart size={16} /><p>宇宙很大，幸福可以很小。</p><span>COLLECTING LITTLE MOMENTS, FOREVER.</span></footer>
    {active !== null && <BabyViewer photos={displayed} index={selected} onIndex={index => setActive(displayed[index].id)} mode={mode} onMode={changeMode} effect={effect} onEffect={setEffect} playing={playing} onPlaying={setPlaying} seconds={seconds} onSeconds={setSeconds} onClose={() => { setActive(null); setPlaying(false) }} />}
  </>
}

function ModeSwitch({ value, onChange }: { value: BabyMode; onChange: (value: BabyMode) => void }) {
  return <div className="baby-mode-switch" role="group" aria-label="展示风格">{modes.map(({ value: option, label, icon: Icon }) => <button key={option} aria-pressed={value === option} onClick={() => onChange(option)}><Icon size={15} />{label}</button>)}</div>
}

interface ViewerProps {
  photos: BabyPhoto[]; index: number; onIndex: (index: number) => void
  mode: BabyMode; onMode: (mode: BabyMode) => void; effect: BabyEffect; onEffect: (effect: BabyEffect) => void
  playing: boolean; onPlaying: (value: boolean) => void; seconds: number; onSeconds: (value: number) => void; onClose: () => void
}

function BabyViewer(props: ViewerProps) {
  const { photos, index, mode, onMode, effect, onEffect, playing, onPlaying, seconds, onSeconds, onClose } = props
  const dialog = useRef<HTMLDialogElement>(null), stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const latest = useRef(props); latest.current = props
  const pendingTarget = useRef<number | null>(null), watchdog = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const busy = useRef(false), generation = useRef(0), queued = useRef<number | null>(null), cancelAnimation = useRef<(() => void) | null>(null)
  const [transitioning, setTransitioning] = useState(false), [quiet, setQuiet] = useState(false), [notice, setNotice] = useState('')
  const [visible, setVisible] = useState(!document.hidden)
  const [keepAwake, setKeepAwake] = useState(false)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const lastWheel = useRef(0), wheelTotal = useRef(0), pointer = useRef<{ x: number; y: number } | null>(null)
  const navigateRef = useRef<(target: number) => void>(() => {})
  const interrupt = useCallback(() => { generation.current++; clearTimeout(watchdog.current); pendingTarget.current = null; busy.current = false; queued.current = null; cancelAnimation.current?.(); cancelAnimation.current = null; setTransitioning(false) }, [])

  useEffect(() => {
    const element = dialog.current!
    const focus = document.activeElement as HTMLElement | null
    element.showModal()
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { generation.current++; clearTimeout(watchdog.current); cancelAnimation.current?.(); document.body.style.overflow = overflow; element.close(); focus?.focus() }
  }, [])
  useEffect(() => { interrupt() }, [mode, reduced, photos, interrupt])
  useEffect(() => {
    const change = () => { setVisible(!document.hidden); if (document.hidden) interrupt() }
    document.addEventListener('visibilitychange', change)
    return () => document.removeEventListener('visibilitychange', change)
  }, [interrupt])

  navigateRef.current = target => {
    const current = latest.current
    if (busy.current) { queued.current = target; return }
    if (target === current.index) return
    if (reduced || document.hidden) { current.onIndex(target); return }
    busy.current = true; pendingTarget.current = target
    const token = ++generation.current
    const timeout = watchdog.current = setTimeout(() => { if (generation.current === token) { interrupt(); latest.current.onIndex(target) } }, 4500)
    const finish = () => {
      clearTimeout(timeout)
      if (generation.current !== token) return
      cancelAnimation.current?.(); cancelAnimation.current = null
      latest.current.onIndex(target); setTransitioning(false); busy.current = false; pendingTarget.current = null
      const pending = queued.current; queued.current = null
      if (pending !== null && pending !== target) requestAnimationFrame(() => { if (generation.current === token) navigateRef.current(pending) })
    }
    void Promise.all([snapshot(current.photos[current.index], current.mode, stage.current), snapshot(current.photos[target], current.mode, stage.current)]).then(([from, to]) => {
      if (generation.current !== token || !canvas.current) { clearTimeout(timeout); return }
      const chosen = current.effect === 'mix' ? ['particles', 'hologram', 'fragments'][target % 3] : current.effect
      setTransitioning(true)
      cancelAnimation.current = animateTransition(canvas.current, from, to, chosen, finish)
    }).catch(() => { if (generation.current !== token) return; setNotice('这次转场已轻柔跳过'); finish() })
  }
  const advance = useCallback((direction: number) => {
    const p = latest.current
    navigateRef.current(nextIndex(queued.current ?? pendingTarget.current ?? p.index, direction, p.photos.length))
  }, [])

  useEffect(() => {
    if (!playing || !visible || transitioning) return
    const timer = setTimeout(() => advance(1), seconds * 1000)
    return () => clearTimeout(timer)
  }, [playing, visible, transitioning, seconds, index, advance])

  useEffect(() => {
    let disposed = false, lock: WakeLockSentinel | undefined
    if (playing && visible && 'wakeLock' in navigator) {
      void navigator.wakeLock.request('screen').then(value => {
        if (disposed) { void value.release(); return }
        lock = value; setKeepAwake(true)
        value.addEventListener('release', () => { if (!disposed) setKeepAwake(false) })
      }).catch(() => setKeepAwake(false))
    }
    return () => { disposed = true; if (lock) void lock.release().catch(() => {}); setKeepAwake(false) }
  }, [playing, visible])
  useEffect(() => {
    if (!playing) { setQuiet(false); return }
    const timer = setTimeout(() => setQuiet(true), 6000)
    return () => clearTimeout(timer)
  }, [playing, index])
  useEffect(() => {
    const element = dialog.current!
    const wheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest('select,button,.baby-filmstrip')) return
      event.preventDefault()
      if (performance.now() - lastWheel.current < 850) return
      wheelTotal.current += (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * (event.deltaMode === 1 ? 16 : 1)
      if (Math.abs(wheelTotal.current) < 45) return
      advance(wheelTotal.current > 0 ? 1 : -1); wheelTotal.current = 0; lastWheel.current = performance.now()
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [advance])

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (dialog.current?.requestFullscreen) await dialog.current.requestFullscreen()
      else setNotice('已进入沉浸模式；可添加到 iPad 主屏幕以全屏打开')
    } catch { setNotice('已进入沉浸模式；可添加到主屏幕以全屏打开') }
    setQuiet(true)
  }
  const current = photos[index]
  return <dialog className="baby-viewer" ref={dialog} aria-label="回忆放映室" data-quiet={quiet} data-playing={playing} onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={event => {
    if ((event.target as HTMLElement).matches('input,select')) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); advance(event.key === 'ArrowRight' ? 1 : -1) }
    if (event.code === 'Space' && !(event.target as HTMLElement).closest('button')) { event.preventDefault(); onPlaying(!playing) }
  }}>
    <div className="baby-viewer-nebula" aria-hidden="true" />
    <div className="baby-viewer-top baby-viewer-controls" inert={quiet || undefined}><div className="baby-viewer-brand"><Orbit size={22} /><span>回忆放映室<small>MEMORY THEATER</small></span></div><ModeSwitch value={mode} onChange={onMode} /><div className="baby-viewer-top-actions"><button className="baby-icon" onClick={() => void fullscreen()} aria-label="全屏播放"><Expand size={20} /></button><button className="baby-icon" onClick={onClose} aria-label="关闭放映室"><X size={22} /></button></div></div>
    <div className="baby-viewer-main" onPointerDown={event => { if (event.button === 0 && !(event.target as HTMLElement).closest('button')) pointer.current = { x: event.clientX, y: event.clientY } }} onPointerUp={event => {
      if (!pointer.current) return
      const dx = event.clientX - pointer.current.x, dy = event.clientY - pointer.current.y; pointer.current = null
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) advance(dx < 0 ? 1 : -1)
      else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) setQuiet(value => !value)
    }} onPointerCancel={() => { pointer.current = null }}>
      <button className="baby-viewer-prev baby-icon baby-viewer-controls" inert={quiet || undefined} onClick={() => advance(-1)} aria-label="上一张"><ChevronLeft size={28} /></button>
      <div className="baby-stage" ref={stage} data-transitioning={transitioning} data-testid="baby-stage" data-photo-id={current.id} data-mode={mode}>
        <div className="baby-stage-orbit" aria-hidden="true" /><div className="baby-stage-visual"><BabyPortrait photo={current} mode={mode} live /></div><canvas ref={canvas} className="baby-transition" aria-hidden="true" /><span className="baby-stage-star" aria-hidden="true">✳</span>
      </div>
      <button className="baby-viewer-next baby-icon baby-viewer-controls" inert={quiet || undefined} onClick={() => advance(1)} aria-label="下一张"><ChevronRight size={28} /></button>
    </div>
    <div className="baby-viewer-bottom baby-viewer-controls" inert={quiet || undefined}>
      <div className="baby-viewer-caption"><div><p className="baby-eyebrow">MOMENT {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</p><h2>{current.title}</h2></div><span>{mode === '3d' ? '我的小小分身 · 轻移指尖，或转一圈' : mode === 'svg' ? '一页小日常 · 轻移指尖，翻看回忆' : '左右滑动 · 方向键 · 滚轮切换'}</span></div>
      <div className="baby-filmstrip" aria-label="选择照片">{photos.map((photo, i) => <button key={photo.id} aria-label={`查看${photo.title}`} aria-pressed={i === index} onClick={() => navigateRef.current(i)} ref={element => { if (i === index) element?.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }}><BabyPortrait photo={photo} mode={mode} /></button>)}</div>
      <div className="baby-playback"><button className="baby-play-toggle" onClick={() => onPlaying(!playing)} aria-label={playing ? '暂停幻灯片' : '播放幻灯片'}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}<span>{playing ? '暂停' : '播放'}</span></button><label>间隔<select aria-label="播放间隔" value={seconds} onChange={event => onSeconds(Number(event.target.value))}><option value={5}>5 秒</option><option value={8}>8 秒</option><option value={15}>15 秒</option><option value={30}>30 秒</option></select></label><label>转场<select aria-label="转场效果" value={effect} onChange={event => onEffect(event.target.value as BabyEffect)}>{effects.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><span className="baby-awake">{keepAwake ? <><Check size={13} />屏幕常亮</> : playing ? '轻触画面唤回控件' : '慢慢看，不着急'}</span><button className="baby-icon" onClick={onClose} aria-label="返回相册"><Grid2X2 size={18} /></button></div>
      <p className="baby-viewer-notice" role="status">{notice}</p>
    </div>
    {quiet && <button className="baby-wake-controls" onClick={() => setQuiet(false)} aria-label="显示播放控件">轻触唤回 <span>·</span></button>}
    {playing && <div className="baby-timer" key={`${index}-${seconds}-${visible}-${transitioning}`} style={{ '--duration': `${seconds}s`, animationPlayState: transitioning || !visible ? 'paused' : 'running' } as CSSProperties} aria-hidden="true" />}
  </dialog>
}
