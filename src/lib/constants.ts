/** Application-wide constants */

export const APP_NAME = 'Infinity 8K Corporation'
export const APP_TAGLINE = 'A community of 8,000 extraordinary members'
export const MAX_MEMBERS = 8000

export const ROLES = ['admin', 'member'] as const
export type Role = (typeof ROLES)[number]

export const ROUTES = {
  // Landing
  HOME: '/',
  ABOUT: '/about',
  CONTACTS: '/contacts',
  ADMIN_LOGIN: '/admin/login',
  MEMBER_LOGIN: '/member/login',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_POST: '/admin/posts',
  ADMIN_PRODUCT: '/admin/products',
  ADMIN_MEMBER: '/admin/members',
  ADMIN_PROFILE: '/admin/profile',
  ADMIN_MESSAGE: '/admin/messages',
  ADMIN_CONTACT: '/admin/contacts',

  // Member
  MEMBER_DASHBOARD: '/member/dashboard',
  MEMBER_PRODUCT: '/member/products',
  MEMBER_PROFILE: '/member/profile',
  MEMBER_MESSAGE: '/member/messages',
  MEMBER_NEWS: '/member/news',
} as const

export const NAV_LINKS = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'About Us', href: ROUTES.ABOUT },
  { label: 'Contact', href: ROUTES.CONTACTS },
] as const
