import express from "express";
import type { NextFunction, Request, Response } from "express";
import ownerRoutes from "./routes/ownerRoutes.js";
import petRoutes from "./routes/petRoutes.js";

const app = express();
app.use(express.json());

// =================
// Root
// =================
app.get("/", (req, res) => {
    res.status(200).json({
        message: "API Clínica Veterinária",
        version: "1.0.0"
    });
});

// =================
// Owners (Tutores)
// =================
app.use("/owners", ownerRoutes);

// =================
// Pets
// =================
app.use("/pets", petRoutes);

// =================
// Rota não encontrada
// =================
app.use((req, res) => {
    res.status(404).json({
        message: "Rota não encontrada.",
    });
});

// =================
// Tratamento global de erros (ex.: JSON malformado)
// =================
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if ((err as { type?: string } | null)?.type === "entity.parse.failed") {
        res.status(400).json({
            message: "JSON inválido no corpo da requisição.",
        });
        return;
    }

    console.error("Erro inesperado: ", err);

    res.status(500).json({
        message: "Erro interno do servidor.",
    });
});

export default app;
