import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { migrateLegacyHashOnFirstLoad } from './app/legacyRoutes'
import { LanguageProvider } from './i18n/LanguageContext'
import './styles/index.css'

migrateLegacyHashOnFirstLoad()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
