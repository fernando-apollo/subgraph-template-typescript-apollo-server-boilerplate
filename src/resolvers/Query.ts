import { QueryResolvers } from "../__generated__/resolvers-types";
import { products } from "../data";

export const Query: QueryResolvers = {
  product: (_, { id }) => {
    return products.find((p) => p.id === id) ?? null;
  },
  products: () => {
    return products;
  },
};
