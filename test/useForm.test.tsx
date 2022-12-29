import { act, renderHook, RenderHookResult } from '@testing-library/react-hooks'
import {
  arrayField,
  booleanField,
  field,
  nonEmptyArrayField,
  numberField,
  stringField,
  positiveNumberField,
  nonNegativeNumberField,
  useForm,
  UseForm
} from '../src/index'
import { ValidationRule } from '../src/rules'
import { FieldDefinitions, Field } from '../src/types'
import { aWidget, Component, Widget } from './utils'

const noInvalidName: ValidationRule<string, any> = name =>
  name === 'InvalidName' ? "name can't be 'InvalidName'" : undefined

describe('useForm', () => {
  it('should initialize every field as undefined by default', () => {
    const { result } = render<Widget>({
      name: field(),
      components: field(),
      details: {
        description: field(),
        picture: field()
      }
    })

    const { fields } = result.current
    expect(fields.name.value).toEqual(undefined)
    expect(fields.details.description.value).toEqual(undefined)
    expect(fields.details.picture.value).toEqual(undefined)
    expect(fields.components.value).toEqual(undefined)
  })

  it('should initialize fields to specific defaults if specialized helpers used', () => {
    type SpecificObject = {
      stringField: string

      booleanField: boolean
      numberField: number
      objectField: {
        arrayField: number[]
      }
    }

    const { result } = render<SpecificObject>({
      stringField: stringField(),
      booleanField: booleanField(),
      numberField: numberField(),
      objectField: {
        arrayField: arrayField()
      }
    })

    const { fields } = result.current
    expect(fields.stringField.value).toEqual('')
    expect(fields.booleanField.value).toEqual(false)
    expect(fields.numberField.value).toEqual(0)
    expect(fields.objectField.arrayField.value).toEqual([])
  })

  it('should set isEmpty to true when all fields undefined', () => {
    const { result } = render<Widget>({
      name: field(),
      components: field(),
      details: {
        description: field(),
        picture: field()
      }
    })

    const { isEmpty } = result.current
    expect(isEmpty).toEqual(true)
  })

  it('should set isEmpty to true when fields contain the empty string or null', () => {
    const { result } = render<Widget>({
      name: field({ default: '' }),
      components: field<Component[]>({ default: [] }),
      details: {
        description: field({ default: null } as any),
        picture: field()
      }
    })

    const { isEmpty } = result.current
    expect(isEmpty).toEqual(true)
  })

  it('should set isEmpty to false when fields contain a value', () => {
    const { result } = render<Widget>({
      name: field(),
      components: field(),
      details: {
        description: field(),
        picture: field()
      }
    })

    set(result.current.fields.name, 'Widget A')

    expect(result.current.isEmpty).toEqual(false)
  })

  it('should allow false-y values as default values', () => {
    type SomeType = {
      name: string
      isPresent: boolean
    }

    const { result } = render<SomeType>({
      name: field({ default: '', rules: [] }), // empty strings are falsy in JS, e.g. "" || "foo" => "foo"
      isPresent: field<boolean>({ default: false, rules: [] })
    })

    const { fields } = result.current
    expect(fields.name.value).toEqual('')
    expect(fields.isPresent.value).toEqual(false)
  })

  it('should require every field by default', async () => {
    const { result } = render<Widget>({
      name: field(),
      components: field(),
      details: {
        description: field(),
        picture: field()
      }
    })

    const isValid = await validate(result.current)

    const { fields } = result.current
    expect(isValid).toEqual(false)
    expect(fields.name.error).toEqual('This field is required')
    expect(fields.details.description.error).toEqual('This field is required')
    expect(fields.details.picture.error).toEqual('This field is required')
    expect(fields.components.error).toEqual('This field is required')
  })

  it('should allow optional fields', async () => {
    const { result } = render<Widget>({
      name: field(),
      components: field({ rules: [] }),
      details: {
        description: field({ rules: [] }),
        picture: field({ rules: [] })
      }
    })

    const isValid = await validate(result.current)

    const { fields } = result.current
    expect(isValid).toEqual(false)
    expect(fields.name.error).toEqual('This field is required')
    expect(fields.details.description.error).toEqual(undefined)
    expect(fields.details.picture.error).toEqual(undefined)
    expect(fields.components.error).toEqual(undefined)
  })

  it('should initialize each field with a default', () => {
    const { result } = render<Widget>({
      name: field({ default: 'Widget' }),
      components: field({ default: [] as any }),
      details: {
        description: field({ default: 'Description' }),
        picture: field({ default: 'Picture' })
      }
    })

    const { fields } = result.current
    expect(fields.name.value).toEqual('Widget')
    expect(fields.details.description.value).toEqual('Description')
    expect(fields.details.picture.value).toEqual('Picture')
    expect(fields.components.value).toEqual([])
  })

  it('should allow passing a fully formed T as a default', () => {
    const existingWidget: Widget = {
      name: 'Widget',
      components: [{ id: 'component-1' }],
      details: {
        description: 'Description',
        picture: 'Picture'
      }
    }

    const { result } = render<Widget>(
      {
        name: field(),
        components: field(),
        details: {
          description: field(),
          picture: field()
        }
      },
      existingWidget
    )

    const { fields } = result.current
    expect(fields.name.value).toEqual('Widget')
    expect(fields.details.description.value).toEqual('Description')
    expect(fields.details.picture.value).toEqual('Picture')
    expect(fields.components.value).toEqual([{ id: 'component-1' }])
  })

  it('non-undefined field-level defaults should supersede undefined fields on a fully formed T', () => {
    const existingWidget: Widget = {
      name: undefined as any,
      components: undefined as any,
      details: {
        description: 'Description',
        picture: 'Picture'
      }
    }

    const { result } = render<Widget>(
      {
        name: stringField(),
        components: arrayField(),
        details: {
          description: field(),
          picture: field()
        }
      },
      existingWidget
    )

    const { fields } = result.current
    expect(fields.name.value).toEqual('')
    expect(fields.details.description.value).toEqual('Description')
    expect(fields.details.picture.value).toEqual('Picture')
    expect(fields.components.value).toEqual([])
  })

  // This behavior is desirable to allow callers to seed form values from
  // an object retrieved from the network / local storage etc.
  it('should have full object default supersede field-level defaults', () => {
    const existingWidget: Widget = {
      name: 'Widget',
      components: [{ id: 'component-1' }],
      details: {
        description: 'Description',
        picture: 'Picture'
      }
    }

    const { result } = render<Widget>(
      {
        name: field({ default: 'field level name' }),
        components: field(),
        details: {
          description: field({ default: 'field level description' }),
          picture: field()
        }
      },
      existingWidget
    )

    const { fields } = result.current
    expect(fields.name.value).toEqual('Widget')
    expect(fields.details.description.value).toEqual('Description')
    expect(fields.details.picture.value).toEqual('Picture')
    expect(fields.components.value).toEqual([{ id: 'component-1' }])
  })

  it('should change the value and extract the full value', async () => {
    const { result } = render<Widget>({
      name: field(),
      details: {
        description: field(),
        picture: field()
      },
      components: field()
    })

    const expectedWidget: Widget = {
      name: 'Widget A',
      components: [],
      details: {
        description: 'Description',
        picture: 'Picture'
      }
    }

    set(result.current.fields.name, 'Widget A')
    set(result.current.fields.components, [])
    set(result.current.fields.details.description, 'Description')
    set(result.current.fields.details.picture, 'Picture')

    const { fields, getValue } = result.current
    expect(fields.name.value).toEqual(expectedWidget.name)
    expect(fields.components.value).toEqual(expectedWidget.components)
    expect(fields.details.description.value).toEqual(
      expectedWidget.details.description
    )
    expect(fields.details.picture.value).toEqual(expectedWidget.details.picture)
    expect(getValue()).toEqual(expectedWidget)
  })

  it('should run validation when runValidation passed to setValue', async () => {
    const { result } = render<Widget>({
      name: field({
        rules: [noInvalidName]
      }),
      details: {
        description: field(),
        picture: field()
      },
      components: field()
    })

    act(() => {
      result.current.fields.name.setValue('InvalidName', {
        runValidation: true
      })
    })

    const { fields } = result.current
    expect(fields.name.value).toEqual('InvalidName')
    expect(fields.name.error).toEqual("name can't be 'InvalidName'")
  })

  it('should return a Promise<boolean> when runValidation passed to setValue', async () => {
    const { result } = render<Widget>({
      name: field({
        rules: [noInvalidName]
      }),
      details: {
        description: field(),
        picture: field()
      },
      components: field()
    })

    let firstValidation: Promise<boolean> | undefined = undefined
    act(() => {
      firstValidation = result.current.fields.name.setValue('InvalidName', {
        runValidation: true
      })
    })

    expect(await firstValidation).toEqual(false)
    expect(result.current.fields.name.error).toEqual(
      "name can't be 'InvalidName'"
    )

    let secondValidation: Promise<boolean> | undefined = undefined
    act(() => {
      secondValidation = result.current.fields.name.setValue('Valid Name', {
        runValidation: true
      })
    })

    expect(await secondValidation).toEqual(true)
    expect(result.current.fields.name.error).toEqual(undefined)
  })

  it('should say form is invalid if it was valid but is no longer', async () => {
    const { result } = render<Widget>({
      name: field(),
      details: {
        description: field(),
        picture: field()
      },
      components: field()
    })

    let firstValidation: boolean | undefined = undefined
    await act(async () => {
      result.current.fields.name.setValue('Widget A')
      result.current.fields.components.setValue([])
      result.current.fields.details.description.setValue('Description')
      result.current.fields.details.picture.setValue('Picture')
      firstValidation = await result.current.validate()
    })

    expect(firstValidation).toEqual(true)

    let secondValidation: boolean | undefined = undefined
    await act(async () => {
      result.current.fields.name.setValue('')
      secondValidation = await result.current.validate()
    })

    expect(secondValidation).toEqual(false)
  })

  it('should reset field value to default when a reset value is not provided', async () => {
    const { result } = render<Widget>({
      name: field(),
      details: {
        description: field(),
        picture: field()
      },
      components: field()
    })

    act(() => {
      result.current.fields.name.setValue('Widget A')
    })

    expect(result.current.fields.name.value).toEqual('Widget A')
    expect(result.current.fields.name.touched).toEqual(true)

    act(() => {
      result.current.fields.name.reset()
    })

    expect(result.current.fields.name.value).toEqual(undefined)
    expect(result.current.fields.name.touched).toEqual(false)
  })

  it('should reset field value', async () => {
    const { result } = render<Widget>({
      name: field(),
      details: {
        description: field(),
        picture: field()
      },
      components: field()
    })

    act(() => {
      result.current.fields.name.setValue('Widget A')
    })

    expect(result.current.fields.name.value).toEqual('Widget A')
    expect(result.current.fields.name.touched).toEqual(true)

    act(() => {
      result.current.fields.name.reset('Widget B')
    })

    expect(result.current.fields.name.value).toEqual('Widget B')
    expect(result.current.fields.name.touched).toEqual(false)
  })

  it('should reset field error to undefined', async () => {
    const { result } = render<Widget>({
      name: field(),
      details: {
        description: field(),
        picture: field()
      },
      components: field()
    })

    set(result.current.fields.name, 'Widget A')
    expect(result.current.fields.name.value).toEqual('Widget A')

    set(result.current.fields.name, '')
    await validate(result.current)
    expect(result.current.fields.name.error).toBeDefined()

    act(() => {
      result.current.fields.name.reset()
    })

    expect(result.current.fields.name.error).toBeUndefined()
  })

  it('should allow resetting form', () => {
    const existingWidget: Widget = {
      name: 'Widget',
      components: [{ id: 'component-1' }],
      details: {
        description: 'Description',
        picture: 'Picture'
      }
    }

    const { result } = render<Widget>(
      {
        name: field(),
        components: field(),
        details: {
          description: field(),
          picture: field()
        }
      },
      existingWidget
    )

    set(result.current.fields.name, 'Updated Widget')
    set(result.current.fields.details.description, 'Updated Description')

    expect(result.current.fields.name.value).toEqual('Updated Widget')
    expect(result.current.fields.name.touched).toEqual(true)
    expect(result.current.fields.details.description.value).toEqual(
      'Updated Description'
    )
    expect(result.current.fields.details.description.touched).toEqual(true)

    act(() => {
      result.current.reset(
        aWidget({
          name: 'Widget A',
          details: {
            description: 'Description after reset',
            picture: ''
          }
        })
      )
    })
    expect(result.current.fields.name.value).toEqual('Widget A')
    expect(result.current.fields.name.touched).toEqual(false)
    expect(result.current.fields.details.description.value).toEqual(
      'Description after reset'
    )
    expect(result.current.fields.details.description.touched).toEqual(false)
  })

  it('should allow resetting form to default when a reset value is not provided', () => {
    const existingWidget: Widget = {
      name: 'Widget',
      components: [{ id: 'component-1' }],
      details: {
        description: 'Description',
        picture: 'Picture'
      }
    }

    const { result } = render<Widget>(
      {
        name: field(),
        components: field(),
        details: {
          description: field(),
          picture: field()
        }
      },
      existingWidget
    )

    set(result.current.fields.name, 'Updated Widget')
    set(result.current.fields.details.description, 'Updated Description')

    expect(result.current.fields.name.value).toEqual('Updated Widget')
    expect(result.current.fields.name.touched).toEqual(true)
    expect(result.current.fields.details.description.value).toEqual(
      'Updated Description'
    )
    expect(result.current.fields.details.description.touched).toEqual(true)

    act(() => {
      result.current.reset()
    })
    expect(result.current.fields.name.value).toEqual('Widget')
    expect(result.current.fields.name.touched).toEqual(false)
    expect(result.current.fields.details.description.value).toEqual(
      'Description'
    )
    expect(result.current.fields.details.description.touched).toEqual(false)
  })

  it(`should set isTouched to false when fields haven't touched the form`, () => {
    const { result } = render<Widget>({
      name: field({ default: 'Brown' }),
      components: field<Component[]>({ default: [] }),
      details: {
        description: field({ default: null } as any),
        picture: field()
      }
    })

    const { isTouched } = result.current
    expect(isTouched).toEqual(false)
  })

  it('should set isTouched to false when fields contain a value', () => {
    const { result } = render<Widget>({
      name: field(),
      components: field(),
      details: {
        description: field(),
        picture: field()
      }
    })

    set(result.current.fields.name, 'Widget A')

    expect(result.current.isTouched).toEqual(true)
  })

  it('should not allow empty array in nonEmptyArrayField by default', async () => {
    type SpecificObject = { arrayField: number[] }

    const { result } = render<SpecificObject>({
      arrayField: nonEmptyArrayField()
    })

    set(result.current.fields.arrayField, [1, 2, 3])
    set(result.current.fields.arrayField, [])

    const isValid = await validate(result.current)

    const { fields } = result.current
    expect(isValid).toBeFalsy()
    expect(fields.arrayField.error).toEqual("This field can't be empty.")
  })

  it('should not allow zero for positiveNumber rule by default', async () => {
    type SpecificObject = { positiveNumber: number }
    let isValid

    const { result } = render<SpecificObject>({
      positiveNumber: positiveNumberField()
    })

    set(result.current.fields.positiveNumber, 2)
    isValid = await validate(result.current)
    expect(isValid).toBeTruthy()
    expect(result.current.fields.positiveNumber.error).toBeUndefined()

    set(result.current.fields.positiveNumber, 0)
    isValid = await validate(result.current)
    expect(isValid).toBeFalsy()
    expect(result.current.fields.positiveNumber.error).toEqual(
      'This field must be greater than zero.'
    )
  })

  it('should allow 0 for nonNegative rule by default', async () => {
    type SpecificObject = { nonNegativeNumber: number }
    let isValid

    const { result } = render<SpecificObject>({
      nonNegativeNumber: nonNegativeNumberField()
    })

    set(result.current.fields.nonNegativeNumber, 2)
    isValid = await validate(result.current)
    expect(isValid).toBeTruthy()
    expect(result.current.fields.nonNegativeNumber.error).toBeUndefined()

    set(result.current.fields.nonNegativeNumber, 0)
    isValid = await validate(result.current)
    expect(isValid).toBeTruthy()
    expect(result.current.fields.nonNegativeNumber.error).toBeUndefined()
  })

  it('should not allow -1 for nonNegative rule by default', async () => {
    type SpecificObject = { nonNegativeNumber: number }
    let isValid

    const { result } = render<SpecificObject>({
      nonNegativeNumber: nonNegativeNumberField()
    })

    set(result.current.fields.nonNegativeNumber, 2)
    isValid = await validate(result.current)
    expect(isValid).toBeTruthy()
    expect(result.current.fields.nonNegativeNumber.error).toBeUndefined()

    set(result.current.fields.nonNegativeNumber, -1)
    isValid = await validate(result.current)
    expect(isValid).toBeFalsy()
    expect(result.current.fields.nonNegativeNumber.error).toEqual(
      'This field must be greater than or equal to zero.'
    )
  })

  it('should change call callback when state changes', async () => {
    const onStateChange = jest.fn()
    const { result } = renderHook(() =>
      useForm<{ name: string }>(
        {
          name: field()
        },
        undefined,
        { onStateChange, delay: 0 }
      )
    )

    act(() => {
      result.current.fields.name.setValue('Change Name')
    })
    await act(async () => new Promise(resolve => setTimeout(resolve, 0)))
    expect(onStateChange).toHaveBeenCalledWith({ name: 'Change Name' })
  })

  it('should call change callback when component unmount', async () => {
    const onStateChange = jest.fn()
    const { result, unmount } = renderHook(() =>
      useForm<{ name: string }>(
        {
          name: field()
        },
        undefined,
        { onStateChange, delay: 10000, callOnStateChangeOnUnmount: true }
      )
    )

    act(() => {
      result.current.fields.name.setValue('Change Name')
    })

    unmount()

    expect(onStateChange).toHaveBeenCalledWith({ name: 'Change Name' })
  })

  it('should not call change callback when component unmount if callOnStateChangeOnUnmount is false', async () => {
    const onStateChange = jest.fn()
    const { result, unmount } = renderHook(() =>
      useForm<{ name: string }>(
        {
          name: field()
        },
        undefined,
        { onStateChange, delay: 10000 }
      )
    )

    act(() => {
      result.current.fields.name.setValue('Change Name')
    })

    unmount()

    expect(onStateChange).not.toHaveBeenCalled()
  })
})

describe('useForm validation rules', () => {
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

  it('should pass entire form state to validation rule and work on setValue', async () => {
    const { result } = render<Widget>(
      fieldDefs,
      aWidget({
        details: { description: null as any, picture: null as any }
      })
    )

    act(() => {
      result.current.fields.details.picture.setValue('bytes', {
        runValidation: true
      })
    })

    const { fields } = result.current
    expect(fields.details.picture.error).toEqual(
      'To upload a photo, you need to add a description'
    )
  })

  it('should pass entire form state to validation rule and work on validate', async () => {
    const { result } = render<Widget>(
      fieldDefs,
      aWidget({ details: { description: null as any, picture: 'bytes' } })
    )

    await validate(result.current)

    const { fields } = result.current
    expect(fields.details.picture.error).toEqual(
      'To upload a photo, you need to add a description'
    )
  })
})

function set<T>(field: Field<T>, value: T): void {
  act(() => field.setValue(value))
}

async function validate<T>(currentForm: UseForm<T>): Promise<boolean> {
  const { validate } = currentForm
  let isValid: boolean = false
  await act(async () => {
    isValid = await validate()
  })
  return Promise.resolve(isValid)
}

function render<T>(
  fieldDefs: FieldDefinitions<T>,
  defaultValue?: T
): RenderHookResult<unknown, UseForm<T>> {
  return renderHook(() => useForm(fieldDefs, defaultValue))
}
