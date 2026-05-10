const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "License Portal API",
    version: "1.0.0",
    description:
      "REST API for the licensing portal - manages applicants, license applications, document uploads, and multi-stage review workflows.",
    contact: {
      name: "Developer",
    },
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication and session management" },
    { name: "Applications", description: "License application lifecycle" },
    { name: "Application Types", description: "License type catalogue (admin)" },
    { name: "Document Requirements", description: "Per-type document rules (admin)" },
    { name: "Documents", description: "Application document uploads" },
    { name: "Users", description: "Staff user management (admin)" },
    { name: "Workflows", description: "Workflow configuration (admin)" },
    { name: "Health", description: "Service health" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "access_token",
        description: "JWT stored in an httpOnly cookie. Obtained via /api/auth/login or /api/auth/register.",
      },
    },
    schemas: {
      // Shared primitives
      UUID: {
        type: "string",
        format: "uuid",
        example: "550e8400-e29b-41d4-a716-446655440000",
      },
      Timestamp: {
        type: "string",
        format: "date-time",
        example: "2026-05-10T08:00:00.000Z",
      },
      SystemRole: {
        type: "string",
        enum: ["APPLICANT", "STAFF", "ADMIN"],
      },
      WorkflowRole: {
        type: "string",
        enum: ["APPLICANT", "INTAKE_OFFICER", "REVIEWER", "LEGAL_OFFICER", "FINANCIAL_OFFICER", "APPROVER"],
      },
      DecisionType: {
        type: "string",
        enum: ["APPROVED_STAGE", "REQUEST_INFO"],
      },
      ApplicationState: {
        type: "string",
        enum: [
          "SUBMITTED",
          "UNDER_INITIAL_REVIEW",
          "PENDING_INFORMATION",
          "UNDER_LEGAL_REVIEW",
          "UNDER_FINANCIAL_REVIEW",
          "UNDER_REVIEW",
          "PENDING_APPROVAL",
          "APPROVED",
          "REJECTED",
        ],
      },

      // Error envelope
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "email is required" },
            },
          },
        },
      },

      // User 
      User: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/UUID" },
          email: { type: "string", format: "email", example: "applicant@example.com" },
          full_name: { type: "string", example: "Alice Uwimana" },
          phone: { type: "string", nullable: true, example: "+250788000000" },
          system_role: { $ref: "#/components/schemas/SystemRole" },
          is_active: { type: "boolean", example: true },
          must_change_password: { type: "boolean", example: false },
          created_at: { $ref: "#/components/schemas/Timestamp" },
          updated_at: { $ref: "#/components/schemas/Timestamp" },
        },
      },
      UserWithRoles: {
        allOf: [
          { $ref: "#/components/schemas/User" },
          {
            type: "object",
            properties: {
              workflow_roles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    workflow_id: { $ref: "#/components/schemas/UUID" },
                    role: { $ref: "#/components/schemas/WorkflowRole" },
                  },
                },
              },
            },
          },
        ],
      },

      // Institution
      Institution: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/UUID" },
          name: { type: "string", example: "Kigali Finance Ltd" },
          registration_number: { type: "string", example: "RCA-2023-001" },
        },
      },

      // Application Type
      ApplicationType: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/UUID" },
          name: { type: "string", example: "Microfinance License" },
          code: { type: "string", example: "MFL" },
          description: { type: "string", nullable: true, example: "License for MFIs" },
          is_active: { type: "boolean", example: true },
          created_at: { $ref: "#/components/schemas/Timestamp" },
        },
      },

      // Document Requirement
      DocumentRequirement: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/UUID" },
          application_type_id: { $ref: "#/components/schemas/UUID" },
          key: { type: "string", example: "business_registration" },
          label: { type: "string", example: "Business Registration Certificate" },
          description: { type: "string", nullable: true },
          is_required: { type: "boolean", example: true },
          allowed_mime_types: {
            type: "array",
            nullable: true,
            items: { type: "string" },
            example: ["application/pdf", "image/jpeg"],
          },
          max_size_bytes: { type: "integer", example: 5242880 },
          display_order: { type: "integer", example: 0 },
        },
      },

      // Application
      Application: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/UUID" },
          application_type_id: { $ref: "#/components/schemas/UUID" },
          applicant_id: { $ref: "#/components/schemas/UUID" },
          workflow_id: { $ref: "#/components/schemas/UUID" },
          current_state: { $ref: "#/components/schemas/ApplicationState" },
          version: { type: "integer", example: 1 },
          submitted_at: { $ref: "#/components/schemas/Timestamp" },
          created_at: { $ref: "#/components/schemas/Timestamp" },
          updated_at: { $ref: "#/components/schemas/Timestamp" },
        },
      },
      ApplicationList: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Application" },
          },
          total: { type: "integer", example: 42 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
        },
      },

      // Stage Decision
      StageDecision: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/UUID" },
          application_id: { $ref: "#/components/schemas/UUID" },
          reviewed_by: { $ref: "#/components/schemas/UUID" },
          decision_type: { $ref: "#/components/schemas/DecisionType" },
          decision_note: { type: "string", nullable: true },
          created_at: { $ref: "#/components/schemas/Timestamp" },
        },
      },

      // Document
      Document: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/UUID" },
          application_id: { $ref: "#/components/schemas/UUID" },
          requirement_key: { type: "string", example: "business_registration" },
          file_path: { type: "string", example: "uploads/abc123.pdf" },
          uploaded_by: { $ref: "#/components/schemas/UUID" },
          created_at: { $ref: "#/components/schemas/Timestamp" },
        },
      },

      // Workflow
      Workflow: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/UUID" },
          application_type_id: { $ref: "#/components/schemas/UUID" },
          name: { type: "string", example: "MFI License Review" },
          description: { type: "string", nullable: true },
          created_at: { $ref: "#/components/schemas/Timestamp" },
        },
      },
      WorkflowState: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/UUID" },
          workflow_id: { $ref: "#/components/schemas/UUID" },
          key: { type: "string", example: "UNDER_INITIAL_REVIEW" },
          label: { type: "string", example: "Initial Review" },
          description: { type: "string", nullable: true },
          is_initial: { type: "boolean", example: false },
          is_terminal: { type: "boolean", example: false },
          display_order: { type: "integer", example: 1 },
        },
      },
      WorkflowTransition: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/UUID" },
          workflow_id: { $ref: "#/components/schemas/UUID" },
          from_state_key: { type: "string", example: "SUBMITTED" },
          to_state_key: { type: "string", example: "UNDER_INITIAL_REVIEW" },
          required_role: { $ref: "#/components/schemas/WorkflowRole" },
          requires_decision: { type: "boolean", example: true },
          label: { type: "string", nullable: true, example: "Start Review" },
        },
      },

      // Request bodies
      RegisterBody: {
        type: "object",
        required: ["email", "password", "full_name", "institution_name", "institution_registration_number"],
        properties: {
          email: { type: "string", format: "email", example: "applicant@example.com" },
          password: {
            type: "string",
            minLength: 8,
            example: "Secure1234",
            description: "Min 8 chars, at least one uppercase letter and one digit",
          },
          full_name: { type: "string", minLength: 2, maxLength: 100, example: "Alice Uwimana" },
          phone: { type: "string", nullable: true, example: "+250788000000" },
          institution_name: { type: "string", minLength: 2, maxLength: 200, example: "Kigali Finance Ltd" },
          institution_registration_number: {
            type: "string",
            minLength: 2,
            maxLength: 100,
            example: "RCA-2023-001",
          },
        },
      },
      LoginBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "applicant@example.com" },
          password: { type: "string", example: "Secure1234" },
        },
      },
      ChangePasswordBody: {
        type: "object",
        required: ["new_password"],
        properties: {
          current_password: { type: "string", nullable: true, example: "OldPass1" },
          new_password: {
            type: "string",
            minLength: 8,
            example: "NewPass5678",
            description: "Min 8 chars, at least one uppercase letter and one digit",
          },
        },
      },
      CreateApplicationBody: {
        type: "object",
        required: ["application_type_id"],
        properties: {
          application_type_id: { $ref: "#/components/schemas/UUID" },
        },
      },
      StageDecisionBody: {
        type: "object",
        required: ["toState"],
        properties: {
          toState: { $ref: "#/components/schemas/ApplicationState" },
          decisionType: { $ref: "#/components/schemas/DecisionType" },
          decisionNote: { type: "string", nullable: true, example: "Approved initial review." },
        },
      },
      CreateApplicationTypeBody: {
        type: "object",
        required: ["name", "code"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100, example: "Microfinance License" },
          code: { type: "string", minLength: 1, maxLength: 20, example: "MFL", description: "Auto-uppercased" },
          description: { type: "string", nullable: true, example: "License for MFIs" },
          is_active: { type: "boolean", default: true },
        },
      },
      UpdateApplicationTypeBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          code: { type: "string", minLength: 1, maxLength: 20 },
          description: { type: "string", nullable: true },
          is_active: { type: "boolean" },
        },
      },
      CreateDocRequirementBody: {
        type: "object",
        required: ["key", "label"],
        properties: {
          key: { type: "string", minLength: 1, maxLength: 100, example: "business_registration" },
          label: { type: "string", minLength: 1, maxLength: 200, example: "Business Registration Certificate" },
          description: { type: "string", nullable: true },
          is_required: { type: "boolean", default: true },
          allowed_mime_types: {
            type: "array",
            nullable: true,
            items: { type: "string" },
            example: ["application/pdf", "image/jpeg"],
          },
          max_size_bytes: { type: "integer", default: 5242880, example: 5242880 },
          display_order: { type: "integer", minimum: 0, default: 0 },
        },
      },
      UpdateDocRequirementBody: {
        type: "object",
        properties: {
          key: { type: "string", minLength: 1, maxLength: 100 },
          label: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", nullable: true },
          is_required: { type: "boolean" },
          allowed_mime_types: { type: "array", nullable: true, items: { type: "string" } },
          max_size_bytes: { type: "integer" },
          display_order: { type: "integer", minimum: 0 },
        },
      },
      CreateUserBody: {
        type: "object",
        required: ["email", "full_name"],
        properties: {
          email: { type: "string", format: "email", example: "officer@bnr.rw" },
          full_name: { type: "string", minLength: 2, maxLength: 100, example: "Bob Nkurunziza" },
          phone: { type: "string", nullable: true, example: "+250788111222" },
          workflow_roles: {
            type: "array",
            default: [],
            items: {
              type: "object",
              required: ["workflow_id", "role"],
              properties: {
                workflow_id: { $ref: "#/components/schemas/UUID" },
                role: { $ref: "#/components/schemas/WorkflowRole" },
              },
            },
          },
        },
      },
      UpdateUserStatusBody: {
        type: "object",
        required: ["is_active"],
        properties: {
          is_active: { type: "boolean", example: false },
        },
      },
      CreateWorkflowBody: {
        type: "object",
        required: ["application_type_id", "name"],
        properties: {
          application_type_id: { $ref: "#/components/schemas/UUID" },
          name: { type: "string", minLength: 1, maxLength: 100, example: "MFI License Review" },
          description: { type: "string", nullable: true },
        },
      },
      UpdateWorkflowBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          description: { type: "string", nullable: true },
        },
      },
      CreateWorkflowStateBody: {
        type: "object",
        required: ["key", "label"],
        properties: {
          key: { type: "string", minLength: 1, maxLength: 100, example: "UNDER_INITIAL_REVIEW", description: "Auto-uppercased" },
          label: { type: "string", minLength: 1, maxLength: 200, example: "Initial Review" },
          description: { type: "string", nullable: true },
          is_initial: { type: "boolean", default: false },
          is_terminal: { type: "boolean", default: false },
          display_order: { type: "integer", minimum: 0, default: 0 },
        },
      },
      UpdateWorkflowStateBody: {
        type: "object",
        properties: {
          key: { type: "string", minLength: 1, maxLength: 100 },
          label: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", nullable: true },
          is_initial: { type: "boolean" },
          is_terminal: { type: "boolean" },
          display_order: { type: "integer", minimum: 0 },
        },
      },
      CreateWorkflowTransitionBody: {
        type: "object",
        required: ["from_state_key", "to_state_key", "required_role"],
        properties: {
          from_state_key: { type: "string", minLength: 1, maxLength: 100, example: "SUBMITTED" },
          to_state_key: { type: "string", minLength: 1, maxLength: 100, example: "UNDER_INITIAL_REVIEW" },
          required_role: { $ref: "#/components/schemas/WorkflowRole" },
          requires_decision: { type: "boolean", default: false },
          label: { type: "string", nullable: true, example: "Start Review" },
        },
      },
      UpdateWorkflowTransitionBody: {
        type: "object",
        properties: {
          from_state_key: { type: "string", minLength: 1, maxLength: 100 },
          to_state_key: { type: "string", minLength: 1, maxLength: 100 },
          required_role: { $ref: "#/components/schemas/WorkflowRole" },
          requires_decision: { type: "boolean" },
          label: { type: "string", nullable: true },
        },
      },
    },

    // Reusable responses
    responses: {
      Unauthorized: {
        description: "Missing or invalid authentication cookie",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: { code: "UNAUTHORIZED", message: "Authentication required" },
            },
          },
        },
      },
      Forbidden: {
        description: "Authenticated but lacks required role",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: { code: "FORBIDDEN", message: "Insufficient permissions" },
            },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: { code: "NOT_FOUND", message: "Resource not found" },
            },
          },
        },
      },
      ValidationError: {
        description: "Request body failed schema validation",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: { code: "VALIDATION_ERROR", message: "\"email\" is required" },
            },
          },
        },
      },
      Conflict: {
        description: "Resource already exists",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: { code: "CONFLICT", message: "Email already in use" },
            },
          },
        },
      },
    },

    // Reusable parameters
    parameters: {
      Id: {
        name: "id",
        in: "path",
        required: true,
        schema: { $ref: "#/components/schemas/UUID" },
        description: "Resource UUID",
      },
      TypeId: {
        name: "typeId",
        in: "path",
        required: true,
        schema: { $ref: "#/components/schemas/UUID" },
        description: "Application type UUID",
      },
      RequirementKey: {
        name: "requirement_key",
        in: "path",
        required: true,
        schema: { type: "string" },
        example: "business_registration",
        description: "Document requirement key",
      },
      PageQuery: {
        name: "page",
        in: "query",
        schema: { type: "integer", minimum: 1, default: 1 },
        description: "Page number",
      },
      LimitQuery: {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        description: "Items per page",
      },
      CycleQuery: {
        name: "cycle",
        in: "query",
        schema: { type: "integer", minimum: 1 },
        description: "Submission cycle (for document history filtering)",
      },
    },
  },

  security: [{ cookieAuth: [] }],

  paths: {
    // Health
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        security: [],
        responses: {
          200: {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    uptime: { type: "number", example: 3600.5 },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Authentication and session management
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register applicant",
        description: "Creates an APPLICANT account and their institution record. Sets auth cookies on success.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Account created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          409: { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description: "Authenticates user credentials. Sets access_token and refresh_token cookies. If `must_change_password` is true, the response omits the user object and the client must redirect to password change.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Authenticated",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    {
                      title: "Normal login",
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        data: {
                          type: "object",
                          properties: { user: { $ref: "#/components/schemas/User" } },
                        },
                      },
                    },
                    {
                      title: "Must change password",
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        data: {
                          type: "object",
                          properties: {
                            must_change_password: { type: "boolean", example: true },
                            user_id: { $ref: "#/components/schemas/UUID" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        description: "Uses the refresh_token cookie to issue a new access_token cookie. No request body required.",
        security: [],
        responses: {
          200: {
            description: "Token refreshed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean", example: true } },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        description: "Clears auth cookies.",
        security: [],
        responses: {
          200: {
            description: "Logged out",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: { message: { type: "string", example: "Logged out" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        responses: {
          200: {
            description: "Current authenticated user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: { user: { $ref: "#/components/schemas/User" } },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Change password",
        description: "Resets the caller's password. `current_password` may be omitted if the account was just created by an admin (must_change_password flow).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Password updated, new tokens set in cookies",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: { user: { $ref: "#/components/schemas/User" } },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // Application Types
    "/api/application-types": {
      get: {
        tags: ["Application Types"],
        summary: "List application types",
        description: "Available to all authenticated users.",
        responses: {
          200: {
            description: "List of application types",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ApplicationType" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Application Types"],
        summary: "Create application type",
        description: "Requires ADMIN role.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateApplicationTypeBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/ApplicationType" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/application-types/{id}": {
      get: {
        tags: ["Application Types"],
        summary: "Get application type by ID",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "Application type detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/ApplicationType" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Application Types"],
        summary: "Update application type",
        description: "Requires ADMIN role. All fields optional (partial update).",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateApplicationTypeBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/ApplicationType" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Application Types"],
        summary: "Delete application type",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "Deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean", example: true } },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/application-types/{typeId}/document-requirements": {
      post: {
        tags: ["Application Types"],
        summary: "Add document requirement to application type",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/TypeId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateDocRequirementBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Requirement created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/DocumentRequirement" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // Document Requirements
    "/api/document-requirements/{id}": {
      patch: {
        tags: ["Document Requirements"],
        summary: "Update document requirement",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateDocRequirementBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/DocumentRequirement" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Document Requirements"],
        summary: "Delete document requirement",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "Deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean", example: true } },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // Applications
    "/api/applications": {
      post: {
        tags: ["Applications"],
        summary: "Submit new application",
        description: "Requires APPLICANT role. Creates a new license application in the initial workflow state.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateApplicationBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Application created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Application" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      get: {
        tags: ["Applications"],
        summary: "List applications",
        description: "APPLICANT sees only their own. STAFF/ADMIN see all.",
        parameters: [
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/LimitQuery" },
        ],
        responses: {
          200: {
            description: "Paginated application list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApplicationList" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/applications/{id}": {
      get: {
        tags: ["Applications"],
        summary: "Get application by ID",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "Application detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Application" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/applications/{id}/stage-decision": {
      post: {
        tags: ["Applications"],
        summary: "Advance application state",
        description: "Performs a workflow transition. Caller must hold the required workflow role for the transition. `decisionType` is required when the transition has `requires_decision: true`.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StageDecisionBody" },
              examples: {
                approve: {
                  summary: "Approve to next stage",
                  value: {
                    toState: "UNDER_LEGAL_REVIEW",
                    decisionType: "APPROVED_STAGE",
                    decisionNote: "Documents verified.",
                  },
                },
                request_info: {
                  summary: "Request more information",
                  value: {
                    toState: "PENDING_INFORMATION",
                    decisionType: "REQUEST_INFO",
                    decisionNote: "Please resubmit balance sheet.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Transition applied",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Application" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          422: {
            description: "Transition not allowed from current state",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: {
                    code: "UNPROCESSABLE",
                    message: "No valid transition to APPROVED from SUBMITTED",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/applications/{id}/timeline": {
      get: {
        tags: ["Applications"],
        summary: "Get application timeline",
        description: "Returns the ordered list of workflow states the application has passed through.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "Workflow timeline",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          state_key: { type: "string", example: "SUBMITTED" },
                          label: { type: "string", example: "Submitted" },
                          entered_at: { $ref: "#/components/schemas/Timestamp" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/applications/{id}/stage-decisions": {
      get: {
        tags: ["Applications"],
        summary: "Get stage decisions for an application",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "Stage decision history",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/StageDecision" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // Documents
    "/api/applications/{id}/documents": {
      get: {
        tags: ["Documents"],
        summary: "List documents for an application",
        parameters: [
          { $ref: "#/components/parameters/Id" },
          { $ref: "#/components/parameters/CycleQuery" },
        ],
        responses: {
          200: {
            description: "Document list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Document" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/applications/{id}/documents/{requirement_key}": {
      post: {
        tags: ["Documents"],
        summary: "Upload document",
        description: "Multipart file upload for a specific document requirement. The file field name must be `file`.",
        parameters: [
          { $ref: "#/components/parameters/Id" },
          { $ref: "#/components/parameters/RequirementKey" },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "File to upload. MIME type and size are validated against the document requirement.",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Document uploaded",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Document" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/applications/{id}/documents/{requirement_key}/history": {
      get: {
        tags: ["Documents"],
        summary: "Get document upload history",
        description: "Returns all past uploads for a given requirement key on this application.",
        parameters: [
          { $ref: "#/components/parameters/Id" },
          { $ref: "#/components/parameters/RequirementKey" },
        ],
        responses: {
          200: {
            description: "Upload history",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Document" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // Users
    "/api/users": {
      post: {
        tags: ["Users"],
        summary: "Create staff user",
        description: "Requires ADMIN role. Creates a STAFF account with optional workflow role assignments. A temporary password is generated; user must change it on first login.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserBody" },
            },
          },
        },
        responses: {
          201: {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/UserWithRoles" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
        },
      },
      get: {
        tags: ["Users"],
        summary: "List staff users",
        description: "Requires ADMIN role.",
        parameters: [
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/LimitQuery" },
        ],
        responses: {
          200: {
            description: "Paginated user list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    result: {
                      type: "object",
                      properties: {
                        items: {
                          type: "array",
                          items: { $ref: "#/components/schemas/User" },
                        },
                        total: { type: "integer", example: 15 },
                        page: { type: "integer", example: 1 },
                        limit: { type: "integer", example: 20 },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/users/workflow-roles/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user workflow roles",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "User with workflow roles",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/UserWithRoles" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/users/{id}/status": {
      patch: {
        tags: ["Users"],
        summary: "Update user active status",
        description: "Requires ADMIN role. Activates or deactivates a user account.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserStatusBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Status updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // Workflows
    "/api/workflows": {
      get: {
        tags: ["Workflows"],
        summary: "List workflows",
        description: "Requires ADMIN role.",
        responses: {
          200: {
            description: "All workflows",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Workflow" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Workflows"],
        summary: "Create workflow",
        description: "Requires ADMIN role.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateWorkflowBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Workflow created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Workflow" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/workflows/{id}": {
      patch: {
        tags: ["Workflows"],
        summary: "Update workflow",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateWorkflowBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Workflow" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Workflows"],
        summary: "Delete workflow",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "Deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean", example: true } },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/workflows/{id}/states": {
      get: {
        tags: ["Workflows"],
        summary: "List workflow states",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "States for the workflow",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/WorkflowState" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      post: {
        tags: ["Workflows"],
        summary: "Add state to workflow",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateWorkflowStateBody" },
            },
          },
        },
        responses: {
          201: {
            description: "State created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/WorkflowState" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/workflow-states/{id}": {
      patch: {
        tags: ["Workflows"],
        summary: "Update workflow state",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateWorkflowStateBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/WorkflowState" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Workflows"],
        summary: "Delete workflow state",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "Deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean", example: true } },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/workflows/{id}/transitions": {
      get: {
        tags: ["Workflows"],
        summary: "List workflow transitions",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "Transitions for the workflow",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/WorkflowTransition" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      post: {
        tags: ["Workflows"],
        summary: "Add transition to workflow",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateWorkflowTransitionBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Transition created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/WorkflowTransition" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/workflows/workflow-transitions/{id}": {
      patch: {
        tags: ["Workflows"],
        summary: "Update workflow transition",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateWorkflowTransitionBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/WorkflowTransition" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Workflows"],
        summary: "Delete workflow transition",
        description: "Requires ADMIN role.",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: {
          200: {
            description: "Deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean", example: true } },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
