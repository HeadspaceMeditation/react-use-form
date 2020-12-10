export type Widget = {
  name: string
  details: Details
  components: Component[]
}
export type Component = {
  id: string
}
type Details = {
  description: string
  picture: string
}

export function aWidget(partial: Partial<Widget> = {}): Widget {
  return {
    name: 'Name',
    components: [],
    details: {
      description: 'description',
      picture: 'bytes'
    },
    ...partial
  }
}
