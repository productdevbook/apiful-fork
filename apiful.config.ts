import { defineApifulConfig } from './src/config'

export default defineApifulConfig({
  services: {
    testEcho: {
      schema: 'test/fixtures/test-echi-api-schema.yml',
    },
    petStore: {
      schema: 'playground/schemas/pet-store.json',
    },
  },
})
