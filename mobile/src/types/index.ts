export type Role = "PATIENT" | "DOCTOR" | "CLINIC_ADMIN";

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  patientProfile?: { id: string } | null;
  doctorProfile?: { id: string } | null;
}

export interface DoctorProfile {
  id: string;
  specialty: string;
  bio?: string | null;
  clinic?: { id: string; name: string; address?: string | null } | null;
  user: { firstName: string; lastName: string; email?: string };
}

export interface PatientSummary {
  id: string;
  user: { firstName: string; lastName: string; email: string };
}

export type AppointmentStatus = "REQUESTED" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export interface Appointment {
  id: string;
  scheduledAt: string;
  durationMin: number;
  status: AppointmentStatus;
  reason?: string | null;
  doctor?: { id: string; specialty: string; user: { firstName: string; lastName: string } };
  patient?: { id: string; user: { firstName: string; lastName: string } };
}

export interface Diagnosis {
  id: string;
  icdCode?: string | null;
  description: string;
  severity?: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  mimeType: string;
  uploadedAt?: string;
  url?: string;
}

export interface TestOrder {
  id: string;
  testType: string;
  status: string;
  orderedAt: string;
  result?: { id: string; resultSummary?: string | null; documents: Document[] } | null;
}

export interface ImagingStudy {
  id: string;
  type: "XRAY" | "CT" | "MRI" | "ULTRASOUND" | "OTHER";
  bodyPart?: string | null;
  notes?: string | null;
  performedAt?: string | null;
  documents: Document[];
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  durationDays?: number | null;
  notes?: string | null;
}

export interface Visit {
  id: string;
  visitDate: string;
  chiefComplaint?: string | null;
  notes?: string | null;
  vitalsJson?: Record<string, unknown> | null;
  diagnoses: Diagnosis[];
  testOrders: TestOrder[];
  imagingStudies: ImagingStudy[];
  prescriptions: Prescription[];
}

export interface MedicalCase {
  id: string;
  title: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt?: string | null;
}

export interface Consent {
  id: string;
  doctorId?: string | null;
  clinicId?: string | null;
  scope: string;
  grantedAt: string;
  revokedAt?: string | null;
  doctor?: { id: string; specialty: string; user: { firstName: string; lastName: string } } | null;
}
