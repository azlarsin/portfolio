import { useEffect, useState } from 'react'
import type { CaseChapter } from '../../data'
import { AppLink } from '../common/AppLink'
import { useLanguage } from '../../i18n/LanguageContext'

export function CaseToc({
  pathname,
  chapters,
}: {
  pathname: string
  chapters: CaseChapter[]
}) {
  const { copy } = useLanguage()
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const sections = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((section): section is HTMLElement => Boolean(section))
    let frame = 0
    const update = () => {
      frame = 0
      const boundary = window.matchMedia('(max-width: 900px)').matches
        ? 96
        : 114
      // Track the last heading passed, independent of the chapter's height.
      const current = sections
        .filter((section) => section.getBoundingClientRect().top <= boundary)
        .at(-1)
      setActiveId(current?.id || '')
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [chapters, pathname])

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
      <aside className="case-toc" aria-label={copy.caseStudy.onThisPage}>
        <span>{copy.caseStudy.onThisPage}</span>
        <ol>{links}</ol>
      </aside>
      <details className="case-toc-mobile">
        <summary>{copy.caseStudy.onThisPage}</summary>
        <ol>{links}</ol>
      </details>
    </>
  )
}
