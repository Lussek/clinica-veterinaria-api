import type { Request, Response } from "express";
import type { OwnerService } from "../services/OwnerService.js";

/**
 * Recebe as requisições HTTP de tutores, delega ao service e devolve
 * o status adequado. Erros lançados chegam ao middleware errorHandler
 * (o Express 5 encaminha automaticamente erros de funções async).
 */
export class OwnerController {
    constructor(private readonly service: OwnerService) {}

    getAll = async (_req: Request, res: Response): Promise<void> => {
        res.status(200).json(await this.service.findAll());
    };

    search = async (req: Request<{ keyword: string }>, res: Response): Promise<void> => {
        res.status(200).json(await this.service.search(req.params.keyword));
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
        res.status(200).json({ message: "Tutor removido com sucesso." });
    };
}
