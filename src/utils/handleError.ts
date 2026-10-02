import type { Response } from "express";

// Converte erros do Supabase/PostgreSQL em respostas HTTP adequadas.
export function handleError(
    res: Response,
    error: unknown,
    action: string,
    conflictMessage = "Operação não permitida: existem registros relacionados.",
): void {
    const code = (error as { code?: string } | null)?.code;

    if (code === "22P02") {
        res.status(400).json({ message: "Identificador ou valor em formato inválido." });
        return;
    }

    if (code === "23503") {
        res.status(409).json({ message: conflictMessage });
        return;
    }

    if (code === "23505") {
        res.status(409).json({ message: "Já existe um registro com esses dados." });
        return;
    }

    console.error(`Erro ao ${action}: `, error);

    res.status(500).json({ message: `Erro ao ${action}.` });
}
