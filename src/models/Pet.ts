import { Entity } from "./Entity.js";

export interface PetProps {
    id: string;
    owner_id: string;
    name: string;
    species: string;
    breed: string | null;
    birth_date: string | null;
    active: boolean;
    created_at: string;
    /** Tutor do pet, carregado pelo relacionamento (chave estrangeira). */
    owner?: { id: string; name: string } | null;
}

/** Dados aceitos na criação/atualização de um pet. */
export type PetInput = Omit<PetProps, "id" | "created_at" | "owner">;

/** Animal atendido pela clínica. Pertence a um único tutor. */
export class Pet extends Entity<PetProps> {
    get ownerId(): string {
        return this.props.owner_id;
    }

    get name(): string {
        return this.props.name;
    }

    get active(): boolean {
        return this.props.active;
    }

    /** Regra: somente pets ativos podem ter consultas agendadas. */
    canBeScheduled(): boolean {
        return this.props.active;
    }
}
