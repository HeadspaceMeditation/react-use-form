# React useForm

React `useForm` is a custom [hook](https://reactjs.org/docs/hooks-intro.html) that makes building forms easier in React.

In React, you often need to extract form data and map it to the shape that your backend API expects -- e.g. a graphQL type. This can quickly get complicated when your object contains nested types (e.g. `person.address.street`). The `useForm` hook makes this easy.

Just specify your object's shape + validation rules and `useForm` gives you a `fields` object with properties that recursively mirror your object (e.g. `person.address.street.value`, `person.address.street.error`, `person.address.street.onChange` etc). You bind those to input components of your choice (e.g. `<TextField field={person.address.street} />`) Then, when the user clicks your "submit" button, simply call `getValue()` to get your fully-formed object out -- no manual data mapping required.

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

  const onSubmit = () => {
    if (validate()) { // trigger validation
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
        onChange={e => field.onChange(e.target.value)}
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
        onChange={e => field.onChange(parseInt(e.target.value))}
      />
      <p>{field.error}</p>
    </>
  )
}
```

## API

### fields

A recursive mirror of your object, where each field is a `Field<T>` with the following properities:

#### value: T

The current value of this property (changes across renders)

#### onChange<T>(input: T) => void

The `onChange` handler for this property. Passing a new value triggers a re-render of your form.

#### error: string | undefined

The first error triggered by your validation rules or `undefined`

#### onBlur: () => void

The `onBlur` handler for this property. Calling this triggers the validation rules for this property and triggers a re-render.

### validate: () => boolean

Triggers the validation rules for _all_ properties (use this if you want validation errors to show up _after_ the user clicks your submit button vs right away with `onBlur`).

### getValue: () => T

Returns your fully formed object. Make sure it's valid first either by disabling your submit button when fields have errors or calling `validate()`, before trying to use it.

### isEmpty: boolean

This value is `true` if all fields of `T` are either: `undefined | null | "" | [] (empty array)`, `false` otherwise. And this value is kept up to date across renders.
