import { createClient } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

const supabaseUrl = INDEX_REST_ENDPOINT
const supabaseKey = INDEX_REST_KEY

let supabase = {}

try {
  supabase = createClient(supabaseUrl, supabaseKey)
} catch (err) {
  console.log(err)
}

const Context = createContext()

export const SupabaseProvider = (props) => {
  const { children } = props
  return <Context.Provider value={supabase}>
    {children}
  </Context.Provider>
}

export const useSupabase = () => useContext(Context)
export default useSupabase
