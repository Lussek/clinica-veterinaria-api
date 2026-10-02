import { Router } from "express";
import PetController from "../controllers/PetController.js";

const router = Router();

router.get("/", PetController.getAll);
router.get("/:id", PetController.getById);
router.post("/", PetController.create);
router.put("/:id", PetController.update);
router.delete("/:id", PetController.remove);

export default router;
