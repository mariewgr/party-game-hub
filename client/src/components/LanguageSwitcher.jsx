import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <header style={{ textAlign: 'right', padding: '12px 24px', borderBottom: '1px solid #eee' }}>
      <button
        onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}
        style={{ fontSize: 14, cursor: 'pointer' }}
      >
        {t('lang.switchTo')}
      </button>
    </header>
  );
}
