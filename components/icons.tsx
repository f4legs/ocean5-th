// Shared SVG icon components used across the app

export function IconClose() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M2 7L8 2L14 7V13.5C14 13.78 13.78 14 13.5 14H10.5V10H5.5V14H2.5C2.22 14 2 13.78 2 13.5V7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconBarChart() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="9" width="3" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="6.5" y="5.5" width="3" height="8.5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="11" y="2.5" width="3" height="11.5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  )
}

export function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="12" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M12 10.5c1.7.4 2.5 1.7 2.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M5.5 10.5L8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 8V14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M13 10.5A3 3 0 0 0 10 5a4.5 4.5 0 1 0-6.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="4" width="12" height="8.5" rx="1.25" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 6L8 10L14 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconFileEdit() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 2l3 3-5 5H6v-3l5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconBot() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="3" y="6.5" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="6" cy="10.25" r="1" fill="currentColor"/>
      <circle cx="10" cy="10.25" r="1" fill="currentColor"/>
      <path d="M8 2v4M6.5 5.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M3 9.5H1.5M14.5 9.5H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function IconBug() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M5.5 6c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v4c0 1.38-1.12 2.5-2.5 2.5S5.5 11.38 5.5 10V6z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 9h3.5M10.5 9H14M2 6.5l2.5 1.5M13.5 6.5l-2.5 1.5M2 11.5L4.5 10M13.5 11.5L11 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M6.5 3.5L5 2M9.5 3.5L11 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function IconLogOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M10 11l3-3-3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function IconPencil() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconTrash() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 3h8M4.5 3V2h3v1M5 5.5V9M7 5.5V9M3 3l.5 7.5h5L9 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconCardSelf() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function IconCardTeam() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="7" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 17c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 12.5c2 .5 3.5 2.1 3.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function IconCardTrend() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 14.5L8 9L11.5 12.5L17.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5 5.5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconCardShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2L4 4.5V10c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4.5L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconCopy() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="7.5" height="7.5" rx="1.25" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9 4V2.5A1 1 0 0 0 8 1.5H2A1 1 0 0 0 1 2.5v6A1 1 0 0 0 2 9.5H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

export function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2.5 6.5L5.5 9.5L10.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconUsersLg() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="10" cy="9" r="4" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M2 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="21" cy="9" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M21 18c3 .8 5 3.2 5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}
