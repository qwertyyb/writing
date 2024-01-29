import type { Component, ComponentInstance } from "vue"

export interface Plugin<T extends any = any> {
  identifier: string,
  command?: Component,
  render: Component,
  save: (comp: ComponentInstance<T>) => any
}
