// Re-export the main Sete Ecos client as `supabase` for backward compat
// (messenger, auth, unread count, etc. all use this)
export { seteEcosClient as supabase } from './products'
