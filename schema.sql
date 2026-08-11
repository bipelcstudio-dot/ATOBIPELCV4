PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE,
 password_hash TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
 full_name TEXT NOT NULL, phone TEXT, avatar_url TEXT,
 role TEXT NOT NULL DEFAULT 'Employee',
 department TEXT, job_title TEXT, employment_type TEXT,
 employee_code TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'Active',
 start_date TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS permissions (id TEXT PRIMARY KEY,key TEXT UNIQUE NOT NULL,description TEXT);
CREATE TABLE IF NOT EXISTS role_permissions (
 role TEXT NOT NULL, permission_id TEXT NOT NULL, PRIMARY KEY(role,permission_id),
 FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,token_hash TEXT UNIQUE NOT NULL,
 expires_at TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

CREATE TABLE IF NOT EXISTS clients (
 id TEXT PRIMARY KEY, company_name TEXT NOT NULL, contact_person TEXT NOT NULL,
 phone TEXT,email TEXT,website TEXT,instagram TEXT,industry TEXT,company_size TEXT,
 status TEXT DEFAULT 'New Lead',lead_source TEXT,assigned_sales_id TEXT,
 estimated_value REAL DEFAULT 0,notes TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(assigned_sales_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS projects (
 id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,brief TEXT,client_id TEXT,
 account_manager_id TEXT,project_manager_id TEXT,budget REAL DEFAULT 0,
 estimated_cost REAL DEFAULT 0,start_date TEXT,deadline TEXT,priority TEXT DEFAULT 'Medium',
 status TEXT DEFAULT 'Planning',progress INTEGER DEFAULT 0,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,
 FOREIGN KEY(account_manager_id) REFERENCES users(id) ON DELETE SET NULL,
 FOREIGN KEY(project_manager_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
 id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,project_id TEXT,assigned_to TEXT,
 reviewer_id TEXT,priority TEXT DEFAULT 'Medium',status TEXT DEFAULT 'TODO',
 deadline TEXT,estimated_hours REAL DEFAULT 0,actual_hours REAL DEFAULT 0,
 revision_count INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
 FOREIGN KEY(assigned_to) REFERENCES users(id) ON DELETE SET NULL,
 FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS requests (
 id TEXT PRIMARY KEY,ticket_number TEXT UNIQUE NOT NULL,user_id TEXT NOT NULL,
 type TEXT NOT NULL,title TEXT NOT NULL,description TEXT,priority TEXT DEFAULT 'Medium',
 status TEXT DEFAULT 'Pending',assigned_to TEXT,manager_reply TEXT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS leave_requests (
 id TEXT PRIMARY KEY,request_id TEXT UNIQUE NOT NULL,user_id TEXT NOT NULL,
 leave_type TEXT NOT NULL,start_date TEXT NOT NULL,end_date TEXT NOT NULL,
 days REAL NOT NULL,reason TEXT,approved_by TEXT,approved_at TEXT,
 FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS purchase_requests (
 id TEXT PRIMARY KEY,request_id TEXT UNIQUE NOT NULL,item_name TEXT NOT NULL,
 category TEXT,estimated_cost REAL DEFAULT 0,required_date TEXT,reason TEXT,
 finance_status TEXT DEFAULT 'Pending',
 FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
 id TEXT PRIMARY KEY,type TEXT NOT NULL,title TEXT,project_id TEXT,created_by TEXT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS conversation_members (
 conversation_id TEXT NOT NULL,user_id TEXT NOT NULL,joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(conversation_id,user_id),
 FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS messages (
 id TEXT PRIMARY KEY,conversation_id TEXT NOT NULL,sender_id TEXT NOT NULL,
 message TEXT NOT NULL,reply_to_id TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
 FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS finances (
 id TEXT PRIMARY KEY,type TEXT NOT NULL,category TEXT NOT NULL,amount REAL NOT NULL,
 project_id TEXT,client_id TEXT,freelancer_id TEXT,description TEXT,date TEXT NOT NULL,
 created_by TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
 FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS invoices (
 id TEXT PRIMARY KEY,invoice_number TEXT UNIQUE NOT NULL,client_id TEXT NOT NULL,
 project_id TEXT,amount REAL NOT NULL,due_date TEXT,status TEXT DEFAULT 'Unpaid',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE,
 FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
 id TEXT PRIMARY KEY,user_id TEXT,action TEXT NOT NULL,entity_type TEXT,entity_id TEXT,
 description TEXT,ip_address TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO permissions(id,key,description) VALUES
('p_users_view','users.view','View users'),('p_users_create','users.create','Create users'),
('p_users_edit','users.edit','Edit users'),('p_projects_view','projects.view','View projects'),
('p_projects_create','projects.create','Create projects'),('p_projects_edit','projects.edit','Edit projects'),
('p_tasks_view','tasks.view','View tasks'),('p_tasks_create','tasks.create','Create tasks'),
('p_tasks_assign','tasks.assign','Assign tasks'),('p_clients_view','clients.view','View clients'),
('p_finance_view','finance.view','View finance'),('p_finance_edit','finance.edit','Edit finance'),
('p_tickets_create','tickets.create','Create requests'),('p_tickets_approve','tickets.approve','Approve requests'),
('p_chat_access','chat.access','Access internal chat'),('p_reports_view','reports.view','View reports');

INSERT OR IGNORE INTO role_permissions(role,permission_id) SELECT 'Super Admin',id FROM permissions;
INSERT OR IGNORE INTO role_permissions(role,permission_id) SELECT 'Operations Manager',id FROM permissions;
INSERT OR IGNORE INTO role_permissions(role,permission_id) SELECT 'Project Manager',id FROM permissions
 WHERE key IN ('users.view','projects.view','projects.create','projects.edit','tasks.view','tasks.create','tasks.assign','chat.access','tickets.approve');
INSERT OR IGNORE INTO role_permissions(role,permission_id) SELECT 'Employee',id FROM permissions
 WHERE key IN ('projects.view','tasks.view','tickets.create','chat.access');
INSERT OR IGNORE INTO role_permissions(role,permission_id) SELECT 'Freelancer',id FROM permissions
 WHERE key IN ('projects.view','tasks.view','chat.access');
