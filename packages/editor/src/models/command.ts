import type { Component } from "vue"

export interface Command {
  id: string,
  label: string,
  keyword?: string[],
  component: Component,
}