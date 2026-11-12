import { useLanguage } from '../../i18n/LanguageContext'

export function TagList({ tags, label }: { tags: string[]; label?: string }) {
  const { copy } = useLanguage()

  return (
    <ul className="tag-list" aria-label={label || copy.caseStudy.technologyKeywords}>
      {tags.map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  )
}
