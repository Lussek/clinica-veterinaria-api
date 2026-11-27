import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { TestDataTracker, uniqueEmail } from "./helpers/db.js";

const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

describe("Integração — /owners", () => {
    const tracker = new TestDataTracker();
    const email = uniqueEmail("tutor");
    let ownerId = "";

    afterAll(() => tracker.cleanup());

    it("POST /owners cria um tutor (201)", async () => {
        const res = await request(app)
            .post("/owners")
            .send({ name: "Tutor Integração", email: email.toUpperCase(), phone: "(41) 90000-0000" });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ name: "Tutor Integração", email, active: true });
        expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);

        ownerId = res.body.id;
        tracker.owners.push(ownerId);
    });

    it("POST /owners rejeita dados inválidos (400)", async () => {
        const res = await request(app).post("/owners").send({ name: "", email: "x" });

        expect(res.status).toBe(400);
        expect(res.body.errors).toContain("name é obrigatório.");
    });

    it("POST /owners não aceita e-mail duplicado (409)", async () => {
        const res = await request(app).post("/owners").send({ name: "Outro", email });

        expect(res.status).toBe(409);
    });

    it("GET /owners lista os tutores incluindo o criado (200)", async () => {
        const res = await request(app).get("/owners");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.map((o: { id: string }) => o.id)).toContain(ownerId);
    });

    it("GET /owners/:id retorna o tutor (200)", async () => {
        const res = await request(app).get(`/owners/${ownerId}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: ownerId, email });
    });

    it("GET /owners/:id responde 400 para ID inválido e 404 para inexistente", async () => {
        expect((await request(app).get("/owners/abc")).status).toBe(400);
        expect((await request(app).get(`/owners/${UNKNOWN_ID}`)).status).toBe(404);
    });

    it("GET /owners/search/:keyword encontra pelo e-mail (200)", async () => {
        const res = await request(app).get(`/owners/search/${encodeURIComponent(email.split("@")[0]!)}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(ownerId);
    });

    it("PUT /owners/:id atualiza o tutor (200)", async () => {
        const res = await request(app)
            .put(`/owners/${ownerId}`)
            .send({ name: "Tutor Atualizado", email, phone: null, active: false });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: ownerId, name: "Tutor Atualizado", phone: null, active: false });
    });

    it("PUT /owners/:id responde 404 para tutor inexistente", async () => {
        const res = await request(app)
            .put(`/owners/${UNKNOWN_ID}`)
            .send({ name: "Ninguém", email: uniqueEmail("ninguem") });

        expect(res.status).toBe(404);
    });

    it("DELETE /owners/:id remove o tutor (200) e ele deixa de existir (404)", async () => {
        const res = await request(app).delete(`/owners/${ownerId}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Tutor removido com sucesso.");
        expect((await request(app).get(`/owners/${ownerId}`)).status).toBe(404);
    });

    it("DELETE /owners/:id responde 404 para tutor inexistente", async () => {
        expect((await request(app).delete(`/owners/${UNKNOWN_ID}`)).status).toBe(404);
    });
});
