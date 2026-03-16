import { QueryResolvers } from "../__generated__/resolvers-types";

export const Query: QueryResolvers = {
  product: async (_, { id }, { dataSources }) => {
    return dataSources.productsAPI.getById(id);
  },
  products: async (_, __, { dataSources }) => {
    return dataSources.productsAPI.getAll();
  },
};
