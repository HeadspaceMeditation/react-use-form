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
