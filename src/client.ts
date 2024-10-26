import type { FetchOptions } from 'ofetch'

type Fn<T = any> = (...args: any[]) => T

export type ExtensionValue = string | number | boolean | any[] | Fn | Record<string, any> | undefined
export type HandlerExtension = Fn
export type MethodsExtension = Record<string, ExtensionValue>
export type ApiExtension = HandlerExtension | MethodsExtension

export type HandlerExtensionBuilder = (client: ApiClient) => HandlerExtension
export type MethodsExtensionBuilder = (client: ApiClient) => MethodsExtension

export interface ApiClient<BaseURL extends string = string> extends Function {
  _handler: Fn
  _extensions: Record<PropertyKey, ExtensionValue>
  defaultOptions: FetchOptions
  with: <Extension extends ApiExtension>(
    createExtension: (client: ApiClient<BaseURL>) => Extension,
  ) => this & Extension
}

export function createClient<const BaseURL extends string = '/'>(
  defaultOptions: Omit<FetchOptions, 'baseURL'> & { baseURL?: BaseURL } = {},
): ApiClient<BaseURL> {
  const client = (() => {}) as unknown as ApiClient<BaseURL>

  client.defaultOptions = defaultOptions
  client._extensions = Object.create(null)

  client.with = function <Extension extends ApiExtension>(
    createExtension: (client: ApiClient<BaseURL>) => Extension,
  ) {
    const extension = createExtension(this)

    if (typeof extension === 'function') {
      this._handler = extension
    }
    else {
      for (const key in extension) {
        if (Object.prototype.hasOwnProperty.call(extension, key)) {
          this._extensions[key] = extension[key] as ExtensionValue
        }
      }
    }

    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target._extensions)
          return target._extensions[prop]

        if (prop in target)
          return Reflect.get(target, prop, receiver)

        return Reflect.get(extension, prop, receiver)
      },
      set(target, prop, value, receiver) {
        if (prop in target._extensions) {
          target._extensions[prop] = value
          return true
        }

        return Reflect.set(extension, prop, value, receiver)
      },
      apply(target, thisArg, args) {
        if (target._handler)
          return target._handler(...args)

        return Reflect.apply(target, thisArg, args)
      },
    }) as ApiClient<BaseURL> & Extension
  }

  return client
}
