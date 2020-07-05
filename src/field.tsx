import { required, ValidationRule } from './rules'
import { FieldDefinition } from './types'

export function field<T>(
  props: {
    default?: T
    rules?: ValidationRule<T>[]
  } = { rules: [required] }
): FieldDefinition<T> {
  return {
    default: props.default as T,
    rules: props.rules || [],
    __type: 'Leaf'
  }
}
