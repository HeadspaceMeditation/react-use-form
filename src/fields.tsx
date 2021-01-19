import { nonEmpty, required, ValidationRule } from './rules'
import { FieldDefinition } from './types'

export type FieldProps<T> = {
  default?: T
  rules?: ValidationRule<T, any>[]
}

export function field<T>(props?: FieldProps<T>): FieldDefinition<T> {
  return {
    default: props?.default as T,
    rules: props?.rules ?? [required],
    __type: 'Leaf'
  }
}

export function stringField(
  props?: FieldProps<string>
): FieldDefinition<string> {
  return field({ default: '', ...props })
}

export function booleanField(
  props?: FieldProps<boolean>
): FieldDefinition<boolean> {
  return field({ default: false, ...props })
}

export function numberField(
  props?: FieldProps<number>
): FieldDefinition<number> {
  return field({ default: 0, ...props })
}

export function arrayField<T>(props?: FieldProps<T[]>): FieldDefinition<T[]> {
  return field({ default: [], ...props })
}

export function nonEmptyArrayField<T>(
  props?: FieldProps<T[]>
): FieldDefinition<T[]> {
  return field({ default: [], rules: [required, nonEmpty], ...props })
}
