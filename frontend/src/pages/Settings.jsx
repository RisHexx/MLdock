import React, { useState } from 'react';
import { Lock, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 mb-6">
    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{description}</p>
    </div>
  </div>
);

const PasswordSection = () => {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (status !== 'loading') setStatus('idle');
  };

  const mismatch = form.confirm.length > 0 && form.next !== form.confirm;
  const tooShort = form.next.length > 0 && form.next.length < 6;
  const canSubmit = form.current && form.next && form.confirm && !mismatch && !tooShort && status !== 'loading';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('loading');
    try {
      await api.post('/auth/change-password', {
        current_password: form.current,
        new_password: form.next,
      });
      setStatus('success');
      setMessage('Password updated. Use the new password next time you sign in.');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setStatus('error');
      setMessage(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg).join('; ')
            : 'Failed to update password'
      );
    }
  };

  return (
    <Card className="p-6">
      <SectionHeader icon={Lock} title="Change Password" description="Update the password for your admin account." />

      {status === 'success' && (
        <div className="mb-5 bg-green-50 text-green-700 p-3 rounded-input text-sm flex items-center border border-green-100">
          <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
          {message}
        </div>
      )}
      {status === 'error' && (
        <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-input text-sm flex items-center border border-red-100">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          icon={Lock}
          value={form.current}
          onChange={update('current')}
          required
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          icon={Lock}
          value={form.next}
          onChange={update('next')}
          error={tooShort ? 'Must be at least 6 characters' : undefined}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          icon={Lock}
          value={form.confirm}
          onChange={update('confirm')}
          error={mismatch ? 'Passwords do not match' : undefined}
          required
        />
        <div className="pt-2">
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {status === 'loading' ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-3 text-sm border-b border-border last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900">{value ?? '—'}</span>
  </div>
);

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your admin account</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <SectionHeader icon={UserIcon} title="Account" description="You are signed in as the MlDock administrator." />
          <InfoRow label="Username" value={user?.username} />
          <InfoRow label="Role" value="Admin" />
        </Card>

        <PasswordSection />
      </div>
    </div>
  );
};

export default Settings;
