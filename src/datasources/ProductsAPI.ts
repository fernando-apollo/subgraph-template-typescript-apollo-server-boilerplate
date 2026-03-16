import { Availability } from "../__generated__/resolvers-types";

const BASE_URL = "https://ecommerce.demo-api.apollo.dev";

interface ApiProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  availability: string;
}

interface ApiProductsResponse {
  products: ApiProduct[];
}

function toProduct(p: ApiProduct) {
  return {
    id: String(p.id),
    name: p.name,
    description: p.description,
    category: p.category,
    availability: p.availability as Availability,
  };
}

export class ProductsAPI {
  private baseURL: string;

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL;
  }

  async getAll() {
    const resp = await fetch(`${this.baseURL}/products`);
    if (!resp.ok) throw new Error(`Failed to fetch products: ${resp.status}`);
    const data: ApiProductsResponse = await resp.json();
    return data.products.map(toProduct);
  }

  async getById(id: string) {
    const resp = await fetch(`${this.baseURL}/products/${id}`);
    if (resp.status === 404) return null;
    if (!resp.ok) throw new Error(`Failed to fetch product ${id}: ${resp.status}`);
    const data: ApiProduct = await resp.json();
    return toProduct(data);
  }
}
