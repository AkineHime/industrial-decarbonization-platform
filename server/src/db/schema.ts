export const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS mines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    annual_capacity_tons DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS emission_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID REFERENCES mines(id),
    activity_type VARCHAR(50) NOT NULL, -- 'excavation', 'transport', 'processing'
    scope VARCHAR(10) NOT NULL, -- 'scope1', 'scope2', 'scope3'
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    co2e_tons DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID REFERENCES mines(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    interventions JSONB, -- Storing full intervention config as JSON
    target_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;
