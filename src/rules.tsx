export type ValidationRule<T, S> = (value: T, state: S) => string | undefined

export const required: ValidationRule<any, any> = _ => {
  return _ === undefined || _ === null || _ === ''
    ? 'This field is required'
    : undefined
}
