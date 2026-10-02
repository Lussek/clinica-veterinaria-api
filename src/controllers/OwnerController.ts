import type { Request, Response } from "express";
import Owner from "../models/Owner.js";
import { isUuid, sanitizeKeyword, validateOwner } from "../utils/validation.js";
import { handleError } from "../utils/handleError.js";

async function getAll(req: Request, res: Response) {
    try {
        const owners = await Owner.findAll();

        res.status(200).json(owners);
    } catch (error) {
        handleError(res, error, "buscar tutores");
    }
}

async function getByKeyword(req: Request<{ keyword: string }>, res: Response) {
    const keyword = sanitizeKeyword(req.params.keyword ?? "");

    if (!keyword) {
        res.status(400).json({
            message: "Palavra-chave não informada."
        });
        return;
    }

    try {
        const owners = await Owner.searchByKeyword(keyword);

        res.status(200).json(owners);
    } catch (error) {
        handleError(res, error, "pesquisar tutores");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!isUuid(id)) {
        res.status(400).json({
            message: "ID do tutor inválido."
        });
        return;
    }

    try {
        const owner = await Owner.findById(id);

        if (!owner) {
            res.status(404).json({
                message: "Tutor não encontrado.",
            });
            return;
        }

        res.status(200).json(owner);
    } catch (error) {
        handleError(res, error, "buscar tutor");
    }
}

async function create(req: Request, res: Response) {
    const validation = validateOwner(req.body);

    if (!validation.ok) {
        res.status(400).json({
            message: "Dados inválidos.",
            errors: validation.errors,
        });
        return;
    }

    try {
        const owner = await Owner.create(validation.data);

        res.status(201).json(owner);
    } catch (error) {
        handleError(res, error, "criar tutor");
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!isUuid(id)) {
        res.status(400).json({
            message: "ID do tutor inválido."
        });
        return;
    }

    const validation = validateOwner(req.body);

    if (!validation.ok) {
        res.status(400).json({
            message: "Dados inválidos.",
            errors: validation.errors,
        });
        return;
    }

    try {
        const owner = await Owner.update(id, validation.data);

        if (!owner) {
            res.status(404).json({
                message: "Tutor não encontrado.",
            });
            return;
        }

        res.status(200).json(owner);
    } catch (error) {
        handleError(res, error, "atualizar tutor");
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!isUuid(id)) {
        res.status(400).json({
            message: "ID do tutor inválido."
        });
        return;
    }

    try {
        const owner = await Owner.remove(id);

        if (!owner) {
            res.status(404).json({
                message: "Tutor não encontrado.",
            });
            return;
        }

        res.status(200).json({
            message: "Tutor removido com sucesso.",
        });
    } catch (error) {
        handleError(
            res,
            error,
            "remover tutor",
            "Este tutor possui pets vinculados e não pode ser removido.",
        );
    }
}

export default {
    getAll,
    getById,
    getByKeyword,
    create,
    update,
    remove
}
