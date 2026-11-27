import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { RUN_ID, TestDataTracker, futureDate, uniqueEmail } from "./helpers/db.js";

const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

describe("Integração — /appointments", () => {
    const tracker = new TestDataTracker();
    const veterinarian = `Dra. Teste ${RUN_ID}`;
    const scheduledAt = futureDate(20);
    let petId = "";
    let otherPetId = "";
    let appointmentId = "";

    const body = (overrides: Record<string, unknown> = {}) => ({
        pet_id: petId,
        scheduled_at: scheduledAt,
        veterinarian,
        reason: "Vacinação anual",
        price: 150,
        ...overrides,
    });

    beforeAll(async () => {
        const owner = await request(app).post("/owners").send({ name: "Tutor Consultas", email: uniqueEmail("consultas") });
        tracker.owners.push(owner.body.id);

        const pet = await request(app).post("/pets").send({ owner_id: owner.body.id, name: "Luna", species: "Gato" });
        const other = await request(app).post("/pets").send({ owner_id: owner.body.id, name: "Bob", species: "Cachorro" });
        petId = pet.body.id;
        otherPetId = other.body.id;
        tracker.pets.push(petId, otherPetId);
    });

    afterAll(() => tracker.cleanup());

    it("POST /appointments agenda uma consulta (201)", async () => {
        const res = await request(app).post("/appointments").send(body({ notes: "Primeira visita" }));

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            pet_id: petId,
            veterinarian,
            status: "agendada",
            price: 150,
            notes: "Primeira visita",
            pet: { id: petId, name: "Luna" },
        });
        expect(new Date(res.body.scheduled_at).toISOString()).toBe(scheduledAt);

        appointmentId = res.body.id;
        tracker.appointments.push(appointmentId);
    });

    it("POST /appointments rejeita dados inválidos (400)", async () => {
        const res = await request(app).post("/appointments").send({ pet_id: petId, scheduled_at: "amanhã" });

        expect(res.status).toBe(400);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("POST /appointments não aceita valor negativo nem data passada (422)", async () => {
        const negative = await request(app).post("/appointments").send(body({ price: -1, scheduled_at: futureDate(21) }));
        const past = await request(app).post("/appointments").send(body({ scheduled_at: "2020-01-01T10:00:00Z" }));

        expect(negative.status).toBe(422);
        expect(past.status).toBe(422);
    });

    it("POST /appointments impede o mesmo veterinário no mesmo horário (409)", async () => {
        const res = await request(app).post("/appointments").send(body({ pet_id: otherPetId }));

        expect(res.status).toBe(409);
        expect(res.body.message).toContain("veterinário");
    });

    it("POST /appointments responde 404 para pet inexistente", async () => {
        const res = await request(app).post("/appointments").send(body({ pet_id: UNKNOWN_ID }));

        expect(res.status).toBe(404);
    });

    it("GET /appointments lista (200) e filtra por pet e status", async () => {
        const all = await request(app).get("/appointments");
        const filtered = await request(app).get(`/appointments?pet_id=${petId}&status=agendada`);

        expect(all.status).toBe(200);
        expect(all.body.map((a: { id: string }) => a.id)).toContain(appointmentId);
        expect(filtered.status).toBe(200);
        expect(filtered.body).toHaveLength(1);
    });

    it("GET /appointments com status inválido responde 400", async () => {
        expect((await request(app).get("/appointments?status=pendente")).status).toBe(400);
    });

    it("GET /appointments/:id retorna a consulta (200) ou 404", async () => {
        const found = await request(app).get(`/appointments/${appointmentId}`);

        expect(found.status).toBe(200);
        expect(found.body.id).toBe(appointmentId);
        expect((await request(app).get(`/appointments/${UNKNOWN_ID}`)).status).toBe(404);
    });

    it("DELETE /pets/:id não remove pet com consultas (409)", async () => {
        expect((await request(app).delete(`/pets/${petId}`)).status).toBe(409);
    });

    it("PUT /appointments/:id reagenda a consulta (200)", async () => {
        const newDate = futureDate(22, 15);
        const res = await request(app).put(`/appointments/${appointmentId}`).send(body({ scheduled_at: newDate, price: 180 }));

        expect(res.status).toBe(200);
        expect(res.body.price).toBe(180);
        expect(new Date(res.body.scheduled_at).toISOString()).toBe(newDate);
    });

    it("PUT /appointments/:id conclui a consulta e depois não permite mais alterar (422)", async () => {
        const done = await request(app)
            .put(`/appointments/${appointmentId}`)
            .send(body({ scheduled_at: futureDate(22, 15), status: "concluida", notes: "Vacina aplicada" }));

        expect(done.status).toBe(200);
        expect(done.body.status).toBe("concluida");

        const again = await request(app).put(`/appointments/${appointmentId}`).send(body({ scheduled_at: futureDate(23) }));
        expect(again.status).toBe(422);
    });

    it("DELETE /appointments/:id não remove consulta concluída (409)", async () => {
        expect((await request(app).delete(`/appointments/${appointmentId}`)).status).toBe(409);
    });

    it("DELETE /appointments/:id remove consulta agendada (200) e ela deixa de existir (404)", async () => {
        const created = await request(app)
            .post("/appointments")
            .send(body({ pet_id: otherPetId, scheduled_at: futureDate(25) }));
        expect(created.status).toBe(201);
        tracker.appointments.push(created.body.id);

        const res = await request(app).delete(`/appointments/${created.body.id}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Consulta removida com sucesso.");
        expect((await request(app).get(`/appointments/${created.body.id}`)).status).toBe(404);
    });
});
