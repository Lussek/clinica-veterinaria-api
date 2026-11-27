// Carrega as credenciais antes de importar a aplicação.
// Usa .env.test (banco exclusivo de testes) se existir; senão, o .env.
// Em CI as variáveis já vêm do ambiente e nenhum arquivo é necessário.
for (const file of [".env.test", ".env"]) {
    try {
        process.loadEnvFile(file);
        break;
    } catch {
        // arquivo inexistente: tenta o próximo
    }
}
