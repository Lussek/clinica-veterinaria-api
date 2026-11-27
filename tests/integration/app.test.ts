import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

describe("Aplicação", () => {
    it("GET / responde com as informações da API", async () => {
        const res = await request(app).get("/");

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ message: "API Clínica Veterinária", docs: "/api-docs" });
    });

    it("GET /api-docs.json devolve a especificação OpenAPI com as três entidades", async () => {
        const res = await request(app).get("/api-docs.json");

        expect(res.status).toBe(200);
        expect(res.body.openapi).toMatch(/^3\./);
        expect(Object.keys(res.body.paths)).toEqual(
            expect.arrayContaining(["/owners", "/owners/{id}", "/pets", "/pets/{id}", "/appointments", "/appointments/{id}"]),
        );
    });

    it("GET /api-docs/ serve a interface do Swagger UI", async () => {
        const res = await request(app).get("/api-docs/");

        expect(res.status).toBe(200);
        expect(res.text).toContain("swagger-ui");
    });

    it("responde 404 para rota inexistente", async () => {
        const res = await request(app).get("/rota-que-nao-existe");

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Rota não encontrada.");
    });

    it("responde 400 para JSON malformado", async () => {
        const res = await request(app)
            .post("/owners")
            .set("Content-Type", "application/json")
            .send('{"name": "sem fechar"');

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("JSON inválido no corpo da requisição.");
    });
});
