import supabase from "../../../src/config/supabase.js";

/** Sufixo único por execução, para não colidir com dados existentes. */
export const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function uniqueEmail(label: string): string {
    return `${label}.${RUN_ID}@integracao.test`;
}

/** Data futura (dias a partir de agora) em ISO, arredondada ao minuto. */
export function futureDate(days: number, hour = 14): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    date.setUTCHours(hour, 0, 0, 0);
    return date.toISOString();
}

/**
 * Guarda os IDs criados durante os testes e remove tudo no final,
 * diretamente no banco (respeitando a ordem das chaves estrangeiras).
 * Assim os testes podem ser executados quantas vezes for preciso.
 */
export class TestDataTracker {
    readonly owners: string[] = [];
    readonly pets: string[] = [];
    readonly appointments: string[] = [];

    async cleanup(): Promise<void> {
        if (this.appointments.length) {
            await supabase.from("appointments").delete().in("id", this.appointments);
        }
        if (this.pets.length) {
            await supabase.from("pets").delete().in("id", this.pets);
        }
        if (this.owners.length) {
            await supabase.from("owners").delete().in("id", this.owners);
        }
    }
}
