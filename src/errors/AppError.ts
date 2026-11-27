/**
 * Erro base da aplicação. Carrega o código HTTP que deve ser devolvido
 * ao cliente, permitindo que as camadas internas (services) sinalizem
 * falhas sem conhecer o Express.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly details: string[] | undefined;

    constructor(message: string, statusCode = 400, details?: string[]) {
        super(message);
        this.name = new.target.name;
        this.statusCode = statusCode;
        this.details = details;
    }
}

/** 400 — dados recebidos inválidos (formato, campos obrigatórios etc.). */
export class ValidationError extends AppError {
    constructor(details: string[], message = "Dados inválidos.") {
        super(message, 400, details);
    }
}

/** 404 — registro não encontrado. */
export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}

/** 409 — conflito com o estado atual dos dados (duplicidade, vínculos). */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}

/** 422 — dados válidos, mas a operação viola uma regra de negócio. */
export class BusinessRuleError extends AppError {
    constructor(message: string) {
        super(message, 422);
    }
}
