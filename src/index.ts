import { readFileSync } from "fs";
import gql from "graphql-tag";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { ApolloServer, ContextFunction } from "@apollo/server";
import {
  StandaloneServerContextFunctionArgument,
  startStandaloneServer,
} from "@apollo/server/standalone";
import { ApolloServerPluginCacheControl } from "@apollo/server/plugin/cacheControl";
import { ApolloServerPluginInlineTrace } from "@apollo/server/plugin/inlineTrace";
import { ApolloServerPluginUsageReporting } from "@apollo/server/plugin/usageReporting";
import { resolvers } from "./resolvers";
import { DataSourceContext } from "./types/DataSourceContext";
import { GraphQLError } from "graphql";

const port = process.env.PORT ?? "4001";
const subgraphName = require("../package.json").name;
const routerSecret = process.env.ROUTER_SECRET;

const context: ContextFunction<
  [StandaloneServerContextFunctionArgument],
  DataSourceContext
> = async ({ req }) => {
  if (routerSecret && req.headers["router-authorization"] !== routerSecret) {
    throw new GraphQLError("Missing router authentication", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 401 },
      },
    });
  }

  return {
    auth: req.headers.authorization,
  };
};

async function main() {
  let typeDefs = gql(
    readFileSync("schema.graphql", {
      encoding: "utf-8",
    })
  );

  const plugins = [
    // Calculate and set cache hints based on @cacheControl directives
    ApolloServerPluginCacheControl({ defaultMaxAge: 0 }),
    // Enable federated tracing (sends trace data to the router)
    ApolloServerPluginInlineTrace(),
  ];

  // Enable usage reporting to Apollo Studio when APOLLO_KEY is set
  if (process.env.APOLLO_KEY) {
    plugins.push(ApolloServerPluginUsageReporting());
  }

  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    plugins,
  });

  const { url } = await startStandaloneServer(server, {
    context,
    listen: { port: Number.parseInt(port) },
  });

  console.log(`🚀  Subgraph ${subgraphName} ready at ${url}`);
  console.log(`Run rover dev --url ${url} --name ${subgraphName}`);
}

main();
