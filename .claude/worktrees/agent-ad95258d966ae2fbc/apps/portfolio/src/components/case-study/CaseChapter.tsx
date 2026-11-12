import type { CaseChapter as CaseChapterData } from '../../data'

export function CaseChapter({ chapter, index }: { chapter: CaseChapterData; index: number }) {
  return (
    <section className="case-chapter" id={chapter.id} data-case-section>
      <div className="chapter-number">{String(index + 1).padStart(2, '0')}</div>
      <div>
        <header>
          <h2>{chapter.title}</h2>
          {chapter.phase ? <span>{chapter.phase}</span> : null}
        </header>
        {chapter.summary ? <p className="chapter-summary">{chapter.summary}</p> : null}
        {chapter.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {chapter.bullets?.length ? (
          <ul>
            {chapter.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
