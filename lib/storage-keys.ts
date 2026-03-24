/** Centralized localStorage key constants */
export const STORAGE_KEYS = {
  ANSWERS: 'ocean_answers',
  ANSWERS_DRAFT: 'ocean_answers_draft',
  QUIZ_PAGE: 'ocean_quiz_page',
  PROFILE: 'ocean_profile',
  SESSION: 'ocean_session',
  PAGE_DURATIONS: 'ocean_page_durations',
  RESPONSE_TIMES: 'ocean_response_times',
  AI_REPORT: 'ocean_ai_report',
  // Set when user arrives via a friend invite link (/invite/[code])
  // Cleared after friend explicitly shares or declines
  FRIEND_INVITE_CODE: 'ocean_friend_invite_code',
  FRIEND_INVITE_OWNER: 'ocean_friend_invite_owner',
} as const
