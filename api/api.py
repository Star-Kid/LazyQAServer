CREATE TABLE runs (
    id SERIAL PRIMARY KEY,
    case_id INT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    machine_id INT,
    app_type app_type_enum DEFAULT 'web',
    status run_status_enum DEFAULT 'stopped'
);