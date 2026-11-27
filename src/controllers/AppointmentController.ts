import type { Request, Response } from "express";
import type { AppointmentService } from "../services/AppointmentService.js";

/** Recebe as requisições HTTP de consultas e delega as regras ao AppointmentService. */
export class AppointmentController {
    constructor(private readonly service: AppointmentService) {}

    // Filtros opcionais: GET /appointments?pet_id=<uuid>&status=agendada
    getAll = async (req: Request, res: Response): Promise<void> => {
        res.status(200).json(await this.service.findAll(req.query.pet_id, req.query.status));
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
        res.status(200).json({ message: "Consulta removida com sucesso." });
    };
}
