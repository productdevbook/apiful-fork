import type { FetchOptions } from 'ofetch'

type Fn<T = any> = (...args: any[]) => T

export type HandlerExtension = Fn
export type MethodsExtension = Record<string, Fn>
export type ApiExtension = HandlerExtension | MethodsExtension

export type HandlerExtensionBuilder = (client: ApiClient) => HandlerExtension
export type MethodsExtensionBuilder = (client: ApiClient) => MethodsExtension

// eslint-disable-next-line ts/no-unsafe-function-type
export interface ApiClient<BaseURL extends string = string> extends Function {
  _extensions: Record<string, Fn>
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

  client._extensions = {}

  client.with = function <Extension extends ApiExtension>(
    createExtension: (client: ApiClient<BaseURL>) => Extension,
  ) {
    const extension = createExtension(this)

    // Accumulate all non-callable extensions
    if (typeof extension !== 'function')
      Object.assign(this._extensions, extension)

    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target._extensions)
          return target._extensions[prop as string]

        if (prop in target)
          return Reflect.get(target, prop, receiver)

        return Reflect.get(extension, prop, receiver)
      },
      set(target, prop, value, receiver) {
        if (prop in target._extensions) {
          target._extensions[prop as string] = value
          return true
        }

        return Reflect.set(extension, prop, value, receiver)
      },
      apply(target, thisArg, args) {
        if (typeof extension === 'function')
          return extension(...args)

        return Reflect.apply(target, thisArg, args)
      },
    }) as ApiClient<BaseURL> & Extension
  }

  return client
}
