import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useUnreadCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetchCount()

    const channel = supabase
      .channel('hub-unread')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messenger_conversations',
        },
        () => {
          fetchCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchCount() {
    const { data } = await supabase
      .from('messenger_conversations')
      .select('unread_coach')
      .eq('status', 'activa')
      .gt('unread_coach', 0)

    const total = (data || []).reduce((sum, c) => sum + (c.unread_coach || 0), 0)
    setCount(total)
  }

  return count
}
