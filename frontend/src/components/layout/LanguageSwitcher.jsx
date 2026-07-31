import React from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'si' : 'en'
    i18n.changeLanguage(newLang)
  }

  return (
    <button
      type="button"
      className="btn btn-ghost"
      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
      onClick={toggleLanguage}
      aria-label="Toggle language"
    >
      {i18n.language === 'en' ? 'සිංහල' : 'English'}
    </button>
  )
}
