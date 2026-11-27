import express from "express";
import swaggerUi from "swagger-ui-express";
import { controllers } from "./container.js";
import { swaggerSpec } from "./docs/swagger.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { appointmentRoutes } from "./routes/appointmentRoutes.js";
import { ownerRoutes } from "./routes/ownerRoutes.js";
import { petRoutes } from "./routes/petRoutes.js";

const app = express();
app.use(express.json());

// =================
// Root
// =================
app.get("/", (_req, res) => {
    res.status(200).json({
        message: "API Clínica Veterinária",
        version: "2.0.0",
        docs: "/api-docs",
    });
});

// =================
// Documentação (Swagger/OpenAPI)
// =================
app.get("/api-docs.json", (_req, res) => {
    res.status(200).json(swaggerSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =================
// Recursos
// =================
app.use("/owners", ownerRoutes(controllers.owner));
app.use("/pets", petRoutes(controllers.pet));
app.use("/appointments", appointmentRoutes(controllers.appointment));

// =================
// Rota não encontrada e tratamento global de erros
// =================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
