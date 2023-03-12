import { createClient } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

const supabaseUrl = INDEX_ENDPOINT
const supabaseKey = INDEX_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const Context = createContext()

export const SupabaseProvider = (props) => {
  const { children } = props
  return <Context.Provider value={supabase}>
    {children}
  </Context.Provider>
}

export const useSupabase = () => useContext(Context)
export default useSupabase
