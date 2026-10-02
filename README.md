# API Clínica Veterinária

## 1. Nome e descrição do projeto

**API Clínica Veterinária** — API REST para gerenciar os **tutores** (donos) e os **pets** atendidos por uma clínica veterinária.

- **Problema:** clínicas pequenas costumam controlar cadastros de tutores e animais em papel ou planilhas, o que gera dados duplicados e difíceis de consultar.
- **Domínio:** clínica veterinária.
- **Objetivo da API:** centralizar o cadastro de tutores e pets, com CRUD completo, relacionamento entre eles e persistência em banco de dados (Supabase/PostgreSQL).

## 2. Integrantes da equipe

- Nome completo do integrante 1
- Nome completo do integrante 2
- Nome completo do integrante 3

## 3. Tecnologias utilizadas

- Node.js
- TypeScript
- Express 5
- Supabase (`@supabase/supabase-js`)
- PostgreSQL
- tsx (execução do TypeScript em desenvolvimento)
- Git / GitHub

## 4. Entidades e relacionamento

**Tutor (`owners`)**

| Atributo     | Descrição                          |
|--------------|------------------------------------|
| `id`         | UUID, chave primária               |
| `name`       | Nome do tutor (obrigatório)        |
| `email`      | E-mail único (obrigatório)         |
| `phone`      | Telefone (opcional)                |
| `active`     | Se o cadastro está ativo           |
| `created_at` | Data de criação                    |

**Pet (`pets`)**

| Atributo     | Descrição                                   |
|--------------|---------------------------------------------|
| `id`         | UUID, chave primária                        |
| `owner_id`   | UUID do tutor (chave estrangeira)           |
| `name`       | Nome do pet (obrigatório)                   |
| `species`    | Espécie, ex.: cachorro, gato (obrigatório)  |
| `breed`      | Raça (opcional)                             |
| `birth_date` | Data de nascimento `AAAA-MM-DD` (opcional)  |
| `active`     | Se o cadastro está ativo                    |
| `created_at` | Data de criação                             |

**Relacionamento:** um Tutor pode possuir vários Pets e cada Pet pertence a um único Tutor (1:N). Um tutor que ainda possui pets **não pode ser removido** (`ON DELETE RESTRICT`).

## 5. Estrutura do projeto

```
src/
├── config/        # conexão com o Supabase
├── controllers/   # regras de cada requisição (validação, status HTTP)
├── models/        # acesso ao banco de dados (queries do Supabase)
├── routes/        # definição das rotas de cada entidade
├── utils/         # validações e tratamento de erros
├── app.ts         # configuração do Express e registro das rotas
└── server.ts      # inicialização do servidor
database/
└── schema.sql     # script de criação das tabelas
```

## 6. Configuração e execução

```bash
git clone <url-do-repositorio>
cd <pasta-do-projeto>
npm install
cp .env.example .env     # depois preencha o .env com suas credenciais
npm run dev
```

O servidor sobe em `http://localhost:3000`.

Para gerar a versão compilada: `npm run build` e depois `npm start`.

## 7. Variáveis de ambiente

Crie um arquivo `.env` na raiz (o `.env` **não** é versionado). Use o `.env.example` como modelo:

| Variável              | Descrição                                        |
|-----------------------|--------------------------------------------------|
| `SUPABASE_URL`        | URL do projeto no Supabase                       |
| `SUPABASE_SECRET_KEY` | Secret key do projeto (usada apenas no back-end) |
| `PORT`                | Porta da API (opcional, padrão 3000)             |

## 8. Banco de dados

1. Crie um projeto no [Supabase](https://supabase.com).
2. Abra o **SQL Editor** e execute o script [`database/schema.sql`](database/schema.sql).
3. Copie a URL e a secret key do projeto para o `.env`.

Tabelas: `owners` e `pets`. A coluna `pets.owner_id` referencia `owners.id` (chave estrangeira). Todos os identificadores são UUID gerados pelo banco.

## 9. Documentação dos endpoints

### Tutores

| Método | Endpoint                 | Descrição                                   |
|--------|--------------------------|---------------------------------------------|
| GET    | `/owners`                | Lista todos os tutores                      |
| GET    | `/owners/:id`            | Consulta um tutor pelo ID                   |
| GET    | `/owners/search/:keyword`| Pesquisa tutores por nome ou e-mail         |
| POST   | `/owners`                | Cadastra um novo tutor                      |
| PUT    | `/owners/:id`            | Atualiza um tutor                           |
| DELETE | `/owners/:id`            | Remove um tutor (se não tiver pets)         |

### Pets

| Método | Endpoint                | Descrição                                           |
|--------|-------------------------|-----------------------------------------------------|
| GET    | `/pets`                 | Lista todos os pets (com o tutor de cada um)        |
| GET    | `/pets?owner_id=<uuid>` | Lista os pets de um tutor                           |
| GET    | `/pets/:id`             | Consulta um pet pelo ID                             |
| POST   | `/pets`                 | Cadastra um novo pet                                |
| PUT    | `/pets/:id`             | Atualiza um pet                                     |
| DELETE | `/pets/:id`             | Remove um pet                                       |

### Códigos de resposta

| Código | Quando ocorre                                                    |
|--------|------------------------------------------------------------------|
| 200    | Consulta, atualização ou remoção realizada                       |
| 201    | Registro criado                                                  |
| 400    | Dados inválidos, ID mal formatado ou `owner_id` inexistente      |
| 404    | Registro ou rota não encontrada                                  |
| 409    | Conflito (e-mail duplicado ou tutor com pets vinculados)         |
| 500    | Erro interno                                                     |

## 10. Exemplos de requisições

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
  "owner_id": "uuid-do-tutor-criado-acima",
  "name": "Thor",
  "species": "Cachorro",
  "breed": "Golden Retriever",
  "birth_date": "2021-05-14",
  "active": true
}
```

**PUT `/pets/:id`** (envia o objeto completo)

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

**Exemplo de erro de validação (400)**

```json
{
  "message": "Dados inválidos.",
  "errors": ["name é obrigatório.", "owner_id é obrigatório e deve ser um UUID válido."]
}
```
