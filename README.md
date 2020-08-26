# React useForm

React `useForm` is a custom [hook](https://reactjs.org/docs/hooks-intro.html) that makes building forms easier in React.

In React, you often need to extract form data and map it to the shape that your backend API expects -- e.g. a graphQL type. This can quickly get complicated when your object contains nested types (e.g. `person.address.street`). The `useForm` hook makes this easy.

Just specify your object's shape + validation rules and `useForm` gives you a `fields` object with properties that recursively mirror your object (e.g. `person.address.street.value`, `person.address.street.error`, `person.address.street.setValue` etc). You bind those to input components of your choice (e.g. `<TextField field={person.address.street} />`) Then, when the user clicks your "submit" button, simply call `getValue()` to get your fully-formed object out -- no manual data mapping required.

## Installation

`npm install @ginger.io/react-use-form`

## Usage

```TSX
import React from 'react'
import { useForm, field, Field } from "@ginger.io/react-use-form"

type Person = {
  name: string
  phone: string
  address: Address
}

type Address = {
  street: string
  zip: number
}

function PersonForm(props: {}) {
  const { fields, validate, getValue } = useForm<Person>({
    name: field(),
    phone: field(),
    address: {
      street: field(),
      zip: field({
        rules: [
          zip => (zip.toString().length === 5 ? undefined : 'Invalid zip code')
        ]
      })
    }
  })

  const onSubmit = async () => {
    if (await validate()) { // trigger validation
      console.log(getValue()) // get your fully-formed Person
    }
  }

  return (
    <>
      <TextField label="Name" field={fields.name} />
      <TextField label="Phone" field={fields.phone} />
      <TextField label="Street" field={fields.address.street} />
      <NumberField label="Zip" field={fields.address.zip} />
      <button onClick={onSubmit} />
    </>
  )
}

function TextField(props: { label: string; field: Field<string> }) {
  const { label, field } = props
  return (
    <>
      <label>{label}</label>
      <input
        type="text"
        value={field.value}
        onChange={e => field.setValue(e.target.value)}
      />
      <p>{field.error}</p>
    </>
  )
}

function NumberField(props: { label: string; field: Field<number> }) {
  const { label, field } = props
  return (
    <>
      <label>{label}</label>
      <input
        type="number"
        value={field.value}
        onChange={e => field.setValue(parseInt(e.target.value))}
      />
      <p>{field.error}</p>
    </>
  )
}
```

## Hook API

```TypeScript

type UseForm<T> = {
  fields: Fields<T> // field bindings
  validate: () => boolean // trigger validation
  getValue: () => T // retrieve the current form value
  isEmpty: boolean // true if all fields are undefined, null or ""
}

function useForm<T>(fieldDefinitions: FieldDefinitions<T>, defaultValue?: T): UseForm<T>
```

### fields: Fields<T>

A recursive mirror of your object, where each field is a `Field<T>`.

### validate: () => Promise<boolean>

Triggers the validation rules for _all_ properties (use this if you want validation errors to show up _after_ the user clicks your submit button vs right away with `fields.foo.validate`).

### getValue: () => T

Returns your fully formed object. Make sure it's valid first either by disabling your submit button when fields have errors or calling `validate()`, before trying to use it.

### isEmpty: boolean

This value is `true` if all fields of `T` are either: `undefined | null | "" | [] (empty array)`, `false` otherwise. And this value is kept up to date across renders.

## Field<T> API

A `Field<T>` represents the state for a specific field on your object, with the following properties:

#### value: T

The current value of this property (changes across renders)

#### setValue<T>(input: T) => void

The `setValue` handler for this property. Passing a new value triggers a re-render of your form.

#### error: string | undefined

The first error triggered by your validation rules or `undefined`

#### validate: () => void

The `validate` handler for this property. Calling this triggers the validation rules for this property and triggers a re-render.

## Default Values

There are two ways to specify a default value:

1. Pass a fully formed `T` as the second parameter to `useForm`, e.g. `useForm({...}, defaultValue)`.
   This is useful when you have an existing object from your API and you want to "edit" it in your form.

2. Pass a default value for a specific field, using the `field` helper method -- e.g:

```TypeScript
useForm({
  name: field({ default: "foo" })
})
```

Note: Field-level defaults override top-level defaults.
