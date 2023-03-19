import { createClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useRef } from 'react'

const supabaseUrl = NODE_REST_ENDPOINT
const supabaseKey = NODE_REST_KEY

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
