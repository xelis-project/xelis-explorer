import { createClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useRef } from 'react'

const supabaseUrl = NODE_REST_ENDPOINT
const supabaseKey = NODE_REST_KEY

const Context = createContext()

export const SupabaseProvider = (props) => {
  const { children } = props

  const supabaseRef = useRef()

  useEffect(() => {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      supabaseRef.current = supabase
    } catch (err) {
      console.log(err)
    }
  }, [])

  return <Context.Provider value={supabaseRef.current}>
    {children}
  </Context.Provider>
}

export const useSupabase = () => useContext(Context)
export default useSupabase
