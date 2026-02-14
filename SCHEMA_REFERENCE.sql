-- Mines / Industrial Units
CREATE TABLE IF NOT EXISTS mines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    state VARCHAR(100),
    grid_region VARCHAR(50),  -- e.g., Northern, Southern
    climate_zone VARCHAR(50), -- e.g., Tropical, Arid
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    annual_capacity_tons DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emissions (Scope 1 & 2)
CREATE TABLE IF NOT EXISTS emissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID NOT NULL REFERENCES mines(id),
    activity_type VARCHAR(50) NOT NULL, -- e.g., diesel_combustion, grid_electricity
    scope VARCHAR(10) NOT NULL, -- scope1, scope2
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- L, kWh, kg
    co2e_tons DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scope 3 Entries (Value Chain)
CREATE TABLE IF NOT EXISTS scope3_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID NOT NULL REFERENCES mines(id),
    category VARCHAR(100) NOT NULL, -- e.g., Purchased Goods
    sub_category VARCHAR(100),      -- e.g., Cement, Steel
    vendor_name VARCHAR(255),
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    co2e_tons DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenarios for Decarbonization Planning
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID NOT NULL REFERENCES mines(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    interventions JSONB, -- Array of planned interventions
    target_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budget Tracking (Capex/Opex)
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID NOT NULL REFERENCES mines(id),
    scenario_id UUID REFERENCES scenarios(id),
    category VARCHAR(100) NOT NULL, -- Capex, Opex
    item_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Renewable Energy Assets
CREATE TABLE IF NOT EXISTS renewable_energy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID NOT NULL REFERENCES mines(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Solar, Wind
    capacity_kw DECIMAL(15,2),
    commissioning_date DATE,
    technical_details JSONB, -- Panel efficiency, tilt angle
    storage_capacity_kwh DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Renewable Generation Logs
CREATE TABLE IF NOT EXISTS renewable_generation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES renewable_energy(id),
    date DATE NOT NULL,
    generation_kwh DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Carbon Credits Management
CREATE TABLE IF NOT EXISTS carbon_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- Reforestation, Direct Capture
    vintage INT,
    quantity_tco2e DECIMAL(15,2) NOT NULL,
    available_tco2e DECIMAL(15,2) NOT NULL,
    retired_tco2e DECIMAL(15,2) DEFAULT 0,
    cost_per_unit DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'available', -- available, retired
    verification_standard VARCHAR(100),     -- Verra, Gold Standard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
