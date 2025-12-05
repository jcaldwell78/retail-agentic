-- PostgreSQL initialization script for Retail Agentic platform
-- Used for payment transactions requiring ACID guarantees

-- Create schema
CREATE SCHEMA IF NOT EXISTS retail;

-- Payment transactions table
CREATE TABLE IF NOT EXISTS retail.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_amount_positive CHECK (amount >= 0),
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'CANCELLED'))
);

-- Create indexes
CREATE INDEX idx_payment_transactions_tenant_id ON retail.payment_transactions(tenant_id);
CREATE INDEX idx_payment_transactions_order_id ON retail.payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_user_id ON retail.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON retail.payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON retail.payment_transactions(created_at DESC);

-- Payment refunds table
CREATE TABLE IF NOT EXISTS retail.payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    transaction_id UUID NOT NULL REFERENCES retail.payment_transactions(id),
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL,
    gateway_refund_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_refund_amount_positive CHECK (amount >= 0),
    CONSTRAINT chk_refund_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_payment_refunds_tenant_id ON retail.payment_refunds(tenant_id);
CREATE INDEX idx_payment_refunds_transaction_id ON retail.payment_refunds(transaction_id);
CREATE INDEX idx_payment_refunds_created_at ON retail.payment_refunds(created_at DESC);

-- Audit log for financial transactions
CREATE TABLE IF NOT EXISTS retail.transaction_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    transaction_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    user_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transaction_audit_log_transaction_id ON retail.transaction_audit_log(transaction_id);
CREATE INDEX idx_transaction_audit_log_created_at ON retail.transaction_audit_log(created_at DESC);

-- Grant permissions (adjust as needed for your application user)
GRANT USAGE ON SCHEMA retail TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA retail TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA retail TO postgres;

-- Insert comment
COMMENT ON SCHEMA retail IS 'Schema for retail platform payment transactions and financial data';
