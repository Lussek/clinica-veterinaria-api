import { Router } from "express";
import type { OwnerController } from "../controllers/OwnerController.js";

export function ownerRoutes(controller: OwnerController): Router {
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/search/:keyword", controller.search);
    router.get("/:id", controller.getById);
    router.post("/", controller.create);
    router.put("/:id", controller.update);
    router.delete("/:id", controller.delete);

    return router;
}
