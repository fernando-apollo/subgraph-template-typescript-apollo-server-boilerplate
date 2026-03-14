import { MutationResolvers } from "../__generated__/resolvers-types";
import { products } from "../data";

export const Mutation: MutationResolvers = {
  createProduct: (_, { input }) => {
    const product = {
      id: String(products.length + 1),
      name: input.name,
      price: input.price,
      inStock: input.inStock ?? true,
    };
    products.push(product);
    return product;
  },
};
