-- Migration: 0001_init.sql (Production Safe & Non-Destructive)

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Super Admin', 'Admin', 'Manager', 'Employee', 'Freelancer')),
    position TEXT DEFAULT 'اعضای تیم',
    email TEXT,
    phone TEXT,
    permissions TEXT NOT NULL DEFAULT '["dashboard"]',
    salary REAL DEFAULT 0,
    employment_type TEXT DEFAULT 'Full-time',
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    website TEXT,
    instagram TEXT,
    industry TEXT,
    business_size TEXT,
    pipeline_stage TEXT NOT NULL CHECK(pipeline_stage IN ('New Lead', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'In Negotiation', 'Contract Signed', 'Active Client', 'Lost Client')),
    rating INTEGER CHECK(rating BETWEEN 1 AND 5) DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    budget REAL DEFAULT 0,
    start_date DATE,
    deadline DATE,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
    status TEXT CHECK(status IN ('Planning', 'In Progress', 'On Hold', 'Review', 'Completed', 'Cancelled')) DEFAULT 'Planning',
    progress INTEGER CHECK(progress BETWEEN 0 AND 100) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    deadline DATE,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
    status TEXT CHECK(status IN ('To Do', 'In Progress', 'In Review', 'Completed')) DEFAULT 'To Do',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finances (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('Income', 'Expense')) NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount >= 0),
    category TEXT NOT NULL,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    status TEXT CHECK(status IN ('Pending', 'Paid', 'Overdue')) DEFAULT 'Paid',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT CHECK(type IN ('Client', 'Freelancer', 'Partnership')) NOT NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    value REAL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status TEXT CHECK(status IN ('Draft', 'Active', 'Expired', 'Terminated')) DEFAULT 'Draft',
    file_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('Equipment', 'Leave', 'Technical Support', 'New Staff', 'Other')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK(status IN ('Open', 'In Review', 'Approved', 'Rejected', 'Completed')) DEFAULT 'Open',
    manager_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
