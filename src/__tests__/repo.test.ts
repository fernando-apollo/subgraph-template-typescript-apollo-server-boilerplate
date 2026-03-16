import { ApolloServer } from "@apollo/server";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { readFileSync } from "fs";
import gql from "graphql-tag";
import http from "http";
import { resolvers } from "../resolvers";
import { ProductsAPI } from "../datasources/ProductsAPI";
import { DataSourceContext } from "../types/DataSourceContext";

const typeDefs = gql(
  readFileSync("schema.graphql", { encoding: "utf-8" })
);

// Fake REST API server
function createFakeAPI(): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/products") {
        res.end(JSON.stringify({
          products: [
            { id: 1, name: "Saturn V Rocket", description: "A heavy launch vehicle", category: "Rockets", availability: "AVAILABLE" },
            { id: 2, name: "Lunar Module", description: "Moon lander", category: "Spacecraft", availability: "AVAILABLE" },
            { id: 3, name: "Space Shuttle", description: "Reusable orbiter", category: "Spacecraft", availability: "UNAVAILABLE" },
          ],
        }));
      } else if (req.url === "/products/1") {
        res.end(JSON.stringify({ id: 1, name: "Saturn V Rocket", description: "A heavy launch vehicle", category: "Rockets", availability: "AVAILABLE" }));
      } else if (req.url === "/products/999") {
        res.writeHead(404);
        res.end();
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      resolve({ url: `http://localhost:${addr.port}`, close: () => server.close() });
    });
  });
}

describe("Product Subgraph", () => {
  let fakeAPI: { url: string; close: () => void };
  let server: ApolloServer<DataSourceContext>;

  beforeAll(async () => {
    fakeAPI = await createFakeAPI();
    server = new ApolloServer<DataSourceContext>({
      schema: buildSubgraphSchema({ typeDefs, resolvers }),
    });
  });

  afterAll(() => {
    fakeAPI.close();
  });

  function contextValue(): DataSourceContext {
    return {
      dataSources: {
        productsAPI: new ProductsAPI(fakeAPI.url),
      },
    };
  }

  it("resolves product by ID", async () => {
    const result = await server.executeOperation(
      { query: `query { product(id: "1") { id name description category availability } }` },
      { contextValue: contextValue() },
    );

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data?.product).toEqual({
        id: "1",
        name: "Saturn V Rocket",
        description: "A heavy launch vehicle",
        category: "Rockets",
        availability: "AVAILABLE",
      });
    }
  });

  it("resolves all products", async () => {
    const result = await server.executeOperation(
      { query: `query { products { id name } }` },
      { contextValue: contextValue() },
    );

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data?.products).toHaveLength(3);
    }
  });

  it("returns null for unknown product", async () => {
    const result = await server.executeOperation(
      { query: `query { product(id: "999") { id name } }` },
      { contextValue: contextValue() },
    );

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data?.product).toBeNull();
    }
  });

  it("resolves product entity reference", async () => {
    const result = await server.executeOperation(
      {
        query: `query ($representations: [_Any!]!) {
          _entities(representations: $representations) {
            ... on Product { id name category }
          }
        }`,
        variables: {
          representations: [{ __typename: "Product", id: "1" }],
        },
      },
      { contextValue: contextValue() },
    );

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data?._entities).toEqual([
        { id: "1", name: "Saturn V Rocket", category: "Rockets" },
      ]);
    }
  });
});
