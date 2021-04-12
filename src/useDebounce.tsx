// A naive implementation of debounce which delays the execution of the callback fn
import debounce from 'lodash.debounce'
import { useEffect, useRef, useState } from 'react'

export function useDebounce(callback: () => void, delay = 1000) {
  const [triggerCallback, setShouldTriggerCallback] = useState(false)
  const isMounted = useRef<boolean>(true)
  useEffect(() => {
    if (triggerCallback) {
      setShouldTriggerCallback(false)
      callback()
    }
    return () => {
      isMounted.current = false
    }
  }, [triggerCallback, callback])

  const [returnCallback] = useState(() =>
    debounce(() => {
      setShouldTriggerCallback(true)
    }, delay)
  )

  return returnCallback
}
