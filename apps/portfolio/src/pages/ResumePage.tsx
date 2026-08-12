import { flattenExperienceHighlights, profile } from '../data/profile'
import { resumeDocument } from '../data/resume'
import { useMediaQuery } from '../components/common/useMediaQuery'

export function ResumePage() {
  const isMobile = useMediaQuery('(max-width: 760px)')

  return (
    <main className="page page-standard resume-page">
      <header className="page-intro resume-intro">
        <div>
          <p className="eyebrow">RESUME</p>
          <h1>{profile.name}</h1>
          <strong>{profile.headline}</strong>
          <span>{profile.headlineEn}</span>
        </div>
        <div className="resume-actions">
          <a className="button button-primary" href={resumeDocument.source} download={resumeDocument.fileName}>
            下载 PDF
          </a>
          <a className="button button-secondary" href={resumeDocument.source} target="_blank" rel="noreferrer">
            新窗口预览
          </a>
        </div>
      </header>

      <section className="resume-summary" aria-labelledby="resume-summary-title">
        <div>
          <h2 id="resume-summary-title">个人简介</h2>
          {profile.summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div>
          <h2>核心能力</h2>
          <ul>
            {profile.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="resume-html" aria-labelledby="resume-experience-title">
        <h2 id="resume-experience-title">工作经历</h2>
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
        <h2 id="resume-skills-title">技术栈</h2>
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
            <h2 id="pdf-preview-title">PDF 预览</h2>
            <span>2 页 · A4 · 公开脱敏版</span>
          </header>
          <object
            data={`${resumeDocument.source}#zoom=page-width`}
            type="application/pdf"
            aria-label="陈成公开版简历 PDF"
          >
            <p>
              当前浏览器无法直接预览 PDF，请
              <a href={resumeDocument.source} target="_blank" rel="noreferrer">在新窗口打开</a>。
            </p>
          </object>
        </section>
      ) : null}
    </main>
  )
}
