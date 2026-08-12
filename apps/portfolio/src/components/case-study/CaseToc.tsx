import { useEffect, useState } from 'react'
import type { CaseChapter } from '../../data'
import { AppLink } from '../common/AppLink'

export function CaseToc({ pathname, chapters }: { pathname: string; chapters: CaseChapter[] }) {
  const [activeId, setActiveId] = useState(chapters[0]?.id || '')

  useEffect(() => {
    const sections = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((section): section is HTMLElement => Boolean(section))
    if (!sections.length || !('IntersectionObserver' in window)) return

    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio)
          else visible.delete(entry.target.id)
        }
        const next = [...visible.entries()].sort((left, right) => right[1] - left[1])[0]?.[0]
        if (next) setActiveId(next)
      },
      { rootMargin: '-15% 0px -65% 0px', threshold: [0, 0.1, 0.5, 1] },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [chapters])

  const links = chapters.map((chapter) => (
    <li key={chapter.id}>
      <AppLink
        to={`${pathname}#${chapter.id}`}
        aria-current={activeId === chapter.id ? 'location' : undefined}
      >
        {chapter.title}
      </AppLink>
    </li>
  ))

  return (
    <>
      <aside className="case-toc" aria-label="本页目录">
        <span>ON THIS PAGE</span>
        <ol>{links}</ol>
      </aside>
      <details className="case-toc-mobile">
        <summary>本页目录</summary>
        <ol>{links}</ol>
      </details>
    </>
  )
}
