# Apollo Federation Subgraph — TypeScript (Apollo Server)

An [Apollo Federation] subgraph template using [Apollo Server] and TypeScript. It fetches data from a real REST API ([ecommerce.demo-api.apollo.dev](https://ecommerce.demo-api.apollo.dev)) and demonstrates modern federation patterns including entity resolution, cache control, and demand control (`@cost`/`@listSize`).

## Schema

```graphql
type Query {
  product(id: ID!): Product @cacheControl(maxAge: 60)
  products: [Product!]! @listSize(assumedSize: 30) @cacheControl(maxAge: 30)
}

type Product @key(fields: "id") @cost(weight: 2) {
  id: ID!
  name: String!
  description: String!
  category: String!
  availability: Availability!
}

enum Availability {
  AVAILABLE
  UNAVAILABLE
}
```

## Architecture

```
schema.graphql          → Federation schema (v2.13)
src/
  datasources/
    ProductsAPI.ts      → REST client for ecommerce demo API
  resolvers/
    Query.ts            → product() and products() queries
    Product.ts          → __resolveReference for entity resolution
    index.ts            → Resolver map
  types/
    DataSourceContext.ts → Typed context with dataSources
  index.ts              → Server setup with Apollo plugins
  __tests__/
    repo.test.ts        → Tests with fake HTTP server
```

**Data flow:** GraphQL query → resolver → `ProductsAPI` → REST API (`GET /products`, `GET /products/{id}`) → mapped response.

## Quick Start

```bash
npm install
npm start
# Server starts on http://localhost:4001
```

Then open [Apollo Sandbox](https://studio.apollographql.com/sandbox/explorer) and connect to `http://localhost:4001`.

To develop with a local router:

```bash
rover dev --url http://localhost:4001 --name products
```

## Development

```bash
npm run dev      # Hot-reload with nodemon
npm run build    # Codegen + compile
npm test         # Run tests
```

## Apollo Server Plugins

This template enables three Apollo Server plugins:

| Plugin | Purpose |
|--------|---------|
| `CacheControl` | Honors `@cacheControl` directives, sets cache hints |
| `InlineTrace` | Sends federated trace data to the router |
| `UsageReporting` | Reports metrics to Apollo Studio (requires `APOLLO_KEY`) |

## Apollo Studio Integration

1. Set these secrets in GitHub Actions:
   - `APOLLO_KEY`: An Apollo Studio API key for the supergraph.
   - `APOLLO_GRAPH_REF`: The graph ref in Apollo Studio.
   - `PRODUCTION_URL`: The deployed subgraph URL.
2. Remove the `if: false` lines from `.github/workflows/` to enable schema checks and publishing.
3. Send the `Router-Authorization` header [from your Cloud router](https://www.apollographql.com/docs/graphos/routing/cloud-configuration#managing-secrets) and set the `ROUTER_SECRET` environment variable.

## Tests

Tests use a fake HTTP server that returns canned product data, injected into `ProductsAPI` via its `baseURL` constructor parameter. No real API calls are made during tests.

```bash
npm test
```

---

## Customizing This Template

### For LLMs / AI Agents

This template is designed to be easily adapted to any domain. Here is what to change and in what order:

#### What You Need

1. **Your SDL (schema)** — the GraphQL types, queries, and entity definitions for your domain
2. **Your data source** — a REST API, database, or other backend to fetch data from

#### Step-by-Step

1. **Replace `schema.graphql`** with your SDL.
   - Keep the `@contact`, `@link` (federation), and `@cacheControl` directive declarations at the top.
   - Mark entity types with `@key(fields: "id")` (or your key field).
   - Add `@cacheControl`, `@cost`, `@listSize` as appropriate.

2. **Replace `src/datasources/ProductsAPI.ts`** with your data source class.
   - Constructor must accept a `baseURL` parameter (for test injection).
   - Export a class with async methods that return data matching your schema types.
   - Handle not-found cases by returning `null` (not throwing).

3. **Update `src/types/DataSourceContext.ts`** — replace `productsAPI` with your datasource instance name.

4. **Update `src/index.ts`** — instantiate your datasource in the `context` function.

5. **Replace resolvers** in `src/resolvers/`:
   - `Query.ts` — implement your query fields, calling `dataSources.yourAPI`.
   - Create a resolver file for each entity type with `__resolveReference`.
   - Update `index.ts` to export the new resolver map.

6. **Run `npm run build`** — codegen will regenerate types from your new schema.

7. **Update tests** in `src/__tests__/repo.test.ts`:
   - Update the fake HTTP server to return your domain data.
   - Test: query by ID, list query, entity resolution (`_entities`), not-found returns null.

8. **Update `package.json`** — set `"name"` to your subgraph name.

#### Example: Adapting to a "Users" Domain

```typescript
// src/datasources/UsersAPI.ts
export class UsersAPI {
  constructor(private baseURL: string = "https://your-api.example.com") {}
  async getById(id: string) { /* GET /users/{id} */ }
  async getAll() { /* GET /users */ }
}
```

```typescript
// src/types/DataSourceContext.ts
import { UsersAPI } from "../datasources/UsersAPI";
export interface DataSourceContext {
  auth?: string;
  dataSources: { usersAPI: UsersAPI };
}
```

#### Key Conventions

- **Entity resolution**: Every `@key` type needs a `__resolveReference` resolver that fetches by the key field(s).
- **Context pattern**: Datasources live on `context.dataSources` — instantiated per-request in `src/index.ts`.
- **Codegen**: Types are auto-generated from `schema.graphql` into `src/__generated__/resolvers-types.ts`. Run `npm run build` after schema changes.
- **Router auth**: The template checks `Router-Authorization` header when `ROUTER_SECRET` env var is set.

[Apollo Federation]: https://www.apollographql.com/docs/federation/
[Apollo Server]: https://www.apollographql.com/docs/apollo-server/
[@apollo/subgraph]: https://www.apollographql.com/docs/federation/subgraphs
[Rover]: https://www.apollographql.com/docs/rover/
