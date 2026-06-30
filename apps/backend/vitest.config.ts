import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "__tests__/**/*.spec.ts"],
    setupFiles: ["./__tests__/setup.ts"],
    pool: "forks",
    fileParallelism: false,
  },
});
