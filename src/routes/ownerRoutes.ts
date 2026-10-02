import { Router } from "express";
import OwnerController from "../controllers/OwnerController.js";

const router = Router();

router.get("/", OwnerController.getAll);
router.get("/search/:keyword", OwnerController.getByKeyword);
router.get("/:id", OwnerController.getById);
router.post("/", OwnerController.create);
router.put("/:id", OwnerController.update);
router.delete("/:id", OwnerController.remove);

export default router;
