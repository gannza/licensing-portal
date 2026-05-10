export type SystemRole = 'APPLICANT' | 'STAFF' | 'ADMIN';
export type WorkflowRole = 'INTAKE_OFFICER' | 'REVIEWER' | 'LEGAL_OFFICER' | 'FINANCIAL_OFFICER' | 'APPROVER';
export type DecisionType = 'APPROVED_STAGE' | 'REQUEST_INFO';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  system_role: SystemRole;
  must_change_password: boolean;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: string;
  applicant_user_id: string;
  name: string;
  registration_number: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface ApplicationType {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  document_requirements: DocumentRequirement[];
}

export interface DocumentRequirement {
  id: string;
  application_type_id: string;
  key: string;
  label: string;
  description?: string;
  is_required: boolean;
  allowed_mime_types?: string[];
  max_size_bytes: number;
  display_order: number;
}

export interface WorkflowTransition {
  id: string;
  workflow_id: string;
  from_state_key: string;
  to_state_key: string;
  required_role: string;
  requires_decision: boolean;
  label?: string;
}

export interface Application {
  id: string;
  application_type_id: string;
  applicant_id: string;
  workflow_id: string;
  current_state: string;
  reviewed_by?: string;
  version: number;
  current_submission_cycle: number;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  // joined
  type_name?: string;
  type_code?: string;
  applicant_name?: string;
  applicant_email?: string;
  reviewer_name?: string;
  available_transitions?: WorkflowTransition[];
  documents?: ApplicationDocument[];
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  requirement_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  uploaded_by: string;
  submission_cycle: number;
  superseded_by?: string;
  uploaded_at: string;
}

export interface StageDecision {
  id: string;
  application_id: string;
  workflow_state_key: string;
  reviewed_by: string;
  decision_type: DecisionType;
  decision_note: string;
  submission_cycle: number;
  created_at: string;
  reviewer_name?: string;
  reviewer_email?: string;
}

export interface TimelineEntry {
  type: 'STATE_TRANSITION' | 'STAGE_DECISION';
  from_state?: string;
  to_state?: string;
  stage?: string;
  decision_type?: DecisionType;
  decision_note?: string;
  actor?: { id: string; full_name: string };
  reviewer?: { id: string; full_name: string };
  cycle?: number;
  created_at: string;
}

export interface Workflow {
  id: string;
  application_type_id: string;
  name: string;
  description?: string;
  type_name?: string;
  type_code?: string;
}

export interface WorkflowState {
  id: string;
  workflow_id: string;
  key: string;
  label: string;
  description?: string;
  is_terminal: boolean;
  is_initial: boolean;
  display_order: number;
}

export interface WorkflowAssignment {
  id: string;
  user_id: string;
  workflow_id: string;
  role: WorkflowRole;
  assigned_at: string;
  full_name: string;
  email: string;
}

export interface UserWorkflowRole {
  id: string;
  user_id: string;
  workflow_id: string;
  role: WorkflowRole;
  assigned_by: string;
  assigned_at: string;
  workflow_name?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}
