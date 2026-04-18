import { LayoutDashboard, Package, Users, User, MessageSquare, Phone, FileText, Newspaper } from 'lucide-react'

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

export const ADMIN_NAV_LINKS = [
  { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
  { label: 'Posts', href: ROUTES.ADMIN_POST, icon: FileText },
  { label: 'Products', href: ROUTES.ADMIN_PRODUCT, icon: Package },
  { label: 'Members', href: ROUTES.ADMIN_MEMBER, icon: Users },
  { label: 'Messages', href: ROUTES.ADMIN_MESSAGE, icon: MessageSquare },
  { label: 'Contacts', href: ROUTES.ADMIN_CONTACT, icon: Phone },
  { label: 'Profile', href: ROUTES.ADMIN_PROFILE, icon: User },
]

export const MEMBER_NAV_LINKS = [
  { label: 'Dashboard', href: ROUTES.MEMBER_DASHBOARD, icon: LayoutDashboard },
  { label: 'Products', href: ROUTES.MEMBER_PRODUCT, icon: Package },
  { label: 'News', href: ROUTES.MEMBER_NEWS, icon: Newspaper },
  { label: 'Messages', href: ROUTES.MEMBER_MESSAGE, icon: MessageSquare },
  { label: 'Profile', href: ROUTES.MEMBER_PROFILE, icon: User },
]
