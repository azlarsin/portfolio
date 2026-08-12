export function TagList({ tags, label = '技术关键词' }: { tags: string[]; label?: string }) {
  return (
    <ul className="tag-list" aria-label={label}>
      {tags.map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  )
}
