    begin;

    alter table if exists clients
        add column if not exists portal_enabled boolean not null default false;

    insert into clients (id, brand_name, username, password, whatsapp_number, portal_enabled)
    values
        ('6043772000000454003', 'VILLA4FESIL.AZ', '', '', '+99470 300 18 00', false),
        ('6043772000000097011', 'PERFOUMER.AZ', '', '', '+994104110501', false),
        ('6043772000000212043', 'Carbon Rent A Car', 'Farid Isazade', '', '+99450 484 00 06', false),
        ('6043772000000497001', 'Javar', 'Elbay Bakhishov', '', '', false),
        ('6043772000000506001', 'Muwafaq Events', 'Mr. Ilgar Hasanli', '', '', false)
    on conflict (id) do update
    set brand_name = excluded.brand_name,
            username = excluded.username,
            password = excluded.password,
            whatsapp_number = excluded.whatsapp_number,
            portal_enabled = excluded.portal_enabled;

    commit;
