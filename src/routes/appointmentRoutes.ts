import { Router } from "express";
import type { AppointmentController } from "../controllers/AppointmentController.js";

export function appointmentRoutes(controller: AppointmentController): Router {
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/:id", controller.getById);
    router.post("/", controller.create);
    router.put("/:id", controller.update);
    router.delete("/:id", controller.delete);

    return router;
}
