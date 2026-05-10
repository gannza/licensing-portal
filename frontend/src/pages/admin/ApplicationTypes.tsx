import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  useGetAdminApplicationTypesQuery,
  useCreateApplicationTypeMutation,
  useUpdateApplicationTypeMutation,
  useDeleteApplicationTypeMutation,
} from '../../api/applicationTypesApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { ApplicationType } from '../../types';

interface TypeForm {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

const emptyForm: TypeForm = { name: '', code: '', description: '', is_active: true };

interface ModalState {
  open: boolean;
  editing: ApplicationType | null;
}

export default function ApplicationTypes() {
  const { data, isLoading } = useGetAdminApplicationTypesQuery();
  const [createType, { isLoading: creating }] = useCreateApplicationTypeMutation();
  const [updateType, { isLoading: updating }] = useUpdateApplicationTypeMutation();
  const [deleteType] = useDeleteApplicationTypeMutation();

  const [modal, setModal] = useState<ModalState>({ open: false, editing: null });
  const [form, setForm] = useState<TypeForm>(emptyForm);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ open: true, editing: null });
  };

  const openEdit = (t: ApplicationType) => {
    setForm({ name: t.name, code: t.code, description: t.description ?? '', is_active: t.is_active });
    setModal({ open: true, editing: t });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modal.editing) {
        await updateType({ id: modal.editing.id, ...form }).unwrap();
        toast.success('Application type updated');
      } else {
        await createType(form).unwrap();
        toast.success('Application type created');
      }
      closeModal();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Operation failed');
    }
  };

  const handleDelete = async (t: ApplicationType) => {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await deleteType(t.id).unwrap();
      toast.success('Application type deleted');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Delete failed');
    }
  };

  const isSaving = creating || updating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="card flex-1">
          <h2 className="text-xl font-bold text-brand-base">Application Types</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage license categories, their workflows and document requirements.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary whitespace-nowrap">
          + Add Application Type
        </button>
      </div>

      <div className="card">
        {isLoading && <LoadingSpinner />}
        {data?.data && data.data.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">
            No application types yet. Click "+ Add Application Type" to create one.
          </p>
        )}
        {data?.data && data.data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Code</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.data.map(t => (
                <tr key={t.id}>
                  <td className="py-3 font-medium text-gray-800">{t.name}</td>
                  <td className="py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{t.code}</span>
                  </td>
                  <td className="py-3 text-gray-500 max-w-xs truncate">{t.description || '—'}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/app/admin/application-types/${t.id}`}
                        className="text-xs text-brand-special hover:underline font-medium"
                      >
                        Manage
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-brand-base">
                {modal.editing ? 'Edit Application Type' : 'Add Application Type'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Commercial Bank License"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field font-mono uppercase"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. CBL"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this license type..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active (visible to applicants)
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? 'Saving...' : modal.editing ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
