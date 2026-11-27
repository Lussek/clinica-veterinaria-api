import { Router } from "express";
import type { PetController } from "../controllers/PetController.js";

export function petRoutes(controller: PetController): Router {
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/:id", controller.getById);
    router.post("/", controller.create);
    router.put("/:id", controller.update);
    router.delete("/:id", controller.delete);

    return router;
}
