const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
    
  const commercialTypeId = uuidv4();
  const microfinanceTypeId = uuidv4();

 // Application Types

  await knex('application_types').insert([
    {
      id: commercialTypeId,
      name: 'Commercial Bank License',
      code: 'COMMERCIAL_BANK',
      description: 'License for commercial banking operations in Rwanda',
      is_active: true,
    },
    {
      id: microfinanceTypeId,
      name: 'Microfinance Institution License',
      code: 'MICROFINANCE',
      description: 'License for microfinance institution operations in Rwanda',
      is_active: true,
    },
  ]).onConflict('code').ignore();

  // fetch actual IDs in case they already existed
  const [commercialType, microfinanceType] = await Promise.all([
    knex('application_types').where({ code: 'COMMERCIAL_BANK' }).first(),
    knex('application_types').where({ code: 'MICROFINANCE' }).first(),
  ]);

  // Workflows

  let commercialWorkflow = await knex('workflows').where({ application_type_id: commercialType.id }).first();
  if (!commercialWorkflow) {
    const [wf] = await knex('workflows').insert({
      id: uuidv4(),
      application_type_id: commercialType.id,
      name: 'Commercial Bank Licensing Workflow',
      description: 'Full regulatory review workflow for commercial bank license applications',
    }).returning('*');
    commercialWorkflow = wf;
  }

  let microfinanceWorkflow = await knex('workflows').where({ application_type_id: microfinanceType.id }).first();
  if (!microfinanceWorkflow) {
    const [wf] = await knex('workflows').insert({
      id: uuidv4(),
      application_type_id: microfinanceType.id,
      name: 'Microfinance Institution Licensing Workflow',
      description: 'Simplified regulatory review workflow for microfinance institution applications',
    }).returning('*');
    microfinanceWorkflow = wf;
  }

  // Commercial Bank Workflow States
  const cbStates = [
    { key: 'DRAFT', label: 'Draft', is_initial: true, is_terminal: false, is_approved: false, display_order: 0 },
    { key: 'SUBMITTED', label: 'Submitted', is_initial: false, is_terminal: false, is_approved: false, display_order: 1 },
    { key: 'UNDER_INITIAL_REVIEW', label: 'Under Initial Review', is_initial: false, is_terminal: false, is_approved: false, display_order: 2 },
    { key: 'PENDING_INFORMATION', label: 'Pending Information', is_initial: false, is_terminal: false, is_approved: false, display_order: 3 },
    { key: 'UNDER_LEGAL_REVIEW', label: 'Under Legal Review', is_initial: false, is_terminal: false, is_approved: false, display_order: 4 },
    { key: 'UNDER_FINANCIAL_REVIEW', label: 'Under Financial Review', is_initial: false, is_terminal: false, is_approved: false, display_order: 5 },
    { key: 'PENDING_APPROVAL', label: 'Pending Approval', is_initial: false, is_terminal: false, is_approved: false, display_order: 6 },
    { key: 'APPROVED', label: 'Approved', is_initial: false, is_terminal: true, is_approved: true, display_order: 7 },
    { key: 'REJECTED', label: 'Rejected', is_initial: false, is_terminal: true, is_approved: false, display_order: 8 },
  ];

  for (const s of cbStates) {
    await knex('workflow_states').insert({
      id: uuidv4(),
      workflow_id: commercialWorkflow.id,
      ...s,
    }).onConflict(['workflow_id', 'key']).ignore();
  }

  // Microfinance Workflow States
  const mfStates = [
    { key: 'DRAFT', label: 'Draft', is_initial: true, is_terminal: false, is_approved: false, display_order: 0 },
    { key: 'SUBMITTED', label: 'Submitted', is_initial: false, is_terminal: false, is_approved: false, display_order: 1 },
    { key: 'UNDER_REVIEW', label: 'Under Review', is_initial: false, is_terminal: false, is_approved: false, display_order: 2 },
    { key: 'PENDING_INFORMATION', label: 'Pending Information', is_initial: false, is_terminal: false, is_approved: false, display_order: 3 },
    { key: 'PENDING_APPROVAL', label: 'Pending Approval', is_initial: false, is_terminal: false, is_approved: false, display_order: 4 },
    { key: 'APPROVED', label: 'Approved', is_initial: false, is_terminal: true, is_approved: true, display_order: 5 },
    { key: 'REJECTED', label: 'Rejected', is_initial: false, is_terminal: true, is_approved: false, display_order: 6 },
  ];

  for (const s of mfStates) {
    await knex('workflow_states').insert({
      id: uuidv4(),
      workflow_id: microfinanceWorkflow.id,
      ...s,
    }).onConflict(['workflow_id', 'key']).ignore();
  }

  // Commercial Bank Workflow Transitions
  const cbTransitions = [
    { from_state_key: 'DRAFT', to_state_key: 'SUBMITTED', required_role: 'APPLICANT', requires_decision: false, label: 'Submit Application' },
    { from_state_key: 'SUBMITTED', to_state_key: 'UNDER_INITIAL_REVIEW', required_role: 'INTAKE_OFFICER', requires_decision: false, label: 'Begin Initial Review' },
    { from_state_key: 'UNDER_INITIAL_REVIEW', to_state_key: 'PENDING_INFORMATION', required_role: 'INTAKE_OFFICER', requires_decision: true, label: 'Request More Information' },
    { from_state_key: 'PENDING_INFORMATION', to_state_key: 'SUBMITTED', required_role: 'APPLICANT', requires_decision: false, label: 'Resubmit Application' },
    { from_state_key: 'UNDER_INITIAL_REVIEW', to_state_key: 'UNDER_LEGAL_REVIEW', required_role: 'INTAKE_OFFICER', requires_decision: true, label: 'Forward to Legal Review' },
    { from_state_key: 'UNDER_LEGAL_REVIEW', to_state_key: 'UNDER_FINANCIAL_REVIEW', required_role: 'LEGAL_OFFICER', requires_decision: true, label: 'Forward to Financial Review' },
    { from_state_key: 'UNDER_FINANCIAL_REVIEW', to_state_key: 'PENDING_APPROVAL', required_role: 'FINANCIAL_OFFICER', requires_decision: true, label: 'Forward to Approval' },
    { from_state_key: 'PENDING_APPROVAL', to_state_key: 'APPROVED', required_role: 'APPROVER', requires_decision: true, label: 'Approve Application' },
    { from_state_key: 'PENDING_APPROVAL', to_state_key: 'REJECTED', required_role: 'APPROVER', requires_decision: true, label: 'Reject Application' },
  ];

  for (const t of cbTransitions) {
    await knex('workflow_transitions').insert({
      id: uuidv4(),
      workflow_id: commercialWorkflow.id,
      ...t,
    }).onConflict(['workflow_id', 'from_state_key', 'to_state_key']).ignore();
  }

  // Microfinance Workflow Transitions
  const mfTransitions = [
    { from_state_key: 'DRAFT', to_state_key: 'SUBMITTED', required_role: 'APPLICANT', requires_decision: false, label: 'Submit Application' },
    { from_state_key: 'SUBMITTED', to_state_key: 'UNDER_REVIEW', required_role: 'REVIEWER', requires_decision: false, label: 'Begin Review' },
    { from_state_key: 'UNDER_REVIEW', to_state_key: 'PENDING_INFORMATION', required_role: 'REVIEWER', requires_decision: true, label: 'Request More Information' },
    { from_state_key: 'PENDING_INFORMATION', to_state_key: 'SUBMITTED', required_role: 'APPLICANT', requires_decision: false, label: 'Resubmit Application' },
    { from_state_key: 'UNDER_REVIEW', to_state_key: 'PENDING_APPROVAL', required_role: 'REVIEWER', requires_decision: true, label: 'Forward to Approval' },
    { from_state_key: 'PENDING_APPROVAL', to_state_key: 'APPROVED', required_role: 'APPROVER', requires_decision: true, label: 'Approve Application' },
    { from_state_key: 'PENDING_APPROVAL', to_state_key: 'REJECTED', required_role: 'APPROVER', requires_decision: true, label: 'Reject Application' },
  ];

  for (const t of mfTransitions) {
    await knex('workflow_transitions').insert({
      id: uuidv4(),
      workflow_id: microfinanceWorkflow.id,
      ...t,
    }).onConflict(['workflow_id', 'from_state_key', 'to_state_key']).ignore();
  }

  // Document Requirements
  const cbDocs = [
    { key: 'application_form', label: 'Completed Application Form', description: 'Official BNR application form, fully completed and signed', is_required: true, allowed_mime_types: ['application/pdf'], display_order: 0 },
    { key: 'incorporation_certificate', label: 'Certificate of Incorporation', description: 'Certificate issued by Rwanda Development Board', is_required: true, allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png'], display_order: 1 },
    { key: 'audited_financials', label: 'Audited Financial Statements', description: 'Last 3 years audited financial statements', is_required: true, allowed_mime_types: ['application/pdf'], display_order: 2 },
    { key: 'business_plan', label: 'Business Plan', description: 'Comprehensive 5-year business plan', is_required: true, allowed_mime_types: ['application/pdf'], display_order: 3 },
    { key: 'shareholders_register', label: 'Shareholders Register', description: 'Complete list of all shareholders with ownership percentages', is_required: true, allowed_mime_types: ['application/pdf'], display_order: 4 },
    { key: 'fit_proper_forms', label: 'Fit and Proper Forms', description: 'Completed fit and proper forms for all key management personnel', is_required: false, allowed_mime_types: ['application/pdf'], display_order: 5 },
  ];

  for (const d of cbDocs) {
    await knex('document_requirements').insert({
      id: uuidv4(),
      application_type_id: commercialType.id,
      ...d,
      allowed_mime_types: knex.raw('?::TEXT[]', ['{' + d.allowed_mime_types.join(',') + '}']),
      max_size_bytes: 5242880,
    }).onConflict(['application_type_id', 'key']).ignore();
  }

  const mfDocs = [
    { key: 'application_form', label: 'Completed Application Form', description: 'Official BNR microfinance application form', is_required: true, allowed_mime_types: ['application/pdf'], display_order: 0 },
    { key: 'incorporation_certificate', label: 'Certificate of Incorporation', description: 'Certificate issued by Rwanda Development Board', is_required: true, allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png'], display_order: 1 },
    { key: 'business_plan', label: 'Business Plan', description: '3-year business plan for microfinance operations', is_required: true, allowed_mime_types: ['application/pdf'], display_order: 2 },
    { key: 'capital_proof', label: 'Proof of Capital', description: 'Evidence of minimum capital requirements', is_required: true, allowed_mime_types: ['application/pdf'], display_order: 3 },
  ];

  for (const d of mfDocs) {
    await knex('document_requirements').insert({
      id: uuidv4(),
      application_type_id: microfinanceType.id,
      ...d,
      allowed_mime_types: knex.raw('?::TEXT[]', ['{' + d.allowed_mime_types.join(',') + '}']),
      max_size_bytes: 5242880,
    }).onConflict(['application_type_id', 'key']).ignore();
  }

  // Users
  const passwordHash = await bcrypt.hash('Test1234!', 12);

  const usersToSeed = [
    { email: 'applicant@bnr.rw', full_name: 'Amina Mutesi', system_role: 'APPLICANT', phone: '+250780000001' },
    { email: 'intake@bnr.rw', full_name: 'Alice Uwimana', system_role: 'STAFF', phone: '+250780000002' },
    { email: 'legal@bnr.rw', full_name: 'Jean Hakizimana', system_role: 'STAFF', phone: '+250780000003' },
    { email: 'financial@bnr.rw', full_name: 'Grace Ingabire', system_role: 'STAFF', phone: '+250780000004' },
    { email: 'approver@bnr.rw', full_name: 'Robert Nkurunziza', system_role: 'STAFF', phone: '+250780000005' },
    { email: 'admin@bnr.rw', full_name: 'System Administrator', system_role: 'ADMIN', phone: '+250780000006' },
  ];

  for (const u of usersToSeed) {
    await knex('users').insert({
      id: uuidv4(),
      ...u,
      password_hash: passwordHash,
      must_change_password: false,
      is_active: true,
    }).onConflict('email').ignore();
  }

  // Fetch user IDs
  const users = {};
  for (const u of usersToSeed) {
    users[u.email] = await knex('users').where({ email: u.email }).first();
  }

  // Institution for applicant
  await knex('institutions').insert({
    id: uuidv4(),
    applicant_user_id: users['applicant@bnr.rw'].id,
    name: 'Rwanda Financial Services Ltd',
    registration_number: '120345678',
    phone: '+250780000000',
    address: 'Kigali, Rwanda',
  }).onConflict('applicant_user_id').ignore();

  // User Workflow Roles
  const adminUser = users['admin@bnr.rw'];
  const roleAssignments = [
    // Commercial Bank Workflow Roles
    { email: 'intake@bnr.rw', workflow_id: commercialWorkflow.id, role: 'INTAKE_OFFICER' },
    { email: 'legal@bnr.rw', workflow_id: commercialWorkflow.id, role: 'LEGAL_OFFICER' },
    { email: 'financial@bnr.rw', workflow_id: commercialWorkflow.id, role: 'FINANCIAL_OFFICER' },
    { email: 'approver@bnr.rw', workflow_id: commercialWorkflow.id, role: 'APPROVER' },

    // Microfinance Workflow Roles
    { email: 'intake@bnr.rw', workflow_id: microfinanceWorkflow.id, role: 'INTAKE_OFFICER' },
    { email: 'legal@bnr.rw', workflow_id: microfinanceWorkflow.id, role: 'REVIEWER' },
    { email: 'approver@bnr.rw', workflow_id: microfinanceWorkflow.id, role: 'APPROVER' },
  ];

  for (const ra of roleAssignments) {
    await knex('user_workflow_roles').insert({
      id: uuidv4(),
      user_id: users[ra.email].id,
      workflow_id: ra.workflow_id,
      role: ra.role,
      assigned_by: adminUser.id,
    }).onConflict(['user_id', 'workflow_id', 'role']).ignore();
  }

  // Seed Applications
  // Test App 001: Commercial Bank, PENDING_APPROVAL
  let app001 = await knex('applications').where({
    applicant_id: users['applicant@bnr.rw'].id,
    application_type_id: commercialType.id,
  }).first();

  if (!app001) {
    const [inserted] = await knex('applications').insert({
      id: uuidv4(),
      application_type_id: commercialType.id,
      applicant_id: users['applicant@bnr.rw'].id,
      workflow_id: commercialWorkflow.id,
      current_state: 'PENDING_APPROVAL',
      reviewed_by: users['intake@bnr.rw'].id,
      version: 4,
      current_submission_cycle: 1,
      submitted_at: knex.fn.now(),
    }).returning('*');
    app001 = inserted;

    // Stage decisions for app001
    const stageDecisions001 = [
      {
        application_id: app001.id,
        workflow_state_key: 'UNDER_INITIAL_REVIEW',
        reviewed_by: users['intake@bnr.rw'].id,
        decision_type: 'APPROVED_STAGE',
        decision_note: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque nec felis blandit, luctus enim at, congue turpis. Phasellus eget porta lacus. Cras auctor auctor rutrum. Pellentesque volutpat metus eget condimentum condimentum.',
        submission_cycle: 1,
      },
      {
        application_id: app001.id,
        workflow_state_key: 'UNDER_LEGAL_REVIEW',
        reviewed_by: users['legal@bnr.rw'].id,
        decision_type: 'APPROVED_STAGE',
        decision_note: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque nec felis blandit, luctus enim at, congue turpis. Phasellus eget porta lacus. Cras auctor auctor rutrum. Pellentesque volutpat metus eget condimentum condimentum',
        submission_cycle: 1,
      },
      {
        application_id: app001.id,
        workflow_state_key: 'UNDER_FINANCIAL_REVIEW',
        reviewed_by: users['financial@bnr.rw'].id,
        decision_type: 'APPROVED_STAGE',
        decision_note: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque nec felis blandit, luctus enim at, congue turpis. Phasellus eget porta lacus. Cras auctor auctor rutrum. Pellentesque volutpat metus eget condimentum condimentum',
        submission_cycle: 1,
      },
    ];

    for (const sd of stageDecisions001) {
      await knex('application_stage_reviews').insert({ id: uuidv4(), ...sd });
    }

    // Audit logs for app001
    const auditEntries001 = [
      { application_id: app001.id, acting_user_id: users['applicant@bnr.rw'].id, action: 'STATE_TRANSITION', from_state: 'DRAFT', to_state: 'SUBMITTED', metadata: JSON.stringify({ cycle: 1 }) },
      { application_id: app001.id, acting_user_id: users['intake@bnr.rw'].id, action: 'STATE_TRANSITION', from_state: 'SUBMITTED', to_state: 'UNDER_INITIAL_REVIEW', metadata: JSON.stringify({ cycle: 1 }) },
      { application_id: app001.id, acting_user_id: users['intake@bnr.rw'].id, action: 'STAGE_DECISION', from_state: 'UNDER_INITIAL_REVIEW', to_state: 'UNDER_LEGAL_REVIEW', metadata: JSON.stringify({ decision_type: 'APPROVED_STAGE', cycle: 1 }) },
      { application_id: app001.id, acting_user_id: users['legal@bnr.rw'].id, action: 'STAGE_DECISION', from_state: 'UNDER_LEGAL_REVIEW', to_state: 'UNDER_FINANCIAL_REVIEW', metadata: JSON.stringify({ decision_type: 'APPROVED_STAGE', cycle: 1 }) },
      { application_id: app001.id, acting_user_id: users['financial@bnr.rw'].id, action: 'STAGE_DECISION', from_state: 'UNDER_FINANCIAL_REVIEW', to_state: 'PENDING_APPROVAL', metadata: JSON.stringify({ decision_type: 'APPROVED_STAGE', cycle: 1 }) },
    ];

    for (const ae of auditEntries001) {
      await knex('audit_logs').insert({ id: uuidv4(), ...ae });
    }
  }

  // Test App 002: Microfinance, PENDING_INFORMATION
  let app002 = await knex('applications').where({
    applicant_id: users['applicant@bnr.rw'].id,
    application_type_id: microfinanceType.id,
  }).first();

  if (!app002) {
    const [inserted] = await knex('applications').insert({
      id: uuidv4(),
      application_type_id: microfinanceType.id,
      applicant_id: users['applicant@bnr.rw'].id,
      workflow_id: microfinanceWorkflow.id,
      current_state: 'PENDING_INFORMATION',
      reviewed_by: users['intake@bnr.rw'].id,
      version: 2,
      current_submission_cycle: 1,
      submitted_at: knex.fn.now(),
    }).returning('*');
    app002 = inserted;

    await knex('application_stage_reviews').insert({
      id: uuidv4(),
      application_id: app002.id,
      workflow_state_key: 'UNDER_REVIEW',
      reviewed_by: users['intake@bnr.rw'].id,
      decision_type: 'REQUEST_INFO',
      decision_note: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque nec felis blandit, luctus enim at, congue turpis. Phasellus eget porta lacus. Cras auctor auctor rutrum. Pellentesque volutpat metus eget condimentum condimentum',
      submission_cycle: 1,
    });

    const auditEntries002 = [
      { application_id: app002.id, acting_user_id: users['applicant@bnr.rw'].id, action: 'STATE_TRANSITION', from_state: 'DRAFT', to_state: 'SUBMITTED', metadata: JSON.stringify({ cycle: 1 }) },
      { application_id: app002.id, acting_user_id: users['intake@bnr.rw'].id, action: 'STATE_TRANSITION', from_state: 'SUBMITTED', to_state: 'UNDER_REVIEW', metadata: JSON.stringify({ cycle: 1 }) },
      { application_id: app002.id, acting_user_id: users['intake@bnr.rw'].id, action: 'STAGE_DECISION', from_state: 'UNDER_REVIEW', to_state: 'PENDING_INFORMATION', metadata: JSON.stringify({ decision_type: 'REQUEST_INFO', cycle: 1 }) },
    ];

    for (const ae of auditEntries002) {
      await knex('audit_logs').insert({ id: uuidv4(), ...ae });
    }
  }
};