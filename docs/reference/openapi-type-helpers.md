# OpenAPI Type Helpers

When building clients with the [`OpenAPIBuilder` extension](/extensions/openapi), you may want to access the request and response types for each operation in the OpenAPI schema. APIful provides intuitive types to allow you to do this easily, without needing to manually define types for each endpoint.

## Feature Overview

The unified type interface allows you to access all aspects of an OpenAPI endpoint in a type-safe manner. This includes:

- **Intuitive path-based access** - Use the actual API path as you would write it in your code
- **Property-based access** - Get types through natural property access: `path`, `query`, `request`, etc.
- **HTTP method specificity** - Extract types for specific HTTP methods on the same path
- **Status code support** - Extract response types for specific status codes
- **Additional metadata** - Access to `fullPath`, `method`, and the full `operation` object

## Intuitive API Access

Given the API service name `petStore`, APIful generates a unified type interface that allows you to access all aspects of an endpoint through a single type:

```ts
import type { PetStore } from 'apiful/schema'

// Access everything through the unified API
type UserEndpoint = PetStore<'/user/{username}', 'get'>

// Types are available through property access
type PathParams = UserEndpoint['path'] // Path parameters
type QueryParams = UserEndpoint['query'] // Query parameters
type RequestBody = UserEndpoint['request'] // Request body
type Response = UserEndpoint['response'] // Response (defaults to 200 status)
type NotFound = UserEndpoint['responses'][404] // Response for specific status code
```

## Examples of Type Usage

Here are some practical examples of how to use these types:

```ts
import type { PetStore } from 'apiful/schema'

// Get path parameters for /pet/{petId} path with GET method
type PetParams = PetStore<'/pet/{petId}', 'get'>['path']
//   ^? { petId: number }

// Get query parameters for finding pets by status
type StatusQuery = PetStore<'/pet/findByStatus', 'get'>['query']
//   ^? { status?: "available" | "pending" | "sold" }

// Get request body for creating a pet
type CreatePetBody = PetStore<'/pet', 'post'>['request']
//   ^? { id?: number; name: string; /* ... */ }

// Get success response type for getting a pet
type PetResponse = PetStore<'/pet/{petId}', 'get'>['response']
//   ^? { id?: number; name: string; /* ... */ }

// Get a specific status code response
type NotFoundResponse = PetStore<'/pet/{petId}', 'get'>['responses'][404]
```

## Helper Types for Path and Method Information

APIful also provides utility types to help you work with available paths and methods:

```ts
import type { PetStoreApiMethods, PetStoreApiPaths } from 'apiful/schema'

// Get a union of all available API paths
type AllPaths = PetStoreApiPaths
//   ^? '/pet' | '/pet/{petId}' | '/pet/findByStatus' | /* ... */

// Get all available methods for a specific path
type PetMethods = PetStoreApiMethods<'/pet'>
//   ^? 'get' | 'post' | 'put'
```
