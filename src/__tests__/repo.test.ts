import { ApolloServer } from "@apollo/server";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { readFileSync } from "fs";
import gql from "graphql-tag";
import { resolvers } from "../resolvers";

const typeDefs = gql(
  readFileSync("schema.graphql", { encoding: "utf-8" })
);

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

describe("Product Subgraph", () => {
  it("resolves product by ID", async () => {
    const result = await server.executeOperation({
      query: `query { product(id: "1") { id name price inStock } }`,
    });

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data?.product).toEqual({
        id: "1",
        name: "Saturn V Rocket",
        price: 149.99,
        inStock: true,
      });
    }
  });

  it("resolves all products", async () => {
    const result = await server.executeOperation({
      query: `query { products { id name } }`,
    });

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data?.products).toHaveLength(3);
    }
  });

  it("resolves product entity reference", async () => {
    const result = await server.executeOperation({
      query: `query ($representations: [_Any!]!) {
        _entities(representations: $representations) {
          ... on Product { id name price inStock }
        }
      }`,
      variables: {
        representations: [{ __typename: "Product", id: "1" }],
      },
    });

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data?._entities).toEqual([
        { id: "1", name: "Saturn V Rocket", price: 149.99, inStock: true },
      ]);
    }
  });

  it("creates a product", async () => {
    const result = await server.executeOperation({
      query: `mutation {
        createProduct(input: { name: "Lunar Rover", price: 99.99 }) {
          id name price inStock
        }
      }`,
    });

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data?.createProduct).toMatchObject({
        name: "Lunar Rover",
        price: 99.99,
        inStock: true,
      });
    }
  });
});
