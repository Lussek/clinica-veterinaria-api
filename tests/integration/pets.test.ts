import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { TestDataTracker, futureDate, uniqueEmail } from "./helpers/db.js";

const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

describe("Integração — /pets", () => {
    const tracker = new TestDataTracker();
    let ownerId = "";
    let inactiveOwnerId = "";
    let petId = "";

    beforeAll(async () => {
        const owner = await request(app).post("/owners").send({ name: "Tutor dos Pets", email: uniqueEmail("pets") });
        const inactive = await request(app)
            .post("/owners")
            .send({ name: "Tutor Inativo", email: uniqueEmail("inativo"), active: false });

        ownerId = owner.body.id;
        inactiveOwnerId = inactive.body.id;
        tracker.owners.push(ownerId, inactiveOwnerId);
    });

    afterAll(() => tracker.cleanup());

    it("POST /pets cria um pet vinculado ao tutor (201)", async () => {
        const res = await request(app).post("/pets").send({
            owner_id: ownerId,
            name: "Thor",
            species: "Cachorro",
            breed: "Golden Retriever",
            birth_date: "2021-05-14",
        });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            owner_id: ownerId,
            name: "Thor",
            birth_date: "2021-05-14",
            active: true,
            owner: { id: ownerId, name: "Tutor dos Pets" },
        });

        petId = res.body.id;
        tracker.pets.push(petId);
    });

    it("POST /pets rejeita campos obrigatórios ausentes (400)", async () => {
        const res = await request(app).post("/pets").send({ name: "Sem tutor" });

        expect(res.status).toBe(400);
        expect(res.body.errors).toContain("species é obrigatório.");
    });

    it("POST /pets responde 404 quando o tutor não existe", async () => {
        const res = await request(app).post("/pets").send({ owner_id: UNKNOWN_ID, name: "X", species: "Gato" });

        expect(res.status).toBe(404);
    });

    it("POST /pets não vincula pet a tutor inativo (422)", async () => {
        const res = await request(app).post("/pets").send({ owner_id: inactiveOwnerId, name: "X", species: "Gato" });

        expect(res.status).toBe(422);
    });

    it("POST /pets não aceita data de nascimento futura (422)", async () => {
        const res = await request(app)
            .post("/pets")
            .send({ owner_id: ownerId, name: "X", species: "Gato", birth_date: futureDate(30).slice(0, 10) });

        expect(res.status).toBe(422);
    });

    it("GET /pets lista os pets (200) e filtra por owner_id", async () => {
        const all = await request(app).get("/pets");
        const filtered = await request(app).get(`/pets?owner_id=${ownerId}`);

        expect(all.status).toBe(200);
        expect(all.body.map((p: { id: string }) => p.id)).toContain(petId);
        expect(filtered.status).toBe(200);
        expect(filtered.body).toHaveLength(1);
        expect(filtered.body[0].id).toBe(petId);
    });

    it("GET /pets?owner_id inválido responde 400", async () => {
        expect((await request(app).get("/pets?owner_id=123")).status).toBe(400);
    });

    it("GET /pets/:id retorna o pet com o tutor (200)", async () => {
        const res = await request(app).get(`/pets/${petId}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: petId, owner: { id: ownerId } });
    });

    it("GET /pets/:id responde 404 para pet inexistente", async () => {
        expect((await request(app).get(`/pets/${UNKNOWN_ID}`)).status).toBe(404);
    });

    it("DELETE /owners/:id não remove tutor com pets (409)", async () => {
        const res = await request(app).delete(`/owners/${ownerId}`);

        expect(res.status).toBe(409);
        expect(res.body.message).toContain("pet(s) vinculado(s)");
    });

    it("PUT /pets/:id atualiza o pet (200)", async () => {
        const res = await request(app).put(`/pets/${petId}`).send({
            owner_id: ownerId,
            name: "Thor Atualizado",
            species: "Cachorro",
            breed: null,
            birth_date: null,
            active: false,
        });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: petId, name: "Thor Atualizado", breed: null, active: false });
    });

    it("PUT /pets/:id responde 404 para pet inexistente", async () => {
        const res = await request(app)
            .put(`/pets/${UNKNOWN_ID}`)
            .send({ owner_id: ownerId, name: "X", species: "Gato" });

        expect(res.status).toBe(404);
    });

    it("DELETE /pets/:id remove o pet (200) e ele deixa de existir (404)", async () => {
        const res = await request(app).delete(`/pets/${petId}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Pet removido com sucesso.");
        expect((await request(app).get(`/pets/${petId}`)).status).toBe(404);
    });
});
