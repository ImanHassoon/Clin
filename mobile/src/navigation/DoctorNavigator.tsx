import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DoctorDashboardScreen } from "../screens/doctor/DoctorDashboardScreen";
import { PatientListScreen } from "../screens/doctor/PatientListScreen";
import { PatientDetailScreen } from "../screens/doctor/PatientDetailScreen";
import { CreateVisitScreen } from "../screens/doctor/CreateVisitScreen";
import { AddTestOrderScreen } from "../screens/doctor/AddTestOrderScreen";
import { UploadImagingScreen } from "../screens/doctor/UploadImagingScreen";
import { AppointmentsScreen } from "../screens/doctor/AppointmentsScreen";
import { DoctorProfileScreen } from "../screens/doctor/DoctorProfileScreen";
import type {
  DoctorAppointmentsStackParamList,
  DoctorHomeStackParamList,
  DoctorPatientsStackParamList,
  DoctorProfileStackParamList,
} from "./types";

const Tabs = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<DoctorHomeStackParamList>();
const PatientsStack = createNativeStackNavigator<DoctorPatientsStackParamList>();
const AppointmentsStack = createNativeStackNavigator<DoctorAppointmentsStackParamList>();
const ProfileStack = createNativeStackNavigator<DoctorProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} options={{ title: "Today" }} />
    </HomeStack.Navigator>
  );
}

function PatientsStackNavigator() {
  return (
    <PatientsStack.Navigator>
      <PatientsStack.Screen name="PatientList" component={PatientListScreen} options={{ title: "Patients" }} />
      <PatientsStack.Screen name="PatientDetail" component={PatientDetailScreen} />
      <PatientsStack.Screen name="CreateVisit" component={CreateVisitScreen} options={{ title: "New visit" }} />
      <PatientsStack.Screen name="AddTestOrder" component={AddTestOrderScreen} options={{ title: "Order test" }} />
      <PatientsStack.Screen
        name="UploadImaging"
        component={UploadImagingScreen}
        options={{ title: "Upload imaging" }}
      />
    </PatientsStack.Navigator>
  );
}

function AppointmentsStackNavigator() {
  return (
    <AppointmentsStack.Navigator>
      <AppointmentsStack.Screen name="Appointments" component={AppointmentsScreen} />
    </AppointmentsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="DoctorProfile" component={DoctorProfileScreen} options={{ title: "Profile" }} />
    </ProfileStack.Navigator>
  );
}

export function DoctorNavigator() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Home" component={HomeStackNavigator} />
      <Tabs.Screen name="Patients" component={PatientsStackNavigator} />
      <Tabs.Screen name="Appointments" component={AppointmentsStackNavigator} />
      <Tabs.Screen name="Profile" component={ProfileStackNavigator} />
    </Tabs.Navigator>
  );
}
