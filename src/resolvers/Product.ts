import { ProductResolvers } from "../__generated__/resolvers-types";

export const Product: ProductResolvers = {
  __resolveReference: async (parent, { dataSources }) => {
    return dataSources.productsAPI.getById(parent.id);
  },
};
