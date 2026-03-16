import { ProductsAPI } from "../datasources/ProductsAPI";

export interface DataSourceContext {
  auth?: string;
  dataSources: {
    productsAPI: ProductsAPI;
  };
}
