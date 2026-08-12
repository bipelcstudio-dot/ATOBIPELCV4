DELETE FROM users WHERE username = 'admin';

INSERT INTO users
  (id, username, email, password_hash, first_name, last_name, full_name, role, department, job_title, employee_code, status)
VALUES
  ('usr_7c1ad6cb-758a-43da-8181-ccbf76b9976d', 'admin', NULL, 'pbkdf2$120000$mqe1E5AEmVaO92K3560ELQ==$klvmz6ScDlSqm5I77YqHl+W1eiN5f9QFMJ2EQC097eQ=', 'نام', 'نام‌خانوادگی', 'نام نام‌خانوادگی', 'Super Admin', 'Management', 'Founder / Super Admin', 'ADM-005320', 'Active');
