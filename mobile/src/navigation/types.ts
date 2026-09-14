import type { Visit } from "../types";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type DoctorPatientsStackParamList = {
  PatientList: undefined;
  PatientDetail: { patientId: string; patientName: string };
  CreateVisit: { patientId: string; patientName: string };
  AddTestOrder: { visitId: string };
  UploadImaging: { visitId: string };
};

export type DoctorAppointmentsStackParamList = {
  Appointments: undefined;
};

export type DoctorHomeStackParamList = {
  DoctorDashboard: undefined;
};

export type DoctorProfileStackParamList = {
  DoctorProfile: undefined;
};

export type PatientHomeStackParamList = {
  PatientDashboard: undefined;
};

export type PatientDoctorsStackParamList = {
  FindDoctor: undefined;
  BookAppointment: { doctorId: string; doctorName: string; specialty: string };
};

export type PatientRecordsStackParamList = {
  MedicalRecords: undefined;
  RecordDetail: { visit: Visit };
};

export type PatientProfileStackParamList = {
  PatientProfile: undefined;
  Consents: undefined;
};
