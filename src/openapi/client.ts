import type { FetchContext, FetchOptions } from 'ofetch'
import type { OpenAPIClient } from './types.ts'
import { ofetch } from 'ofetch'

export function createOpenAPIClient<Paths>(
  defaultOptions: FetchOptions | (() => FetchOptions) = {},
): OpenAPIClient<Paths> {
  const client = ofetch.create(typeof defaultOptions === 'function' ? defaultOptions() : defaultOptions)

  return (url, options) => client(
    // @ts-expect-error: Path parameter provided by OpenAPI types
    resolvePathParams(url, options?.path),
    options as Record<string, any>,
  )
}

export function resolvePathParams(path: string, params?: Record<string, string>): string {
  if (params) {
    for (const [key, value] of Object.entries(params))
      path = path.replace(`{${key}}`, encodeURIComponent(String(value)))
  }

  return path
}

export function fetchRequestInterceptor(ctx: FetchContext): void {
  ctx.request = resolvePathParams(
    ctx.request as string,
    // @ts-expect-error: Path parameter provided by OpenAPI types
    ctx.options.path,
  )
}
