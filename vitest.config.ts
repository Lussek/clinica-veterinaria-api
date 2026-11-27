import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            // server.ts apenas inicia o servidor (app.listen); não há lógica a testar
            exclude: ["src/server.ts"],
            reporter: ["text", "html", "json-summary"],
            reportsDirectory: "coverage",
            thresholds: {
                lines: 60,
                statements: 60,
                functions: 60,
                branches: 60,
            },
        },
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    include: ["tests/unit/**/*.test.ts"],
                },
            },
            {
                extends: true,
                test: {
                    name: "integration",
                    include: ["tests/integration/**/*.test.ts"],
                    setupFiles: ["tests/integration/setup.ts"],
                    // Os testes usam o mesmo banco: rodar um arquivo por vez evita interferência
                    fileParallelism: false,
                    testTimeout: 20000,
                    hookTimeout: 30000,
                },
            },
        ],
    },
});
