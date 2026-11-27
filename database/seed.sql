-- Dados de exemplo (opcional). Execute depois do schema.sql.
with o as (
    insert into public.owners (name, email, phone)
    values ('Maria Souza', 'maria.souza@exemplo.com', '(41) 99999-0000')
    on conflict (email) do update set name = excluded.name
    returning id
), p as (
    insert into public.pets (owner_id, name, species, breed, birth_date)
    select id, 'Thor', 'Cachorro', 'Golden Retriever', '2021-05-14' from o
    returning id
)
insert into public.appointments (pet_id, scheduled_at, veterinarian, reason, price)
select id, now() + interval '7 days', 'Dra. Ana Lima', 'Vacinação anual', 150 from p;
