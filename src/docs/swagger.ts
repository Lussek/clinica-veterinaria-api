/**
 * Especificação OpenAPI 3.0 da API, servida em /api-docs (interface Swagger UI)
 * e em /api-docs.json (documento bruto).
 */

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const jsonContent = (schema: object, example?: unknown) => ({
    "application/json": example === undefined ? { schema } : { schema, example },
});

const idParam = (description: string) => ({
    name: "id",
    in: "path",
    required: true,
    description,
    schema: { type: "string", format: "uuid" },
});

const errorResponse = (description: string, example: object) => ({
    description,
    content: jsonContent(ref("Error"), example),
});

const commonErrors = {
    invalidId: errorResponse("ID em formato inválido", {
        message: "ID inválido.",
        errors: ["ID deve ser um UUID válido."],
    }),
    validation: errorResponse("Dados inválidos", {
        message: "Dados inválidos.",
        errors: ["name é obrigatório."],
    }),
    server: errorResponse("Erro interno", { message: "Erro interno do servidor." }),
};

const UUID_EXAMPLE = "3f1c2a7e-8b4d-4c1e-9f2a-1b2c3d4e5f60";
const OWNER_EXAMPLE = {
    name: "Maria Souza",
    email: "maria@email.com",
    phone: "(41) 99999-0000",
    active: true,
};
const PET_EXAMPLE = {
    owner_id: UUID_EXAMPLE,
    name: "Thor",
    species: "Cachorro",
    breed: "Golden Retriever",
    birth_date: "2021-05-14",
    active: true,
};
const APPOINTMENT_EXAMPLE = {
    pet_id: UUID_EXAMPLE,
    scheduled_at: "2026-12-10T14:30:00-03:00",
    veterinarian: "Dra. Ana Lima",
    reason: "Vacinação anual",
    price: 150,
    status: "agendada",
    notes: "Trazer carteira de vacinação",
};

export const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "API Clínica Veterinária",
        version: "2.0.0",
        description:
            "API REST para gerenciar **tutores**, **pets** e **consultas** de uma clínica veterinária. " +
            "Relacionamentos: Tutor 1:N Pet 1:N Consulta.",
    },
    servers: [{ url: "http://localhost:3000", description: "Ambiente local" }],
    tags: [
        { name: "Tutores", description: "Donos dos animais" },
        { name: "Pets", description: "Animais atendidos (pertencem a um tutor)" },
        { name: "Consultas", description: "Atendimentos agendados para um pet" },
    ],
    paths: {
        // ---------------- Tutores ----------------
        "/owners": {
            get: {
                tags: ["Tutores"],
                summary: "Lista todos os tutores",
                responses: {
                    200: { description: "Lista de tutores", content: jsonContent({ type: "array", items: ref("Owner") }) },
                    500: commonErrors.server,
                },
            },
            post: {
                tags: ["Tutores"],
                summary: "Cadastra um tutor",
                description: "O e-mail deve ser único.",
                requestBody: { required: true, content: jsonContent(ref("OwnerInput"), OWNER_EXAMPLE) },
                responses: {
                    201: { description: "Tutor criado", content: jsonContent(ref("Owner")) },
                    400: commonErrors.validation,
                    409: errorResponse("E-mail já cadastrado", { message: "Já existe um tutor cadastrado com este e-mail." }),
                },
            },
        },
        "/owners/search/{keyword}": {
            get: {
                tags: ["Tutores"],
                summary: "Pesquisa tutores por nome ou e-mail",
                parameters: [{
                    name: "keyword", in: "path", required: true,
                    description: "Trecho do nome ou do e-mail", schema: { type: "string" }, example: "maria",
                }],
                responses: {
                    200: { description: "Tutores encontrados", content: jsonContent({ type: "array", items: ref("Owner") }) },
                    400: errorResponse("Palavra-chave vazia", { message: "Palavra-chave não informada." }),
                },
            },
        },
        "/owners/{id}": {
            get: {
                tags: ["Tutores"],
                summary: "Consulta um tutor pelo ID",
                parameters: [idParam("ID do tutor")],
                responses: {
                    200: { description: "Tutor encontrado", content: jsonContent(ref("Owner")) },
                    400: commonErrors.invalidId,
                    404: errorResponse("Não encontrado", { message: "Tutor não encontrado." }),
                },
            },
            put: {
                tags: ["Tutores"],
                summary: "Atualiza um tutor (objeto completo)",
                parameters: [idParam("ID do tutor")],
                requestBody: { required: true, content: jsonContent(ref("OwnerInput"), { ...OWNER_EXAMPLE, phone: "(41) 98888-1111" }) },
                responses: {
                    200: { description: "Tutor atualizado", content: jsonContent(ref("Owner")) },
                    400: commonErrors.validation,
                    404: errorResponse("Não encontrado", { message: "Tutor não encontrado." }),
                    409: errorResponse("E-mail já usado por outro tutor", { message: "Já existe um tutor cadastrado com este e-mail." }),
                },
            },
            delete: {
                tags: ["Tutores"],
                summary: "Remove um tutor",
                description: "Só é permitido se o tutor não tiver pets vinculados.",
                parameters: [idParam("ID do tutor")],
                responses: {
                    200: { description: "Tutor removido", content: jsonContent(ref("Message"), { message: "Tutor removido com sucesso." }) },
                    400: commonErrors.invalidId,
                    404: errorResponse("Não encontrado", { message: "Tutor não encontrado." }),
                    409: errorResponse("Tutor com pets", { message: "Este tutor possui 2 pet(s) vinculado(s) e não pode ser removido." }),
                },
            },
        },

        // ---------------- Pets ----------------
        "/pets": {
            get: {
                tags: ["Pets"],
                summary: "Lista os pets (com o tutor de cada um)",
                parameters: [{
                    name: "owner_id", in: "query", required: false,
                    description: "Filtra os pets de um tutor", schema: { type: "string", format: "uuid" },
                }],
                responses: {
                    200: { description: "Lista de pets", content: jsonContent({ type: "array", items: ref("Pet") }) },
                    400: commonErrors.invalidId,
                },
            },
            post: {
                tags: ["Pets"],
                summary: "Cadastra um pet",
                description: "O tutor deve existir e estar ativo. A data de nascimento não pode ser futura.",
                requestBody: { required: true, content: jsonContent(ref("PetInput"), PET_EXAMPLE) },
                responses: {
                    201: { description: "Pet criado", content: jsonContent(ref("Pet")) },
                    400: commonErrors.validation,
                    404: errorResponse("Tutor inexistente", { message: "O tutor informado em owner_id não foi encontrado." }),
                    422: errorResponse("Regra de negócio violada", { message: "Não é possível vincular um pet a um tutor inativo." }),
                },
            },
        },
        "/pets/{id}": {
            get: {
                tags: ["Pets"],
                summary: "Consulta um pet pelo ID",
                parameters: [idParam("ID do pet")],
                responses: {
                    200: { description: "Pet encontrado", content: jsonContent(ref("Pet")) },
                    400: commonErrors.invalidId,
                    404: errorResponse("Não encontrado", { message: "Pet não encontrado." }),
                },
            },
            put: {
                tags: ["Pets"],
                summary: "Atualiza um pet (objeto completo)",
                parameters: [idParam("ID do pet")],
                requestBody: { required: true, content: jsonContent(ref("PetInput"), { ...PET_EXAMPLE, active: false }) },
                responses: {
                    200: { description: "Pet atualizado", content: jsonContent(ref("Pet")) },
                    400: commonErrors.validation,
                    404: errorResponse("Pet ou tutor não encontrado", { message: "Pet não encontrado." }),
                    422: errorResponse("Regra de negócio violada", { message: "A data de nascimento do pet não pode ser futura." }),
                },
            },
            delete: {
                tags: ["Pets"],
                summary: "Remove um pet",
                description: "Só é permitido se o pet não tiver consultas registradas.",
                parameters: [idParam("ID do pet")],
                responses: {
                    200: { description: "Pet removido", content: jsonContent(ref("Message"), { message: "Pet removido com sucesso." }) },
                    400: commonErrors.invalidId,
                    404: errorResponse("Não encontrado", { message: "Pet não encontrado." }),
                    409: errorResponse("Pet com consultas", {
                        message: "Este pet possui consultas registradas e não pode ser removido. Inative o cadastro (active: false).",
                    }),
                },
            },
        },

        // ---------------- Consultas ----------------
        "/appointments": {
            get: {
                tags: ["Consultas"],
                summary: "Lista as consultas (com o pet de cada uma)",
                parameters: [
                    {
                        name: "pet_id", in: "query", required: false,
                        description: "Filtra as consultas de um pet", schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "status", in: "query", required: false,
                        description: "Filtra pelo status", schema: { type: "string", enum: ["agendada", "concluida", "cancelada"] },
                    },
                ],
                responses: {
                    200: { description: "Lista de consultas", content: jsonContent({ type: "array", items: ref("Appointment") }) },
                    400: errorResponse("Filtro inválido", { message: "Filtro inválido.", errors: ["status deve ser um destes valores: agendada, concluida, cancelada."] }),
                },
            },
            post: {
                tags: ["Consultas"],
                summary: "Agenda uma consulta",
                description:
                    'O pet deve existir e estar ativo; a data deve ser futura; o status inicial é sempre "agendada"; ' +
                    "o valor não pode ser negativo; o pet e o veterinário não podem ter outra consulta no mesmo horário.",
                requestBody: { required: true, content: jsonContent(ref("AppointmentInput"), APPOINTMENT_EXAMPLE) },
                responses: {
                    201: { description: "Consulta agendada", content: jsonContent(ref("Appointment")) },
                    400: commonErrors.validation,
                    404: errorResponse("Pet inexistente", { message: "O pet informado em pet_id não foi encontrado." }),
                    409: errorResponse("Horário ocupado", { message: "Este veterinário já possui uma consulta agendada neste horário." }),
                    422: errorResponse("Regra de negócio violada", { message: "A consulta deve ser agendada para uma data futura." }),
                },
            },
        },
        "/appointments/{id}": {
            get: {
                tags: ["Consultas"],
                summary: "Consulta um atendimento pelo ID",
                parameters: [idParam("ID da consulta")],
                responses: {
                    200: { description: "Consulta encontrada", content: jsonContent(ref("Appointment")) },
                    400: commonErrors.invalidId,
                    404: errorResponse("Não encontrada", { message: "Consulta não encontrada." }),
                },
            },
            put: {
                tags: ["Consultas"],
                summary: "Atualiza / reagenda / conclui / cancela uma consulta",
                description: "Consultas já concluídas ou canceladas não podem ser alteradas.",
                parameters: [idParam("ID da consulta")],
                requestBody: {
                    required: true,
                    content: jsonContent(ref("AppointmentInput"), { ...APPOINTMENT_EXAMPLE, status: "concluida", notes: "Vacina V10 aplicada" }),
                },
                responses: {
                    200: { description: "Consulta atualizada", content: jsonContent(ref("Appointment")) },
                    400: commonErrors.validation,
                    404: errorResponse("Consulta ou pet não encontrado", { message: "Consulta não encontrada." }),
                    409: errorResponse("Horário ocupado", { message: "Este pet já possui uma consulta agendada neste horário." }),
                    422: errorResponse("Consulta encerrada", { message: "Esta consulta já está concluida e não pode mais ser alterada." }),
                },
            },
            delete: {
                tags: ["Consultas"],
                summary: "Remove uma consulta",
                description: "Consultas concluídas fazem parte do histórico e não podem ser removidas.",
                parameters: [idParam("ID da consulta")],
                responses: {
                    200: { description: "Consulta removida", content: jsonContent(ref("Message"), { message: "Consulta removida com sucesso." }) },
                    400: commonErrors.invalidId,
                    404: errorResponse("Não encontrada", { message: "Consulta não encontrada." }),
                    409: errorResponse("Consulta concluída", {
                        message: "Consultas concluídas fazem parte do histórico do pet e não podem ser removidas.",
                    }),
                },
            },
        },
    },
    components: {
        schemas: {
            OwnerInput: {
                type: "object",
                required: ["name", "email"],
                properties: {
                    name: { type: "string", maxLength: 120, example: "Maria Souza" },
                    email: { type: "string", format: "email", example: "maria@email.com" },
                    phone: { type: "string", nullable: true, example: "(41) 99999-0000" },
                    active: { type: "boolean", default: true },
                },
            },
            Owner: {
                allOf: [
                    { type: "object", properties: { id: { type: "string", format: "uuid" } } },
                    ref("OwnerInput"),
                    { type: "object", properties: { created_at: { type: "string", format: "date-time" } } },
                ],
            },
            PetInput: {
                type: "object",
                required: ["owner_id", "name", "species"],
                properties: {
                    owner_id: { type: "string", format: "uuid" },
                    name: { type: "string", example: "Thor" },
                    species: { type: "string", example: "Cachorro" },
                    breed: { type: "string", nullable: true, example: "Golden Retriever" },
                    birth_date: { type: "string", format: "date", nullable: true, example: "2021-05-14" },
                    active: { type: "boolean", default: true },
                },
            },
            Pet: {
                allOf: [
                    { type: "object", properties: { id: { type: "string", format: "uuid" } } },
                    ref("PetInput"),
                    {
                        type: "object",
                        properties: {
                            created_at: { type: "string", format: "date-time" },
                            owner: {
                                type: "object",
                                properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } },
                            },
                        },
                    },
                ],
            },
            AppointmentInput: {
                type: "object",
                required: ["pet_id", "scheduled_at", "veterinarian", "reason"],
                properties: {
                    pet_id: { type: "string", format: "uuid" },
                    scheduled_at: { type: "string", format: "date-time", example: "2026-12-10T14:30:00-03:00" },
                    veterinarian: { type: "string", example: "Dra. Ana Lima" },
                    reason: { type: "string", example: "Vacinação anual" },
                    price: { type: "number", minimum: 0, default: 0, example: 150 },
                    status: { type: "string", enum: ["agendada", "concluida", "cancelada"], default: "agendada" },
                    notes: { type: "string", nullable: true },
                },
            },
            Appointment: {
                allOf: [
                    { type: "object", properties: { id: { type: "string", format: "uuid" } } },
                    ref("AppointmentInput"),
                    {
                        type: "object",
                        properties: {
                            created_at: { type: "string", format: "date-time" },
                            pet: {
                                type: "object",
                                properties: {
                                    id: { type: "string", format: "uuid" },
                                    name: { type: "string" },
                                    species: { type: "string" },
                                },
                            },
                        },
                    },
                ],
            },
            Message: {
                type: "object",
                properties: { message: { type: "string" } },
            },
            Error: {
                type: "object",
                properties: {
                    message: { type: "string" },
                    errors: { type: "array", items: { type: "string" } },
                },
            },
        },
    },
};
