// Shared brand styling for auth emails — union green + gold, Tajawal/El Messiri fonts.
// Body background stays white; accents use the app's brand colors.

export const BRAND = {
  green: '#1d4a38',
  gold: '#d9b64a',
  text: '#2b3a32',
  muted: '#6b7a70',
}

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Tajawal', Arial, sans-serif",
}

export const container = { padding: '0 0 24px' }

export const header = {
  backgroundColor: BRAND.green,
  padding: '20px 25px',
  borderBottom: `3px solid ${BRAND.gold}`,
}

export const headerText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  fontFamily: "'El Messiri', 'Tajawal', serif",
  margin: '0',
}

export const content = { padding: '24px 25px 0' }

export const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  fontFamily: "'El Messiri', 'Tajawal', serif",
  color: BRAND.green,
  margin: '0 0 20px',
}

export const text = {
  fontSize: '14px',
  color: BRAND.text,
  lineHeight: '1.6',
  margin: '0 0 25px',
}

export const link = { color: BRAND.green, textDecoration: 'underline' }

export const button = {
  backgroundColor: BRAND.gold,
  color: BRAND.green,
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '12px 24px',
  textDecoration: 'none',
}

export const codeBox = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  letterSpacing: '6px',
  color: BRAND.green,
  backgroundColor: '#f4f1e6',
  borderRadius: '10px',
  padding: '14px 20px',
  textAlign: 'center' as const,
  margin: '0 0 25px',
}

export const footer = { fontSize: '12px', color: BRAND.muted, margin: '30px 0 0' }

// Google Fonts link for the email <Head> (emails can't use CSS @import).
export const FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=El+Messiri:wght@600;700&family=Tajawal:wght@400;700&display=swap'
