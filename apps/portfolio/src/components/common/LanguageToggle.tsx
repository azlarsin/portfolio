import { useLanguage, type Language } from '../../i18n/LanguageContext'

export function LanguageToggle() {
  const { language, setLanguage, copy } = useLanguage()
  const languages: Language[] = ['zh', 'en']

  return (
    <div className="language-toggle" aria-label={copy.language.label}>
      {languages.map((option) => (
        <button
          key={option}
          type="button"
          lang={option === 'zh' ? 'zh-CN' : 'en'}
          aria-pressed={language === option}
          onClick={() => setLanguage(option)}
        >
          {copy.language[option]}
        </button>
      ))}
    </div>
  )
}
