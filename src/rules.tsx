/** A validation rule that's run against a specific field
 *
 *  @param value -- the value of this specific field.
 *
 *  @param state -- the whole form state (i.e. values for every field).
 *  This is useful for fields whose validation state is bound to another field
 *
 */
export type ValidationRule<T, U> = (value: T, state: U) => string | undefined

export const required: ValidationRule<any, any> = (value, _) => {
  return value === undefined || value === null || value === ''
    ? 'This field is required'
    : undefined
}

export const nonEmpty: ValidationRule<Array<any>, any> = input => {
  return input === undefined || input.length === 0
    ? "This field can't be empty."
    : undefined
}

export const positiveNumber: ValidationRule<number, any> = value => {
  return value === undefined || value === null || value <= 0
    ? 'This field must be greater than zero.'
    : undefined
}

export const nonNegativeNumber: ValidationRule<number, any> = value => {
  return value === undefined || value === null || value < 0
    ? 'This field must be greater than or equal to zero.'
    : undefined
}
