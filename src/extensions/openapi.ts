import type { OpenAPISchemaRepository } from 'apiful/schema'
import type { ApiClient } from '../client.ts'
import type { OpenAPIClient } from '../openapi/types.ts'
import { ofetch } from 'ofetch'
import { resolvePathParams } from '../openapi/index.ts'

type ExtractPaths<K> = K extends keyof OpenAPISchemaRepository
  ? OpenAPISchemaRepository[K]
  : Record<string, never>

export type * from '../openapi/types.ts'

export function OpenAPIBuilder<
  const Schema extends string,
  Paths = ExtractPaths<Schema>,
>() {
  return function (client: ApiClient): OpenAPIClient<Paths> {
    const fetcher = ofetch.create(client.defaultOptions)

    return (path, options) => fetcher(
      // @ts-expect-error: Path parameter provided by OpenAPI types
      resolvePathParams(path, options?.path),
      options as Record<string, any>,
    )
  }
}
