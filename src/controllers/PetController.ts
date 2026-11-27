import type { Request, Response } from "express";
import type { PetService } from "../services/PetService.js";

/** Recebe as requisições HTTP de pets e delega as regras ao PetService. */
export class PetController {
    constructor(private readonly service: PetService) {}

    // Filtro opcional: GET /pets?owner_id=<uuid>
    getAll = async (req: Request, res: Response): Promise<void> => {
        res.status(200).json(await this.service.findAll(req.query.owner_id));
    };

    getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        res.status(200).json(await this.service.findById(req.params.id));
    };

    create = async (req: Request, res: Response): Promise<void> => {
        res.status(201).json(await this.service.create(req.body));
    };

    update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        res.status(200).json(await this.service.update(req.params.id, req.body));
    };

    delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        await this.service.delete(req.params.id);
        res.status(200).json({ message: "Pet removido com sucesso." });
    };
}
