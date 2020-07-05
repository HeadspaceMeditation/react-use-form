import { act, renderHook, RenderHookResult } from '@testing-library/react-hooks'
import { field, useForm, UseForm } from '../src/index'
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
    act(() => {
      isValid = validate()
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
    act(() => {
      isValid = validate()
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
      result.current.fields.name.onChange('Widget A')
    })

    act(() => {
      result.current.fields.components.onChange([])
    })

    act(() => {
      result.current.fields.details.description.onChange('Description')
    })

    act(() => {
      result.current.fields.details.picture.onChange('Picture')
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
})

function render<T>(
  fieldDefs: FieldDefinitions<T>
): RenderHookResult<unknown, UseForm<T>> {
  return renderHook(() => useForm(fieldDefs))
}
