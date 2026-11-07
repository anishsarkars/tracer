import { createConfig, http } from "wagmi";
import { injected } from "@wagmi/core";
import { base, baseSepolia, chains, tracerFork } from "@/config/chains";
import { env } from "@/config/env";

const rpcFor = (id: number): string | undefined => (env.chainId === id ? env.rpcUrl : undefined);

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [tracerFork.id]: http(rpcFor(tracerFork.id) ?? "http://127.0.0.1:8545"),
    [baseSepolia.id]: http(rpcFor(baseSepolia.id)),
    [base.id]: http(rpcFor(base.id)),
  },
  ssr: true,
  multiInjectedProviderDiscovery: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
