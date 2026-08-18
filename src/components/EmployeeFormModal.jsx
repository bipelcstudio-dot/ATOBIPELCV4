import React, { useState } from 'react';

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'داشبورد' },
  { id: 'clients', label: 'مدیریت مشتریان (CRM)' },
  { id: 'projects', label: 'پروژه‌ها' },
  { id: 'tasks', label: 'تسک‌ها' },
  { id: 'finance', label: 'امور مالی' },
  { id: 'contracts', label: 'قراردادها' },
  { id: 'hr', label: 'منابع انسانی (HR)' },
  { id: 'freelancers', label: 'فریلنسرها' },
  { id: 'requests', label: 'درخواست‌ها' },
  { id: 'chat', label: 'چت و ارتباطات' },
  { id: 'employees', label: 'مدیریت کارمندان' },
  { id: 'reports', label: 'گزارش‌ها' }
];

const ALLOWED_ROLES = ['Super Admin', 'Admin', 'Manager', 'Employee', 'Freelancer'];

export default function EmployeeFormModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'Employee',
    position: '',
    permissions: ['dashboard', 'tasks']
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handlePermissionToggle = (permId) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permId)
          : [...prev.permissions, permId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': localStorage.getItem('user_role') || 'Admin',
          'X-User-Permissions': localStorage.getItem('user_permissions') || '[]'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت اطلاعات کارمند');

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.message);
    } fontally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 dir-rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl p-6 text-slate-100 shadow-2xl">
        <h2 className="text-xl font-bold mb-4 border-b border-slate-800 pb-2 text-amber-500">
          افزودن همکار / کارمند جدید
        </h2>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">نام کامل</label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">نام کاربری</label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">رمز عبور</label>
              <input
                type="password"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">نقش سیستمی (Role)</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {ALLOWED_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">سمت سازمانی (Position)</label>
              <input
                type="text"
                placeholder="مثلاً: مدیر ارشد تدوین، کارگردان، لید موشن دیزاین"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">سطوح دسترسی (Permissions)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm.id)}
                    onChange={() => handlePermissionToggle(perm.id)}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {loading ? 'در حال ثبت...' : 'ثبت کارمند'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
