import { ValidationRule } from './rules'

/** A binding for a particular field  */
export type Field<T> = {
  __type: 'Leaf'
  value: T
  touched: boolean
  error?: string
  rules: ValidationRule<T>[]
  onChange: (value: T) => void
  reset: () => void
  onBlur: () => void
}

export type FieldState<T> = {
  __type: 'Leaf'
  value: T
  touched: boolean
  error?: string
  rules: ValidationRule<T>[]
}

export type FieldDefinition<T> = {
  __type: 'Leaf'
  default?: T
  rules: ValidationRule<T>[]
}

/** Field bindings for all the properties on T */
export type Fields<T> = {
  [U in keyof T]: Tree<
    Defined<T[U]>,
    Field<Defined<T[U]>>,
    Fields<Defined<T[U]>>
  >
}
export type FieldsState<T> = {
  [U in keyof T]: Tree<
    Defined<T[U]>,
    FieldState<Defined<T[U]>>,
    FieldsState<Defined<T[U]>>
  >
}

export type FieldDefinitions<T extends Record<string, any>> = {
  [U in keyof T]: Tree<
    Defined<T[U]>,
    FieldDefinition<Defined<T[U]>>,
    FieldDefinitions<Defined<T[U]>>
  >
}

export type Defined<T> = Exclude<T, undefined>

export type Tree<T, Leaf, NonLeaf> = T extends Record<string, any>
  ? T extends Array<any>
    ? Leaf
    : NonLeaf
  : Leaf
