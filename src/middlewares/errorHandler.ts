import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

/** 404 para qualquer rota não registrada. */
export function notFoundHandler(_req: Request, res: Response): void {
    res.status(404).json({ message: "Rota não encontrada." });
}

/**
 * Tratamento centralizado de erros. Converte:
 * - AppError (lançados pelos services) no status que carregam;
 * - JSON malformado no corpo em 400;
 * - erros do PostgreSQL (repassados pelo Supabase) em 400/409;
 * - qualquer outro erro em 500, sem expor detalhes internos.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            message: err.message,
            ...(err.details ? { errors: err.details } : {}),
        });
        return;
    }

    const { type, code } = (err ?? {}) as { type?: string; code?: string };

    if (type === "entity.parse.failed") {
        res.status(400).json({ message: "JSON inválido no corpo da requisição." });
        return;
    }

    // Códigos de erro do PostgreSQL
    if (code === "22P02") {
        res.status(400).json({ message: "Identificador ou valor em formato inválido." });
        return;
    }

    if (code === "23503") {
        res.status(409).json({ message: "Operação não permitida: existem registros relacionados." });
        return;
    }

    if (code === "23505") {
        res.status(409).json({ message: "Já existe um registro com esses dados." });
        return;
    }

    console.error("Erro inesperado:", err);
    res.status(500).json({ message: "Erro interno do servidor." });
}
