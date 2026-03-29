import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://careqcokiotymyhucoon.supabase.co"
const SUPABASE_KEY = "sb_publishable_GS5twRxf1cITmd1SFH0kfA_Svx21ogR"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web'
    }
  }
})