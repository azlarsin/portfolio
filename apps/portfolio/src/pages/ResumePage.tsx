import { flattenExperienceHighlights } from '../data/profile'
import { resumeDocument } from '../data/resume'
import { useMediaQuery } from '../components/common/useMediaQuery'
import { getLocalizedProfile } from '../data/localized'
import { useLanguage } from '../i18n/LanguageContext'

export function ResumePage() {
  const { language, copy } = useLanguage()
  const profile = getLocalizedProfile(language)
  const isMobile = useMediaQuery('(max-width: 760px)')

  return (
    <main className="page page-standard resume-page">
      <header className="page-intro resume-intro">
        <div>
          <p className="eyebrow">{copy.resume.eyebrow}</p>
          <h1>{profile.name}</h1>
          <strong>{profile.headline}</strong>
          <span>{profile.headlineEn}</span>
        </div>
        <div className="resume-actions">
          <a
            className="button button-primary"
            href={resumeDocument.source}
            download={
              language === 'en'
                ? 'Chen-Cheng-Frontend-Tech-Lead-Resume-CN.pdf'
                : resumeDocument.fileName
            }
          >
            {copy.resume.downloadPdf}
          </a>
          <a className="button button-secondary" href={resumeDocument.source} target="_blank" rel="noreferrer">
            {copy.resume.previewWindow}
          </a>
        </div>
      </header>

      <section className="resume-summary" aria-labelledby="resume-summary-title">
        <div>
          <h2 id="resume-summary-title">{copy.resume.summary}</h2>
          {profile.summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div>
          <h2>{copy.resume.strengths}</h2>
          <ul>
            {profile.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="resume-html" aria-labelledby="resume-experience-title">
        <h2 id="resume-experience-title">{copy.resume.experience}</h2>
        {profile.experience.map((experience) => (
          <article key={`${experience.company}-${experience.start}`}>
            <header>
              <div>
                <h3>{experience.company}</h3>
                <p>{experience.role}</p>
              </div>
              <time>{experience.period}</time>
            </header>
            {experience.overview ? <p>{experience.overview}</p> : null}
            <ul>
              {flattenExperienceHighlights(experience).map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="resume-skills" aria-labelledby="resume-skills-title">
        <h2 id="resume-skills-title">{copy.resume.skills}</h2>
        {profile.skills.map((group) => (
          <div key={group.label}>
            <h3>{group.label}</h3>
            <p>{group.items.join(' · ')}</p>
          </div>
        ))}
      </section>

      {!isMobile ? (
        <section className="pdf-preview" aria-labelledby="pdf-preview-title">
          <header>
            <h2 id="pdf-preview-title">{copy.resume.pdfPreview}</h2>
            <span>{copy.resume.pdfDetails}</span>
          </header>
          <object
            data={`${resumeDocument.source}#zoom=page-width`}
            type="application/pdf"
            aria-label={copy.resume.pdfAria}
          >
            <p>
              {copy.resume.pdfFallbackBefore}
              <a href={resumeDocument.source} target="_blank" rel="noreferrer">{copy.resume.pdfFallbackLink}</a>。
            </p>
          </object>
        </section>
      ) : null}

      <section className="resume-website" aria-label="Portfolio website">
        <span>Portfolio</span>
        <a href={profile.contact.website}>{profile.contact.website}</a>
      </section>
    </main>
  )
}
