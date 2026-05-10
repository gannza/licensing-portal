import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetAdminApplicationTypeQuery,
  useUpdateApplicationTypeMutation,
  useCreateDocumentRequirementMutation,
  useUpdateDocumentRequirementMutation,
  useDeleteDocumentRequirementMutation,
} from "../../api/applicationTypesApi";
import {
  useGetWorkflowsByTypeQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  useGetWorkflowStatesQuery,
  useCreateWorkflowStateMutation,
  useUpdateWorkflowStateMutation,
  useDeleteWorkflowStateMutation,
  useGetWorkflowTransitionsQuery,
  useCreateWorkflowTransitionMutation,
  useUpdateWorkflowTransitionMutation,
  useDeleteWorkflowTransitionMutation,
  useGetWorkflowAssignmentsQuery,
  useAddWorkflowAssignmentMutation,
  useRemoveWorkflowAssignmentMutation,
  useGetUsersQuery,
} from "../../api/adminApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import type {
  ApplicationType,
  DocumentRequirement,
  Workflow,
  WorkflowState,
  WorkflowTransition,
} from "../../types";

const WORKFLOW_ROLES = [

  "INTAKE_OFFICER",
  "REVIEWER",
  "LEGAL_OFFICER",
  "FINANCIAL_OFFICER",
  "APPROVER",
    "APPLICANT",
];

interface StatesModalProps {
  workflow: Workflow;
  onClose: () => void;
}

function WorkflowStatesModal({ workflow, onClose }: StatesModalProps) {
  const { data, isLoading } = useGetWorkflowStatesQuery(workflow.id);
  const [createState, { isLoading: creating }] =
    useCreateWorkflowStateMutation();
  const [updateState, { isLoading: updating }] =
    useUpdateWorkflowStateMutation();
  const [deleteState] = useDeleteWorkflowStateMutation();

  type ViewMode = "list" | "add" | "edit";
  const [mode, setMode] = useState<ViewMode>("list");
  const [editing, setEditing] = useState<WorkflowState | null>(null);
  const [form, setForm] = useState({
    key: "",
    label: "",
    is_initial: false,
    is_terminal: false,
    display_order: 0,
  });

  const openAdd = () => {
    setForm({
      key: "",
      label: "",
      is_initial: false,
      is_terminal: false,
      display_order: 0,
    });
    setEditing(null);
    setMode("add");
  };

  const openEdit = (s: WorkflowState) => {
    setForm({
      key: s.key,
      label: s.label,
      is_initial: s.is_initial,
      is_terminal: s.is_terminal,
      display_order: s.display_order,
    });
    setEditing(s);
    setMode("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateState({
          id: editing.id,
          workflow_id: workflow.id,
          ...form,
        }).unwrap();
        toast.success("State updated");
      } else {
        await createState({ workflow_id: workflow.id, ...form }).unwrap();
        toast.success("State created");
      }
      setMode("list");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Operation failed");
    }
  };

  const handleDelete = async (s: WorkflowState) => {
    if (!confirm(`Delete state "${s.label}"?`)) return;
    try {
      await deleteState({ id: s.id, workflow_id: workflow.id }).unwrap();
      toast.success("State deleted");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Delete failed");
    }
  };

  const isSaving = creating || updating;
  const states = data?.data ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-brand-base">
              Workflow States
            </h3>
            <p className="text-sm text-gray-500">{workflow.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &#x2715;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === "list" && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={openAdd}
                  className="btn-primary text-sm py-1.5 px-4"
                >
                  + Add State
                </button>
              </div>
              {isLoading && <LoadingSpinner />}
              {!isLoading && states.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">
                  No states defined yet.
                </p>
              )}
              {states.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">Key</th>
                      <th className="pb-2 font-medium">Label</th>
                      <th className="pb-2 font-medium">Flags</th>
                      <th className="pb-2 font-medium">Order</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {states.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5">
                          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {s.key}
                          </span>
                        </td>
                        <td className="py-2.5 text-gray-800">{s.label}</td>
                        <td className="py-2.5">
                          <div className="flex gap-1 flex-wrap">
                            {s.is_initial && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                Initial
                              </span>
                            )}
                            {s.is_terminal && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                                Terminal
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 text-gray-500">
                          {s.display_order}
                        </td>
                        <td className="py-2.5">
                          {!(s.key === "DRAFT" || s.key === "SUBMITTED" ) && <>
                           <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(s)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                          </>}
                         
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {(mode === "add" || mode === "edit") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="font-semibold text-gray-700">
                {editing ? "Edit State" : "New State"}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="input-field font-mono uppercase"
                    value={form.key}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        key: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g. UNDER_REVIEW"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.display_order}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        display_order: Number(e.target.value),
                      }))
                    }
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field"
                  value={form.label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value }))
                  }
                  placeholder="e.g. Under Review"
                  required
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_initial}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_initial: e.target.checked }))
                    }
                    className="rounded"
                  />
                  Initial state
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_terminal}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_terminal: e.target.checked }))
                    }
                    className="rounded"
                  />
                  Terminal state
                </label>

                
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMode("list")}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary flex-1"
                >
                  {isSaving
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create State"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Workflow Transitions Modal
interface TransitionsModalProps {
  workflow: Workflow;
  onClose: () => void;
}

function WorkflowTransitionsModal({
  workflow,
  onClose,
}: TransitionsModalProps) {
  const { data: statesData } = useGetWorkflowStatesQuery(workflow.id);
  const { data, isLoading } = useGetWorkflowTransitionsQuery(workflow.id);
  const [createTransition, { isLoading: creating }] =
    useCreateWorkflowTransitionMutation();
  const [updateTransition, { isLoading: updating }] =
    useUpdateWorkflowTransitionMutation();
  const [deleteTransition] = useDeleteWorkflowTransitionMutation();

  type ViewMode = "list" | "add" | "edit";
  const [mode, setMode] = useState<ViewMode>("list");
  const [editing, setEditing] = useState<WorkflowTransition | null>(null);
  const [form, setForm] = useState({
    from_state_key: "",
    to_state_key: "",
    required_role: "",
    requires_decision: false,
    label: "",
  });

  const states = statesData?.data ?? [];
  const transitions = data?.data ?? [];

  const openAdd = () => {
    setForm({
      from_state_key: "",
      to_state_key: "",
      required_role: "",
      requires_decision: false,
      label: "",
    });
    setEditing(null);
    setMode("add");
  };

  const openEdit = (t: WorkflowTransition) => {
    setForm({
      from_state_key: t.from_state_key,
      to_state_key: t.to_state_key,
      required_role: t.required_role,
      requires_decision: t.requires_decision,
      label: t.label ?? "",
    });
    setEditing(t);
    setMode("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateTransition({
          id: editing.id,
          workflow_id: workflow.id,
          ...form,
        }).unwrap();
        toast.success("Transition updated");
      } else {
        await createTransition({ workflow_id: workflow.id, ...form }).unwrap();
        toast.success("Transition created");
      }
      setMode("list");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Operation failed");
    }
  };

  const handleDelete = async (t: WorkflowTransition) => {
    if (
      !confirm(`Delete transition "${t.from_state_key} → ${t.to_state_key}"?`)
    )
      return;
    try {
      await deleteTransition({ id: t.id, workflow_id: workflow.id }).unwrap();
      toast.success("Transition deleted");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Delete failed");
    }
  };

  const isSaving = creating || updating;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-brand-base">
              Workflow Transitions
            </h3>
            <p className="text-sm text-gray-500">{workflow.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &#x2715;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === "list" && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={openAdd}
                  className="btn-primary text-sm py-1.5 px-4"
                >
                  + Add Transition
                </button>
              </div>
              {isLoading && <LoadingSpinner />}
              {!isLoading && transitions.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">
                  No transitions defined yet.
                </p>
              )}
              {transitions.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">From</th>
                      <th className="pb-2 font-medium">To</th>
                      <th className="pb-2 font-medium">Required Role</th>
                      <th className="pb-2 font-medium">Decision</th>
                      <th className="pb-2 font-medium">Label</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transitions.map((t) => (
                      <tr key={t.id}>
                        <td className="py-2.5">
                          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {t.from_state_key}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {t.to_state_key}
                          </span>
                        </td>
                        <td className="py-2.5 text-gray-600 text-xs">
                          {t.required_role.replace(/_/g, " ")}
                        </td>
                        <td className="py-2.5">
                          {t.requires_decision ? (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                              Yes
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-2.5 text-gray-500">
                          {t.label || "—"}
                        </td>
                        <td className="py-2.5">
                          {!(
                            t.from_state_key === "DRAFT" &&
                            t.to_state_key === "SUBMITTED"
                          ) && (
                            <>
                              <div className="flex gap-2">
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
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {(mode === "add" || mode === "edit") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="font-semibold text-gray-700">
                {editing ? "Edit Transition" : "New Transition"}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From State <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={form.from_state_key}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, from_state_key: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select state...</option>
                    {states.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label} ({s.key})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To State <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={form.to_state_key}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, to_state_key: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select state...</option>
                    {states.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label} ({s.key})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Role <span className="text-red-500">*</span>
                </label>
                <select
                  className="input-field"
                  value={form.required_role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, required_role: e.target.value }))
                  }
                  required
                >
                  <option value="">Select role...</option>
                  {WORKFLOW_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  className="input-field"
                  value={form.label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value }))
                  }
                  placeholder="e.g. Submit for Review"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.requires_decision}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      requires_decision: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Requires a decision note
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMode("list")}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary flex-1"
                >
                  {isSaving
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create Transition"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Workflow Assignments Modal

interface AssignmentsModalProps {
  workflow: Workflow;
  onClose: () => void;
}

function WorkflowAssignmentsModal({ workflow, onClose }: AssignmentsModalProps) {
  const { data, isLoading } = useGetWorkflowAssignmentsQuery(workflow.id);
  const { data: usersData } = useGetUsersQuery({ limit: 200 });
  const [addAssignment, { isLoading: adding }] = useAddWorkflowAssignmentMutation();
  const [removeAssignment] = useRemoveWorkflowAssignmentMutation();
  const [form, setForm] = useState({ user_id: '', role: '' });

  const assignments = data?.data ?? [];
  const staffUsers = (usersData?.data ?? []).filter(u => u.system_role === 'STAFF' && u.is_active);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAssignment({ workflow_id: workflow.id, ...form }).unwrap();
      setForm({ user_id: '', role: '' });
      toast.success('User assigned');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Assignment failed');
    }
  };

  const handleRemove = async (assignmentId: string, name: string) => {
    if (!confirm(`Remove ${name} from this workflow?`)) return;
    try {
      await removeAssignment({ workflow_id: workflow.id, assignment_id: assignmentId }).unwrap();
      toast.success('Assignment removed');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Remove failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-brand-base">User Assignments</h3>
            <p className="text-sm text-gray-500">{workflow.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &#x2715;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current assignments */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Assignments</h4>
            {isLoading && <LoadingSpinner />}
            {!isLoading && assignments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No users assigned to this workflow yet.</p>
            )}
            {assignments.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 font-medium text-gray-800">{a.full_name}</td>
                      <td className="py-2.5 text-gray-500 text-xs">{a.email}</td>
                      <td className="py-2.5">
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          {a.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          onClick={() => handleRemove(a.id, a.full_name)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add assignment form */}
          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Assignment</h4>
            <form onSubmit={handleAdd} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Staff User</label>
                <select
                  title="Staff user"
                  className="input-field"
                  value={form.user_id}
                  onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                  required
                >
                  <option value="">Select user...</option>
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  title="Workflow role"
                  className="input-field"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  required
                >
                  <option value="">Select role...</option>
                  {WORKFLOW_ROLES.map(r => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={adding}
                className="btn-primary py-2 px-4 text-sm whitespace-nowrap"
              >
                {adding ? 'Adding...' : '+ Assign'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Workflow Form Modal

interface WorkflowModalProps {
  typeId: string;
  editing: Workflow | null;
  onClose: () => void;
}

function WorkflowFormModal({ typeId, editing, onClose }: WorkflowModalProps) {
  const [createWorkflow, { isLoading: creating }] = useCreateWorkflowMutation();
  const [updateWorkflow, { isLoading: updating }] = useUpdateWorkflowMutation();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateWorkflow({ id: editing.id, ...form }).unwrap();
        toast.success("Workflow updated");
      } else {
        await createWorkflow({ application_type_id: typeId, ...form }).unwrap();
        toast.success("Workflow created");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Operation failed");
    }
  };

  const isSaving = creating || updating;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-brand-base">
            {editing ? "Edit Workflow" : "Add Workflow"}
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
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Standard Review Workflow"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional description..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1"
            >
              {isSaving ? "Saving..." : editing ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Document Requirement Form Modal ────────────────────────────────────────

interface DocReqModalProps {
  typeId: string;
  editing: DocumentRequirement | null;
  onClose: () => void;
}

const emptyDocReq = {
  key: "",
  label: "",
  description: "",
  is_required: true,
  allowed_mime_types: "",
  max_size_bytes: 5242880,
  display_order: 0,
};

function DocReqFormModal({ typeId, editing, onClose }: DocReqModalProps) {
  const [createReq, { isLoading: creating }] =
    useCreateDocumentRequirementMutation();
  const [updateReq, { isLoading: updating }] =
    useUpdateDocumentRequirementMutation();
  const [form, setForm] = useState({
    key: editing?.key ?? "",
    label: editing?.label ?? "",
    description: editing?.description ?? "",
    is_required: editing?.is_required ?? true,
    allowed_mime_types: editing?.allowed_mime_types?.join(", ") ?? "",
    max_size_bytes: editing?.max_size_bytes ?? 5242880,
    display_order: editing?.display_order ?? 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mimeTypes = form.allowed_mime_types
      ? form.allowed_mime_types
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    try {
      if (editing) {
        await updateReq({
          id: editing.id,
          application_type_id: typeId,
          ...form,
          allowed_mime_types: mimeTypes,
        }).unwrap();
        toast.success("Document requirement updated");
      } else {
        await createReq({
          application_type_id: typeId,
          ...form,
          allowed_mime_types: mimeTypes,
        }).unwrap();
        toast.success("Document requirement created");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Operation failed");
    }
  };

  const isSaving = creating || updating;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-brand-base">
            {editing ? "Edit Document Requirement" : "Add Document Requirement"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field font-mono"
                value={form.key}
                onChange={(e) =>
                  setForm((f) => ({ ...f, key: e.target.value }))
                }
                placeholder="e.g. certificate_of_incorporation"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                className="input-field"
                value={form.display_order}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    display_order: Number(e.target.value),
                  }))
                }
                min={0}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              className="input-field"
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value }))
              }
              placeholder="e.g. Certificate of Incorporation"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              className="input-field"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional description for applicants..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allowed MIME Types
              <span className="text-gray-400 font-normal ml-1">
                (comma-separated, leave blank for any)
              </span>
            </label>
            <input
              className="input-field font-mono text-sm"
              value={form.allowed_mime_types}
              onChange={(e) =>
                setForm((f) => ({ ...f, allowed_mime_types: e.target.value }))
              }
              placeholder="application/pdf, image/jpeg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max File Size (bytes)
            </label>
            <input
              type="number"
              className="input-field"
              value={form.max_size_bytes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  max_size_bytes: Number(e.target.value),
                }))
              }
              min={1}
            />
            <p className="text-xs text-gray-400 mt-1">
              {(form.max_size_bytes / 1048576).toFixed(1)} MB
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_required}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_required: e.target.checked }))
              }
              className="rounded"
            />
            Required document
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1"
            >
              {isSaving ? "Saving..." : editing ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Application Type Edit Modal ─────────────────────────────────────────────

interface EditTypeModalProps {
  appType: ApplicationType;
  onClose: () => void;
}

function EditTypeModal({ appType, onClose }: EditTypeModalProps) {
  const [updateType, { isLoading }] = useUpdateApplicationTypeMutation();
  const [form, setForm] = useState({
    name: appType.name,
    code: appType.code,
    description: appType.description ?? "",
    is_active: appType.is_active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateType({ id: appType.id, ...form }).unwrap();
      toast.success("Application type updated");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Update failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-brand-base">
            Edit Application Type
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
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="rounded"
            />
            Active (visible to applicants)
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

//Main Page

type ActiveModal =
  | { kind: "none" }
  | { kind: "editType" }
  | { kind: "addWorkflow" }
  | { kind: "editWorkflow"; workflow: Workflow }
  | { kind: "workflowStates"; workflow: Workflow }
  | { kind: "workflowTransitions"; workflow: Workflow }
  | { kind: "workflowAssignments"; workflow: Workflow }
  | { kind: "addDocReq" }
  | { kind: "editDocReq"; req: DocumentRequirement };

export default function ApplicationTypeDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: typeData, isLoading: typeLoading } =
    useGetAdminApplicationTypeQuery(id!);
  const { data: workflowsData, isLoading: workflowsLoading } =
    useGetWorkflowsByTypeQuery(id!);
  const [deleteWorkflow] = useDeleteWorkflowMutation();
  const [deleteReq] = useDeleteDocumentRequirementMutation();

  const [modal, setModal] = useState<ActiveModal>({ kind: "none" });
  const close = () => setModal({ kind: "none" });

  const appType = typeData?.data;
  const workflows = workflowsData?.data ?? [];

  const handleDeleteWorkflow = async (w: Workflow) => {
    if (
      !confirm(
        `Delete workflow "${w.name}"? This will also remove its states and transitions.`,
      )
    )
      return;
    try {
      await deleteWorkflow(w.id).unwrap();
      toast.success("Workflow deleted");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Delete failed");
    }
  };

  const handleDeleteReq = async (req: DocumentRequirement) => {
    if (!confirm(`Delete requirement "${req.label}"?`)) return;
    try {
      await deleteReq({ id: req.id, application_type_id: id! }).unwrap();
      toast.success("Document requirement deleted");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Delete failed");
    }
  };

  if (typeLoading) return <LoadingSpinner />;
  if (!appType)
    return <p className="text-gray-500 text-sm">Application type not found.</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link
              to="/app/admin/application-types"
              className="hover:text-brand-special"
            >
              Application Types
            </Link>
            <span>/</span>
            <span className="text-gray-600">{appType.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-brand-base">
              {appType.name}
            </h2>
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
              {appType.code}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                appType.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {appType.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          {appType.description && (
            <p className="text-gray-500 text-sm mt-1">{appType.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setModal({ kind: "editType" })}
          className="btn-secondary whitespace-nowrap"
        >
          Edit Type
        </button>
      </div>

      {/* Workflows Section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Workflows</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Define review workflows and their states and transitions.
            </p>
          </div>
          <button
            type="button"
            disabled={workflows.length >= 1}
            onClick={() => setModal({ kind: "addWorkflow" })}
            className="btn-primary text-sm py-1.5 px-4"
          >
            + Add Workflow
          </button>
        </div>

        {workflowsLoading && <LoadingSpinner />}
        {!workflowsLoading && workflows.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">
            No workflows yet.
          </p>
        )}
        {workflows.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workflows.map((w) => (
                <tr key={w.id}>
                  <td className="py-3 font-medium text-gray-800">{w.name}</td>
                  <td className="py-3 text-gray-500">{w.description || "—"}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          setModal({ kind: "workflowStates", workflow: w })
                        }
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded font-medium"
                      >
                        States
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setModal({ kind: "workflowTransitions", workflow: w })
                        }
                        className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-2 py-1 rounded font-medium"
                      >
                        Transitions
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setModal({ kind: "workflowAssignments", workflow: w })
                        }
                        className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded font-medium"
                      >
                        Assign Users
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setModal({ kind: "editWorkflow", workflow: w })
                        }
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkflow(w)}
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

      {/* Document Requirements Section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Document Requirements</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Documents applicants must upload for this license type.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ kind: "addDocReq" })}
            className="btn-primary text-sm py-1.5 px-4"
          >
            + Add Requirement
          </button>
        </div>

        {appType.document_requirements.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">
            No document requirements yet.
          </p>
        )}
        {appType.document_requirements.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Key</th>
                <th className="pb-2 font-medium">Label</th>
                <th className="pb-2 font-medium">Required</th>
                <th className="pb-2 font-medium">Max Size</th>
                <th className="pb-2 font-medium">Order</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appType.document_requirements
                .slice()
                .sort((a, b) => a.display_order - b.display_order)
                .map((req) => (
                  <tr key={req.id}>
                    <td className="py-2.5">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {req.key}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-800">{req.label}</td>
                    <td className="py-2.5">
                      {req.is_required ? (
                        <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">
                          Required
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Optional</span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-500 text-xs">
                      {(req.max_size_bytes / 1048576).toFixed(1)} MB
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {req.display_order}
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setModal({ kind: "editDocReq", req })}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReq(req)}
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

      {/* Modals */}
      {modal.kind === "editType" && (
        <EditTypeModal appType={appType} onClose={close} />
      )}
      {modal.kind === "addWorkflow" && (
        <WorkflowFormModal typeId={id!} editing={null} onClose={close} />
      )}
      {modal.kind === "editWorkflow" && (
        <WorkflowFormModal
          typeId={id!}
          editing={modal.workflow}
          onClose={close}
        />
      )}
      {modal.kind === "workflowStates" && (
        <WorkflowStatesModal workflow={modal.workflow} onClose={close} />
      )}
      {modal.kind === "workflowTransitions" && (
        <WorkflowTransitionsModal workflow={modal.workflow} onClose={close} />
      )}
      {modal.kind === "workflowAssignments" && (
        <WorkflowAssignmentsModal workflow={modal.workflow} onClose={close} />
      )}
      {modal.kind === "addDocReq" && (
        <DocReqFormModal typeId={id!} editing={null} onClose={close} />
      )}
      {modal.kind === "editDocReq" && (
        <DocReqFormModal typeId={id!} editing={modal.req} onClose={close} />
      )}
    </div>
  );
}
