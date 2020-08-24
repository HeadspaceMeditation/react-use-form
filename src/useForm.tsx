import produce from 'immer'
import set from 'lodash.set'
import get from 'lodash.get'
import { useCallback, useMemo, useState } from 'react'
import {
  FieldDefinition,
  FieldDefinitions,
  Fields,
  FieldsState,
  FieldState
} from './types'

export type UseForm<T> = {
  fields: Fields<T> // field bindings
  validate: () => Promise<boolean> // trigger validation
  getValue: () => T // retrieve the current form value
  isEmpty: boolean // true if all fields are undefined, null or ""
  reset: () => void
}

export function useForm<T extends Record<string, any>>(
  fieldDefs: FieldDefinitions<T>,
  defaultValue?: T
): UseForm<T> {
  const initialState = useMemo(() => getInitialState(fieldDefs, defaultValue), [
    fieldDefs,
    defaultValue
  ])
  const [state, setState] = useState<FieldsState<T>>(initialState)
  const fields = useMemo(() => createFields(state, initialState, setState), [
    state,
    initialState
  ])
  const validate = useCallback(() => runValidation(setState), [setState])
  const reset = useCallback(() => resetForm(initialState, setState), [
    setState,
    initialState
  ])

  const isEmpty = useMemo(() => {
    const hasValue = exists<FieldsState<T>>(
      state,
      ({ value }: any) => !isEmptyObject(value)
    )

    return !hasValue
  }, [state])

  const getValue = useCallback(() => {
    return produce(state, t => {
      forEach<FieldState<any>>(state, (path, { value }) => {
        set(t, path, value)
      })
    }) as T
  }, [state])

  return { getValue, validate, fields, isEmpty, reset }
}

function getInitialState<T>(
  fieldDefs: FieldDefinitions<T>,
  defaultValue?: T
): FieldsState<T> {
  return produce(fieldDefs, initialState => {
    forEach<FieldDefinition<any>>(
      fieldDefs,
      (path, { rules, default: defaultFieldValue, __type }) => {
        const value = defaultFieldValue || get(defaultValue, path)
        set(initialState, path, { rules, value, __type })
      }
    )
  }) as FieldsState<T>
}

function createFields<T>(
  state: FieldsState<T>,
  initialState: FieldsState<T>,
  setState: (f: (state: FieldsState<T>) => FieldsState<T>) => void
): Fields<T> {
  return (produce(state, fields => {
    forEach<FieldState<any>>(
      state,
      (path, { value, error, touched, rules }) => {
        set(fields, path, {
          value,
          error,
          touched,
          // For onChange / onBlur, we use a "functional" setState call
          // (https://reactjs.org/docs/hooks-reference.html#functional-updates)
          // This avoids issues related to stale state when multiple onChange functions are
          // invoked within the same render cycle -- e.g.
          // const onClick = () => { date.day.onChange(...); date.day.onChange(...) }:
          onChange: (updatedValue: any) => {
            setState(currentState =>
              produce(currentState, updatedState => {
                set(updatedState, [...path, 'value'], updatedValue)
                set(updatedState, [...path, 'touched'], true)
              })
            )
          },
          reset: () => {
            setState(currentState =>
              produce(currentState, updatedState => {
                const value = get(initialState, [...path, 'value'])
                set(updatedState, [...path, 'value'], value)
                set(updatedState, [...path, 'error'], undefined)
                set(updatedState, [...path, 'touched'], false)
              })
            )
          },
          onBlur: () => {
            setState(currentState =>
              produce(currentState, updatedState => {
                const error = rules
                  .map(r => r(value))
                  .find(_ => _ !== undefined)
                set(updatedState, [...path, 'error'], error)
              })
            )
          }
        })
      }
    )
  }) as unknown) as Fields<T>
}

function runValidation<T>(
  setState: (f: (state: FieldsState<T>) => FieldsState<T>) => void
): Promise<boolean> {
  return new Promise(resolve => {
    setState(state => {
      let isValid = true
      const updatedState = produce(state, updatedState => {
        forEach(state, (path, field) => {
          const { rules, value } = (field as unknown) as FieldState<T>
          const error = rules.map(r => r(value)).find(_ => _ !== undefined)
          set(updatedState, [...path, 'error'], error)
          if (error) {
            isValid = false
          }
        })
      })

      resolve(isValid)
      return updatedState
    })
  })
}

function resetForm<T>(
  initialState: FieldsState<T>,
  setState: (f: (state: FieldsState<T>) => FieldsState<T>) => void
): void {
  setState(() => {
    return produce(initialState, updatedState => {
      forEach(initialState, (path, field) => {
        const { value } = (field as unknown) as FieldState<T>
        set(updatedState, [...path, 'value'], value)
        set(updatedState, [...path, 'error'], undefined)
        set(updatedState, [...path, 'touched'], false)
      })
    })
  })
}

/** Recursively calls f() for each property in object
 *  This methohd assumes "leaf" properties have been tagged with
 *  __type: "Leaf"
 */
function forEach<T>(
  object: Record<string, any>,
  f: (path: string[], value: T) => void,
  path: string[] = []
) {
  for (const key in object) {
    const field = object[key]
    const currentPath = [...path, key]

    if (field !== undefined && field.__type === 'Leaf') {
      f(currentPath, field)
    } else {
      forEach(field, f as any, currentPath)
    }
  }
}

/** Recursively visits each property in object
 *  and returns true as soon as any field matches the passed
 *  predicate, false otherwise.
 */
function exists<T>(
  object: Record<string, any>,
  predicate: (value: T) => boolean
): boolean {
  for (const key in object) {
    const field = object[key]

    if (field !== undefined && field.__type === 'Leaf') {
      if (predicate(field)) {
        return true
      }
    } else if (exists(field, predicate)) {
      return true
    }
  }

  return false
}

function isEmptyObject(obj: any): boolean {
  return (
    obj === undefined ||
    obj === null ||
    obj === '' ||
    (Array.isArray(obj) && obj.length === 0)
  )
}
