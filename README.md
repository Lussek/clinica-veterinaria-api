# API Clínica Veterinária

## 1. Nome e descrição do projeto

**API Clínica Veterinária**: API REST para gerenciar os **tutores** (donos), os **pets** e as **consultas** de uma clínica veterinária.

- **Domínio:** clínica veterinária.
- **Problema:** clínicas pequenas costumam controlar cadastros e agendamentos em papel ou planilhas. Isso gera dados duplicados, horários marcados duas vezes e histórico de atendimento perdido.
- **Objetivo da API:** centralizar o cadastro de tutores e pets e a agenda de consultas, com CRUD completo, relacionamentos entre as entidades, regras de negócio (ex.: não agendar dois atendimentos no mesmo horário para o mesmo veterinário) e persistência no Supabase/PostgreSQL.

## 2. Integrantes da equipe

- Lucas Vaz da Silva
- Kaue Favoretto
- Waldir Gutierrez

## 3. Tecnologias utilizadas

| Tecnologia | Uso |
|---|---|
| Node.js (≥ 22) | Ambiente de execução |
| TypeScript | Tipagem estática |
| Express 5 | Servidor HTTP e rotas |
| Supabase (`@supabase/supabase-js`) / PostgreSQL | Persistência dos dados |
| Vitest | Testes unitários e de integração |
| Supertest | Requisições HTTP nos testes de integração |
| @vitest/coverage-v8 | Relatório de cobertura |
| Swagger UI / OpenAPI 3 (`swagger-ui-express`) | Documentação interativa |
| tsx | Execução do TypeScript em desenvolvimento |
| Git / GitHub / GitHub Actions | Versionamento e integração contínua |

## 4. Entidades e relacionamentos

```
owners (Tutor) 1 ──── N pets (Pet) 1 ──── N appointments (Consulta)
```

**Tutor (`owners`)**

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | Gerado pelo banco |
| `name` | varchar(120) | Nome do tutor (obrigatório) |
| `email` | varchar(160), único | E-mail (obrigatório, salvo em minúsculas) |
| `phone` | varchar(30) | Telefone (opcional) |
| `active` | boolean | Cadastro ativo (padrão `true`) |
| `created_at` | timestamptz | Data de criação |

**Pet (`pets`)**

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | Gerado pelo banco |
| `owner_id` | uuid (FK → `owners.id`) | Tutor do pet (obrigatório) |
| `name` | varchar(80) | Nome do pet (obrigatório) |
| `species` | varchar(40) | Espécie, ex.: Cachorro, Gato (obrigatório) |
| `breed` | varchar(80) | Raça (opcional) |
| `birth_date` | date | Nascimento `AAAA-MM-DD` (opcional) |
| `active` | boolean | Cadastro ativo (padrão `true`) |
| `created_at` | timestamptz | Data de criação |

**Consulta (`appointments`)**

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | Gerado pelo banco |
| `pet_id` | uuid (FK → `pets.id`) | Pet atendido (obrigatório) |
| `scheduled_at` | timestamptz | Data e hora em ISO 8601 (obrigatório) |
| `veterinarian` | varchar(120) | Veterinário responsável (obrigatório) |
| `reason` | varchar(255) | Motivo da consulta (obrigatório) |
| `status` | varchar(20) | `agendada` \| `concluida` \| `cancelada` (padrão `agendada`) |
| `price` | numeric(10,2) | Valor da consulta, ≥ 0 (padrão 0) |
| `notes` | text | Observações (opcional) |
| `created_at` | timestamptz | Data de criação |

**Relacionamentos**
- Um **tutor** possui vários **pets**, e cada pet pertence a um único tutor (1:N, `pets.owner_id`).
- Um **pet** possui várias **consultas**, e cada consulta é de um único pet (1:N, `appointments.pet_id`).
- As duas chaves estrangeiras usam `ON DELETE RESTRICT`: o banco não deixa apagar um registro que ainda tenha dependentes.
- As respostas de pets trazem o tutor (`owner: { id, name }`), e as de consultas trazem o pet (`pet: { id, name, species }`).

## 5. Regras de negócio

As regras ficam na camada **Service** (`src/services`) e são testadas nos testes unitários.

| # | Entidade | Regra | Resposta |
|---|---|---|---|
| 1 | Tutor | O e-mail é único (na criação e na atualização) | 409 |
| 2 | Tutor | Um tutor com pets vinculados não pode ser removido | 409 |
| 3 | Pet | O tutor informado em `owner_id` precisa existir | 404 |
| 4 | Pet | Não é possível cadastrar ou transferir um pet para um tutor **inativo** | 422 |
| 5 | Pet | A data de nascimento não pode ser futura | 422 |
| 6 | Pet | Um pet com consultas registradas não pode ser removido (deve ser inativado) | 409 |
| 7 | Consulta | O pet precisa existir e estar **ativo** para receber um agendamento | 404 / 422 |
| 8 | Consulta | Toda consulta nova começa com status `agendada` e em **data futura** | 422 |
| 9 | Consulta | O valor (`price`) não pode ser negativo | 422 |
| 10 | Consulta | O mesmo **pet** ou o mesmo **veterinário** não pode ter duas consultas agendadas no mesmo horário | 409 |
| 11 | Consulta | Consultas **concluídas ou canceladas** não podem mais ser alteradas | 422 |
| 12 | Consulta | Consultas **concluídas** fazem parte do histórico e não podem ser removidas | 409 |

Validações de formato (campos obrigatórios, UUID, e-mail, datas, tipos) devolvem **400**, com a lista de erros encontrados.

## 6. Estrutura do projeto

```
├── .github/workflows/ci.yml   # CI: build + testes no GitHub Actions
├── database/
│   ├── schema.sql             # criação das tabelas, FKs e restrições
│   └── seed.sql               # dados de exemplo (opcional)
├── src/
│   ├── config/                # conexão com o Supabase (lê variáveis de ambiente)
│   ├── controllers/           # recebem a requisição HTTP e devolvem status + JSON
│   ├── docs/                  # especificação OpenAPI (Swagger)
│   ├── errors/                # classes de erro (AppError, NotFoundError, ...)
│   ├── middlewares/           # tratamento centralizado de erros e 404
│   ├── models/                # entidades do domínio (classes Owner, Pet, Appointment)
│   ├── repositories/          # acesso a dados (interfaces + implementação Supabase)
│   ├── routes/                # definição dos endpoints de cada entidade
│   ├── services/              # regras de negócio
│   ├── validators/            # validação dos dados recebidos
│   ├── container.ts           # injeção de dependências (repo → service → controller)
│   ├── app.ts                 # configuração do Express, rotas e Swagger
│   └── server.ts              # inicialização do servidor
├── tests/
│   ├── unit/                  # testes unitários (services, models, middleware) com mocks
│   └── integration/           # testes de integração (Supertest + Supabase)
└── vitest.config.ts           # configuração dos testes e da cobertura
```

**Fluxo de uma requisição:** `Route → Controller → Service (validação + regras) → Repository → Supabase`.
Os erros lançados em qualquer camada chegam ao `errorHandler`, que os converte no status HTTP correto.

**Orientação a objetos aplicada**
- **Classes e herança:** `Owner`, `Pet` e `Appointment` estendem a classe abstrata `Entity`. Os erros estendem `AppError`.
- **Encapsulamento:** os dados das entidades são `protected readonly`, ficam congelados e são expostos por getters. As regras do próprio objeto viram métodos (`owner.canReceivePets()`, `pet.canBeScheduled()`, `appointment.isClosed()`, `appointment.conflictsWith()`).
- **Abstração e injeção de dependência:** os services dependem das interfaces `IOwnerRepository`, `IPetRepository` e `IAppointmentRepository`, recebidas pelo construtor. Isso permite trocar o Supabase por mocks nos testes.

## 7. Configuração e execução

Pré-requisitos: Node.js 22 ou superior e um projeto no [Supabase](https://supabase.com).

```bash
# 1. Clonar o repositório
git clone https://github.com/Lussek/clinica-veterinaria-api.git
cd clinica-veterinaria-api

# 2. Instalar as dependências
npm install

# 3. Configurar as variáveis de ambiente
cp .env.example .env        # no Windows: copy .env.example .env
#    preencha SUPABASE_URL e SUPABASE_SECRET_KEY

# 4. Preparar o banco: execute database/schema.sql no SQL Editor do Supabase

# 5. Iniciar em modo desenvolvimento
npm run dev
```

A API sobe em `http://localhost:3000` e a documentação fica em `http://localhost:3000/api-docs`.

Versão compilada: `npm run build` e depois `npm start`.

## 8. Variáveis de ambiente

O arquivo `.env` **não é versionado** (está no `.gitignore`). Use o [`.env.example`](.env.example) como modelo:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `SUPABASE_URL` | sim | URL do projeto (Project Settings → API) |
| `SUPABASE_SECRET_KEY` | sim | Secret key / service role (usada só no back-end, nunca no front-end) |
| `PORT` | não | Porta HTTP (padrão `3000`) |

## 9. Banco de dados

1. Crie um projeto no Supabase.
2. Abra o **SQL Editor** e execute [`database/schema.sql`](database/schema.sql). O script é idempotente e pode ser executado de novo sem perder dados.
3. (Opcional) Execute [`database/seed.sql`](database/seed.sql) para criar dados de exemplo.
4. Copie a URL e a secret key para o `.env`.

| Tabela | PK | FK | Restrições |
|---|---|---|---|
| `owners` | `id uuid` | — | `email` único |
| `pets` | `id uuid` | `owner_id → owners.id` (`ON DELETE RESTRICT`) | — |
| `appointments` | `id uuid` | `pet_id → pets.id` (`ON DELETE RESTRICT`) | `status` em (`agendada`, `concluida`, `cancelada`); `price ≥ 0` |

Todos os IDs são UUID gerados pelo banco (`gen_random_uuid()`). O RLS fica habilitado sem políticas públicas: só o back-end, com a secret key, acessa os dados.

## 10. Endpoints da API

### Tutores

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/owners` | Lista todos os tutores |
| GET | `/owners/:id` | Consulta um tutor |
| GET | `/owners/search/:keyword` | Pesquisa tutores por nome ou e-mail |
| POST | `/owners` | Cadastra um tutor |
| PUT | `/owners/:id` | Atualiza um tutor |
| DELETE | `/owners/:id` | Remove um tutor (se não tiver pets) |

### Pets

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/pets` | Lista todos os pets (com o tutor) |
| GET | `/pets?owner_id=<uuid>` | Lista os pets de um tutor |
| GET | `/pets/:id` | Consulta um pet |
| POST | `/pets` | Cadastra um pet |
| PUT | `/pets/:id` | Atualiza um pet |
| DELETE | `/pets/:id` | Remove um pet (se não tiver consultas) |

### Consultas

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/appointments` | Lista todas as consultas (com o pet) |
| GET | `/appointments?pet_id=<uuid>&status=agendada` | Filtra por pet e/ou status |
| GET | `/appointments/:id` | Consulta um atendimento |
| POST | `/appointments` | Agenda uma consulta |
| PUT | `/appointments/:id` | Atualiza, reagenda, conclui ou cancela uma consulta |
| DELETE | `/appointments/:id` | Remove uma consulta (exceto concluída) |

### Outros

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Informações da API |
| GET | `/api-docs` | Documentação Swagger UI |
| GET | `/api-docs.json` | Especificação OpenAPI em JSON |

### Códigos de resposta

| Código | Quando ocorre |
|---|---|
| 200 | Consulta, atualização ou remoção realizada |
| 201 | Registro criado |
| 400 | Dados inválidos, JSON malformado ou ID fora do formato UUID |
| 404 | Registro (ou registro relacionado) não encontrado, ou rota inexistente |
| 409 | Conflito: e-mail duplicado, registro com dependentes ou horário já ocupado |
| 422 | Regra de negócio violada (tutor/pet inativo, data passada, valor negativo, consulta encerrada) |
| 500 | Erro interno (sem expor detalhes) |

## 11. Exemplos de requisições

**POST `/owners`**
```json
{
  "name": "Maria Souza",
  "email": "maria@email.com",
  "phone": "(41) 99999-0000",
  "active": true
}
```

**POST `/pets`**
```json
{
  "owner_id": "uuid-do-tutor",
  "name": "Thor",
  "species": "Cachorro",
  "breed": "Golden Retriever",
  "birth_date": "2021-05-14"
}
```

**POST `/appointments`**
```json
{
  "pet_id": "uuid-do-pet",
  "scheduled_at": "2026-12-10T14:30:00-03:00",
  "veterinarian": "Dra. Ana Lima",
  "reason": "Vacinação anual",
  "price": 150,
  "notes": "Trazer carteira de vacinação"
}
```

**PUT `/appointments/:id`**: o PUT envia o objeto completo. Exemplo de conclusão de consulta:
```json
{
  "pet_id": "uuid-do-pet",
  "scheduled_at": "2026-12-10T14:30:00-03:00",
  "veterinarian": "Dra. Ana Lima",
  "reason": "Vacinação anual",
  "price": 150,
  "status": "concluida",
  "notes": "Vacina V10 aplicada"
}
```

**PUT `/pets/:id`**
```json
{
  "owner_id": "uuid-do-tutor",
  "name": "Thor",
  "species": "Cachorro",
  "breed": "Golden Retriever",
  "birth_date": "2021-05-14",
  "active": false
}
```

**Erro de validação (400)**
```json
{
  "message": "Dados inválidos.",
  "errors": ["name é obrigatório.", "owner_id é obrigatório e deve ser um UUID válido."]
}
```

**Regra de negócio (409)**
```json
{ "message": "Este veterinário já possui uma consulta agendada neste horário." }
```

## 12. Testes automatizados e cobertura

**Ferramentas:** Vitest (runner e mocks com `vi.fn`), Supertest (requisições HTTP) e `@vitest/coverage-v8` (cobertura).

**Organização**
```
tests/
├── unit/
│   ├── helpers/factories.ts        # entidades de exemplo + mocks dos repositórios
│   ├── services/                   # OwnerService, PetService, AppointmentService
│   ├── models/                     # métodos de domínio das entidades
│   └── middlewares/                # conversão de erros em status HTTP
└── integration/
    ├── setup.ts                    # carrega .env.test ou .env
    ├── helpers/db.ts               # dados únicos por execução + limpeza
    ├── app.test.ts                 # rota raiz, Swagger, 404, JSON inválido
    ├── owners.test.ts              # CRUD completo de /owners
    ├── pets.test.ts                # CRUD completo de /pets
    └── appointments.test.ts        # CRUD completo de /appointments
```

- **Unitários:** testam os services de forma isolada. Os repositórios são substituídos por mocks (`vi.fn`), então o banco não é usado. Cobrem os cenários de sucesso e de falha de cada regra de negócio da seção 5. O relógio (`now`) é injetado para que os testes com datas sejam determinísticos.
- **Integração:** sobem a aplicação real com o Supertest e gravam no Supabase. Para cada entidade testam criação, listagem, consulta por ID, atualização e exclusão, verificando os status HTTP e o corpo das respostas, inclusive os casos 400, 404, 409 e 422.

**Comandos**

```bash
npm test                   # todos os testes
npm run test:unit          # somente unitários (não precisa de banco)
npm run test:integration   # somente integração (precisa do .env e do schema.sql aplicado)
npm run test:coverage      # todos os testes + relatório de cobertura
```

O relatório é exibido no terminal e salvo em `coverage/index.html` (abra no navegador). A cobertura mínima exigida é de **60%** em linhas, instruções, funções e branches, configurada como `thresholds` no [`vitest.config.ts`](vitest.config.ts): o comando falha se algum valor ficar abaixo disso. Todo o código de `src/` entra na medição, exceto o `server.ts`, que só chama `app.listen`.

**Cobertura alcançada** (`npm run test:coverage`):

| Métrica | % |
|---|---|
| Statements | _a preencher_ |
| Branches | _a preencher_ |
| Functions | _a preencher_ |
| Lines | _a preencher_ |

**Cuidados com o banco de testes**
- Os testes de integração criam registros com e-mails e nomes únicos por execução (`RUN_ID`) e **apagam tudo o que criaram** no `afterAll`, na ordem das chaves estrangeiras (consultas → pets → tutores). Assim podem ser executados várias vezes sem interferir nos dados existentes.
- Os arquivos de integração rodam em sequência (`fileParallelism: false`).
- Para usar um banco separado, crie um `.env.test` com as credenciais de outro projeto Supabase: o `setup.ts` dá prioridade a ele.
- O banco precisa ter as três tabelas criadas pelo `database/schema.sql`.

## 13. Documentação Swagger

Com a API rodando (`npm run dev`), acesse **http://localhost:3000/api-docs**.

- Os endpoints estão agrupados por entidade (**Tutores**, **Pets**, **Consultas**), com descrição, parâmetros, corpo esperado, exemplos e as respostas possíveis (200/201/400/404/409/422).
- Para testar, clique no endpoint, depois em **Try it out**, ajuste o JSON de exemplo e clique em **Execute**. A resposta real da API aparece logo abaixo.
- A especificação em JSON fica em `/api-docs.json` e pode ser importada no Postman ou no Insomnia.

## 14. Integração contínua

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda a cada push ou pull request na `main`. Ele instala as dependências, compila o TypeScript e executa os testes unitários. Se os secrets `SUPABASE_URL` e `SUPABASE_SECRET_KEY` estiverem configurados no repositório, também roda os testes de integração com cobertura.
