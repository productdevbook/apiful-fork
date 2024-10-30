import type { JSONSchema } from 'json-schema-to-typescript'
import type { JsonValue } from './types'

export async function generateTypeFromJson(data: Record<string, JsonValue>, typeName: string) {
  const schema = createJsonSchema(data)
  return await generateTypeFromSchema(schema, typeName || 'Root')
}

export async function generateTypeFromSchema(schema: JSONSchema, typeName: string): Promise<string> {
  const { compile } = await import ('json-schema-to-typescript')

  if (schema.type === 'array' && schema.items) {
    const itemTypeName = `${typeName}Item`
    const itemType = await compile(schema.items, itemTypeName, { bannerComment: '' })
    return `
${itemType}
export type ${typeName} = ${itemTypeName}[];
`.trimStart()
  }

  return await compile(schema, typeName, { bannerComment: '' })
}

function createJsonSchema(data: unknown): JSONSchema {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return {
        type: 'array',
        items: {},
      }
    }

    const itemSchemas = data.map(item => createJsonSchema(item))
    return {
      type: 'array',
      items: mergeSchemas(itemSchemas),
    }
  }
  else if (typeof data === 'object' && data !== null) {
    return {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, createJsonSchema(value)]),
      ),
      additionalProperties: Object.keys(data).length === 0,
    }
  }
  else if (data === null) {
    return {
      type: 'any',
    }
  }
  else {
    return {
      type: typeof data as JSONSchema['type'],
    }
  }
}

function mergeSchemas(schemas: JSONSchema[]): JSONSchema {
  if (schemas.length === 0)
    return {}

  if (schemas.length === 1)
    return schemas[0]!

  const types = new Set(schemas.map(schema => schema.type))

  // If schemas have different types, create a union type
  if (types.size !== 1) {
    return {
      anyOf: schemas,
    }
  }

  const type = schemas[0]!.type

  if (type === 'object') {
    // Merge object properties
    const allProperties = new Map<string, JSONSchema[]>()

    for (const schema of schemas) {
      if (schema.properties) {
        for (const [key, value] of Object.entries(schema.properties)) {
          if (!allProperties.has(key)) {
            allProperties.set(key, [])
          }
          allProperties.get(key)!.push(value)
        }
      }
    }

    return {
      type: 'object',
      properties: Object.fromEntries(
        Array.from(allProperties.entries()).map(([key, propertySchemas]) => [
          key,
          mergeSchemas(propertySchemas),
        ]),
      ),
      additionalProperties: allProperties.size === 0,
    }
  }
  else if (type === 'array') {
    // Merge array item schemas
    const itemSchemas = schemas
      .map(schema => schema.items)
      .filter((items): items is JSONSchema => Boolean(items))

    return {
      type: 'array',
      items: mergeSchemas(itemSchemas),
    }
  }
  else {
    // For primitive types, create a union type if they're different
    return schemas[0]!
  }
}
