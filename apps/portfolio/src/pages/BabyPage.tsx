import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ArrowRight, LockKeyhole, Orbit } from 'lucide-react'
import '../styles/baby.css'

const BabyAlbum = lazy(() => import('../components/baby/BabyAlbum'))

// Deliberately a frontend family gate, not server authentication.
export function BabyPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const manifest = document.createElement('link'); manifest.rel = 'manifest'; manifest.href = '/baby.webmanifest'
    const icon = document.createElement('link'); icon.rel = 'apple-touch-icon'; icon.href = '/baby-icons/icon-192.png'
    const capable = document.createElement('meta'); capable.name = 'apple-mobile-web-app-capable'; capable.content = 'yes'
    const theme = document.createElement('meta'); theme.name = 'theme-color'; theme.content = '#0b1219'
    document.head.append(manifest, icon, capable, theme)
    return () => { manifest.remove(); icon.remove(); capable.remove(); theme.remove() }
  }, [])
  useEffect(() => {
    if (!unlocked && !dialog.current?.open) dialog.current?.showModal()
  }, [unlocked])

  return <main className="baby-world">
    {unlocked ? <Suspense fallback={<div className="baby-loading" role="status"><Orbit size={38} />正在点亮小小宇宙…</div>}>
      <BabyAlbum onLock={() => { setPassword(''); setUnlocked(false) }} />
    </Suspense> : <>
      <div className="baby-gate-sky" aria-hidden="true"><div className="baby-planet" /><span>LITTLE UNIVERSE</span></div>
      <dialog ref={dialog} className="baby-gate" aria-labelledby="baby-gate-title" onCancel={event => event.preventDefault()}>
        <div className="baby-gate-icon"><Orbit size={32} strokeWidth={1.2} /></div>
        <p className="baby-eyebrow">A LITTLE WORLD, JUST FOR US</p>
        <h1 id="baby-gate-title">小小宇宙</h1>
        <p className="baby-muted">输入我们的暗号，开启一段星光旅行。</p>
        <form onSubmit={event => {
          event.preventDefault()
          if (password === '0321') { dialog.current?.close(); setUnlocked(true); setError(false) }
          else { setError(true); setPassword('') }
        }}>
          <label htmlFor="baby-password">家庭暗号</label>
          <div className="baby-password-wrap"><LockKeyhole size={17} /><input id="baby-password" type="password" inputMode="numeric" autoComplete="off" autoFocus maxLength={4} value={password} placeholder="· · · ·" aria-invalid={error} aria-describedby={error ? 'baby-password-error' : undefined} onChange={event => { setPassword(event.target.value); setError(false) }} /></div>
          {error && <p id="baby-password-error" className="baby-error" role="alert">暗号不对，再试一次吧。</p>}
          <button className="baby-primary" type="submit">进入小小宇宙 <ArrowRight size={18} /></button>
        </form>
        <span className="baby-gate-note">MADE OF LOVE & LITTLE MOMENTS</span>
      </dialog>
    </>}
  </main>
}
