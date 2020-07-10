export type ValidationRule<T> = (value: T) => string | undefined

export const required: ValidationRule<any> = _ => {
  return _ === undefined || _ === null || _ === ''
    ? 'This field is required'
    : undefined
}
