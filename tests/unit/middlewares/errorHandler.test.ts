import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BusinessRuleError, NotFoundError, ValidationError } from "../../../src/errors/AppError.js";
import { errorHandler, notFoundHandler } from "../../../src/middlewares/errorHandler.js";

function mockResponse() {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    return res;
}

function run(err: unknown) {
    const res = mockResponse();
    errorHandler(err, {} as Request, res as unknown as Response, vi.fn() as NextFunction);
    return res;
}

describe("errorHandler", () => {
    afterEach(() => vi.restoreAllMocks());

    it("usa o status e a mensagem dos AppError", () => {
        const res = run(new NotFoundError("Pet não encontrado."));

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Pet não encontrado." });
    });

    it("inclui a lista de erros de validação", () => {
        const res = run(new ValidationError(["name é obrigatório."]));

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Dados inválidos.", errors: ["name é obrigatório."] });
    });

    it("responde 422 para regra de negócio", () => {
        expect(run(new BusinessRuleError("x")).status).toHaveBeenCalledWith(422);
    });

    it("responde 400 para JSON malformado", () => {
        expect(run({ type: "entity.parse.failed" }).status).toHaveBeenCalledWith(400);
    });

    it.each([
        ["22P02", 400],
        ["23503", 409],
        ["23505", 409],
    ])("converte o erro %s do PostgreSQL em %i", (code, status) => {
        expect(run({ code }).status).toHaveBeenCalledWith(status);
    });

    it("responde 500 sem expor detalhes em erros inesperados", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        const res = run(new Error("falha secreta"));

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Erro interno do servidor." });
    });

    it("trata erro nulo como erro interno", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        expect(run(null).status).toHaveBeenCalledWith(500);
    });
});

describe("notFoundHandler", () => {
    it("responde 404 para rota inexistente", () => {
        const res = mockResponse();

        notFoundHandler({} as Request, res as unknown as Response);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
