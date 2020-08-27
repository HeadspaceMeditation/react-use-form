import { act, renderHook, RenderHookResult } from '@testing-library/react-hooks'
import { field, useForm, UseForm } from '../src/index'
import { ValidationRule } from '../src/rules'
import { FieldDefinitions } from '../src/types'

type Widget = {
  name: string
  details: Details
  components: Component[]
}

type Component = {
  id: string
}

type Details = {
  description: string
  picture: string
}

const noInvalidName: ValidationRule<string> = name =>
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

    act(() => {
      result.current.fields.name.setValue('Widget A')
    })

    expect(result.current.isEmpty).toEqual(false)
  })

  it('should allow false-y values as default values', () => {
    type SomeType = {
      name: string
      isPresent: boolean
    }

    const { result } = render<SomeType>({
      name: field({ default: '', rules: [] }), // empty strings are falsey in JS, e.g. "" || "foo" => "foo"
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

    const { validate } = result.current
    let isValid = undefined
    await act(async () => {
      isValid = await validate()
    })

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

    const { validate } = result.current
    let isValid = undefined
    await act(async () => {
      isValid = await validate()
    })

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

  it('should have field-level defaults supersede full object default', () => {
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
        name: field({ default: 'Supersede!' }),
        components: field(),
        details: {
          description: field(),
          picture: field()
        }
      },
      existingWidget
    )

    const { fields } = result.current
    expect(fields.name.value).toEqual('Supersede!')
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

    act(() => {
      result.current.fields.name.setValue('Widget A')
      result.current.fields.components.setValue([])
      result.current.fields.details.description.setValue('Description')
      result.current.fields.details.picture.setValue('Picture')
    })

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

  it('should reset field value to default', async () => {
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

  it('should reset field error to undefined', () => {
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

    act(() => {
      result.current.fields.name.setValue('')
      result.current.validate()
    })
    expect(result.current.fields.name.error).toBeDefined()

    act(() => {
      result.current.fields.name.reset()
    })

    expect(result.current.fields.name.error).toBeUndefined()
  })

  it('should allow resetting form to default', () => {
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

    act(() => {
      result.current.fields.name.setValue('Updated Widget')
      result.current.fields.details.description.setValue('Updated Description')
    })

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
})

function render<T>(
  fieldDefs: FieldDefinitions<T>,
  defaultValue?: T
): RenderHookResult<unknown, UseForm<T>> {
  return renderHook(() => useForm(fieldDefs, defaultValue))
}
