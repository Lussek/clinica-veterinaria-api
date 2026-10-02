import type { Request, Response } from "express";
import Pet from "../models/Pet.js";
import Owner from "../models/Owner.js";
import { isUuid, validatePet } from "../utils/validation.js";
import { handleError } from "../utils/handleError.js";

async function getAll(req: Request, res: Response) {
    const { owner_id } = req.query;

    // Filtro opcional: GET /pets?owner_id=<uuid>
    if (owner_id !== undefined && !isUuid(owner_id)) {
        res.status(400).json({
            message: "owner_id inválido."
        });
        return;
    }

    try {
        const pets = await Pet.findAll(owner_id);

        res.status(200).json(pets);
    } catch (error) {
        handleError(res, error, "buscar pets");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!isUuid(id)) {
        res.status(400).json({
            message: "ID do pet inválido."
        });
        return;
    }

    try {
        const pet = await Pet.findById(id);

        if (!pet) {
            res.status(404).json({
                message: "Pet não encontrado.",
            });
            return;
        }

        res.status(200).json(pet);
    } catch (error) {
        handleError(res, error, "buscar pet");
    }
}

async function create(req: Request, res: Response) {
    const validation = validatePet(req.body);

    if (!validation.ok) {
        res.status(400).json({
            message: "Dados inválidos.",
            errors: validation.errors,
        });
        return;
    }

    try {
        // Garante que o tutor informado existe (chave estrangeira)
        const owner = await Owner.findById(validation.data.owner_id);

        if (!owner) {
            res.status(400).json({
                message: "O tutor informado em owner_id não existe.",
            });
            return;
        }

        const pet = await Pet.create(validation.data);

        res.status(201).json(pet);
    } catch (error) {
        handleError(res, error, "criar pet");
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!isUuid(id)) {
        res.status(400).json({
            message: "ID do pet inválido."
        });
        return;
    }

    const validation = validatePet(req.body);

    if (!validation.ok) {
        res.status(400).json({
            message: "Dados inválidos.",
            errors: validation.errors,
        });
        return;
    }

    try {
        const owner = await Owner.findById(validation.data.owner_id);

        if (!owner) {
            res.status(400).json({
                message: "O tutor informado em owner_id não existe.",
            });
            return;
        }

        const pet = await Pet.update(id, validation.data);

        if (!pet) {
            res.status(404).json({
                message: "Pet não encontrado.",
            });
            return;
        }

        res.status(200).json(pet);
    } catch (error) {
        handleError(res, error, "atualizar pet");
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!isUuid(id)) {
        res.status(400).json({
            message: "ID do pet inválido."
        });
        return;
    }

    try {
        const pet = await Pet.remove(id);

        if (!pet) {
            res.status(404).json({
                message: "Pet não encontrado.",
            });
            return;
        }

        res.status(200).json({
            message: "Pet removido com sucesso.",
        });
    } catch (error) {
        handleError(res, error, "remover pet");
    }
}

export default {
    getAll,
    getById,
    create,
    update,
    remove
}
