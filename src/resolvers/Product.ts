import { ProductResolvers } from "../__generated__/resolvers-types";
import { products } from "../data";

export const Product: ProductResolvers = {
  __resolveReference: (parent) => {
    return products.find((p) => p.id === parent.id) ?? null;
  },
};
