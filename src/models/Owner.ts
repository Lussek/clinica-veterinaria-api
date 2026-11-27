import { Entity } from "./Entity.js";

export interface OwnerProps {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
    created_at: string;
}

/** Dados aceitos na criação/atualização de um tutor. */
export type OwnerInput = Omit<OwnerProps, "id" | "created_at">;

/** Tutor (dono) responsável por um ou mais pets. */
export class Owner extends Entity<OwnerProps> {
    get name(): string {
        return this.props.name;
    }

    get email(): string {
        return this.props.email;
    }

    get active(): boolean {
        return this.props.active;
    }

    /** Regra: somente tutores ativos podem ter novos pets vinculados. */
    canReceivePets(): boolean {
        return this.props.active;
    }
}
