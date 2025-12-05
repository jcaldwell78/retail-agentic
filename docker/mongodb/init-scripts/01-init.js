// MongoDB initialization script for Retail Agentic platform

db = db.getSiblingDB('retail-agentic');

// Create collections with validation
db.createCollection('tenants', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name', 'subdomain', 'status', 'createdAt'],
      properties: {
        _id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        subdomain: { bsonType: 'string' },
        customDomain: { bsonType: 'string' },
        status: { enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'] },
        branding: { bsonType: 'object' }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'tenantId', 'name', 'sku', 'price', 'currency', 'status'],
      properties: {
        _id: { bsonType: 'string' },
        tenantId: { bsonType: 'string' },
        name: { bsonType: 'string' },
        sku: { bsonType: 'string' },
        price: { bsonType: 'number', minimum: 0 }
      }
    }
  }
});

db.createCollection('users');
db.createCollection('orders');
db.createCollection('inventory');

// Create indexes for performance
db.tenants.createIndex({ subdomain: 1 }, { unique: true });
db.tenants.createIndex({ customDomain: 1 }, { unique: true, sparse: true });

db.products.createIndex({ tenantId: 1, sku: 1 }, { unique: true });
db.products.createIndex({ tenantId: 1, status: 1 });
db.products.createIndex({ tenantId: 1, categories: 1 });
db.products.createIndex({ tenantId: 1, name: 'text', description: 'text' });

db.users.createIndex({ tenantId: 1, email: 1 }, { unique: true });
db.users.createIndex({ tenantId: 1, status: 1 });

db.orders.createIndex({ tenantId: 1, userId: 1 });
db.orders.createIndex({ tenantId: 1, orderNumber: 1 }, { unique: true });
db.orders.createIndex({ tenantId: 1, status: 1 });
db.orders.createIndex({ tenantId: 1, createdAt: -1 });

db.inventory.createIndex({ tenantId: 1, productId: 1 }, { unique: true });

// Insert demo tenant
db.tenants.insertOne({
  _id: 'demo-store',
  name: 'Demo Store',
  subdomain: 'demo',
  status: 'ACTIVE',
  branding: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b'
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB initialization completed successfully');
