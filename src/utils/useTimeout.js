import { useRef, useEffect, useCallback } from 'react'

export default function useTimeout() {
  const timers = useRef(new Map())

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((tid) => clearTimeout(tid))
      map.clear()
    }
  }, [])

  const set = useCallback((fn, ms) => {
    const tid = setTimeout(() => {
      timers.current.delete(tid)
      fn()
    }, ms)
    timers.current.set(tid, tid)
    return tid
  }, [])

  const clear = useCallback((tid) => {
    clearTimeout(tid)
    timers.current.delete(tid)
  }, [])

  const clearAll = useCallback(() => {
    timers.current.forEach((tid) => clearTimeout(tid))
    timers.current.clear()
  }, [])

  return { set, clear, clearAll }
}
