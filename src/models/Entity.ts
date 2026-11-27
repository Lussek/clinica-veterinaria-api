/**
 * Classe base das entidades do domínio.
 * Os dados ficam encapsulados (protegidos e imutáveis) e são expostos
 * apenas por getters e pelo método toJSON, usado ao responder a API.
 */
export abstract class Entity<TProps extends { id: string }> {
    protected readonly props: Readonly<TProps>;

    constructor(props: TProps) {
        this.props = Object.freeze({ ...props });
    }

    get id(): string {
        return this.props.id;
    }

    toJSON(): TProps {
        return { ...this.props };
    }
}
