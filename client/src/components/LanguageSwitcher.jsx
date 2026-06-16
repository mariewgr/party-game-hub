import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isEN = i18n.language === 'en';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      padding: '0 20px',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}>
        🎉 Party Game Hub
      </span>
      <button
        onClick={() => i18n.changeLanguage(isEN ? 'fr' : 'en')}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: 20,
          color: '#fff',
          fontWeight: 600,
          fontSize: 13,
          padding: '5px 14px',
          letterSpacing: 0.5,
        }}
      >
        {isEN ? '🇫🇷 FR' : '🇬🇧 EN'}
      </button>
    </div>
  );
}
