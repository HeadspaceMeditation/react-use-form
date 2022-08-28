import { FieldDefinition, FieldDefinitions } from 'types'
import get from 'lodash.get'

/** Recursively calls f() for each property in object
 *  This methohd assumes "leaf" properties have been tagged with
 *  __type: "Leaf"
 */
export function forEach<T>(
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

export function validate<T extends Record<string, any>>(
  data: T,
  fieldDefs: FieldDefinitions<T>
): boolean {
  let isValid = true
  forEach<FieldDefinition<any>>(fieldDefs, (path, { rules }) => {
    const value = get(data, path)
    const error = rules.map(r => r(value, data)).find(_ => _ !== undefined)
    isValid = isValid && error === undefined
  })
  return isValid
}
