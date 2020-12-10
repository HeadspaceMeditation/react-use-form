import { field, FieldDefinitions, validate, ValidationRule } from '../src'
import { aWidget, Widget } from './utils'

const pictureRequiresDescription: ValidationRule<string, Widget> = (
  value,
  state
) => {
  if (value && !state.details.description) {
    return 'To upload a photo, you need to add a description'
  }
  return undefined
}

const fieldDefs: FieldDefinitions<Widget> = {
  name: field(),
  components: field(),
  details: {
    description: field(),
    picture: field({ rules: [pictureRequiresDescription] })
  }
}

describe('Helper function', () => {
  it('should validate form data based on FieldDefinitions when provided with invalid input', () => {
    expect(
      validate(
        aWidget({ details: { description: null as any, picture: 'bytes' } }),
        fieldDefs
      )
    ).toBeFalsy()
    expect(validate(aWidget({ name: '' }), fieldDefs)).toBeFalsy()
  })
  it('should validate form data based on FieldDefinitions when provided with valid input', () => {
    expect(validate(aWidget(), fieldDefs)).toBeTruthy()
  })
})
