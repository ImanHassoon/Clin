import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PatientDashboardScreen } from "../screens/patient/PatientDashboardScreen";
import { FindDoctorScreen } from "../screens/patient/FindDoctorScreen";
import { BookAppointmentScreen } from "../screens/patient/BookAppointmentScreen";
import { MedicalRecordsScreen } from "../screens/patient/MedicalRecordsScreen";
import { RecordDetailScreen } from "../screens/patient/RecordDetailScreen";
import { PatientProfileScreen } from "../screens/patient/PatientProfileScreen";
import { ConsentScreen } from "../screens/patient/ConsentScreen";
import type {
  PatientDoctorsStackParamList,
  PatientHomeStackParamList,
  PatientProfileStackParamList,
  PatientRecordsStackParamList,
} from "./types";

const Tabs = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<PatientHomeStackParamList>();
const DoctorsStack = createNativeStackNavigator<PatientDoctorsStackParamList>();
const RecordsStack = createNativeStackNavigator<PatientRecordsStackParamList>();
const ProfileStack = createNativeStackNavigator<PatientProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="PatientDashboard" component={PatientDashboardScreen} options={{ title: "Home" }} />
    </HomeStack.Navigator>
  );
}

function DoctorsStackNavigator() {
  return (
    <DoctorsStack.Navigator>
      <DoctorsStack.Screen name="FindDoctor" component={FindDoctorScreen} options={{ title: "Find a doctor" }} />
      <DoctorsStack.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={{ title: "Book appointment" }}
      />
    </DoctorsStack.Navigator>
  );
}

function RecordsStackNavigator() {
  return (
    <RecordsStack.Navigator>
      <RecordsStack.Screen name="MedicalRecords" component={MedicalRecordsScreen} options={{ title: "My records" }} />
      <RecordsStack.Screen name="RecordDetail" component={RecordDetailScreen} options={{ title: "Visit" }} />
    </RecordsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="PatientProfile" component={PatientProfileScreen} options={{ title: "Profile" }} />
      <ProfileStack.Screen name="Consents" component={ConsentScreen} options={{ title: "Access" }} />
    </ProfileStack.Navigator>
  );
}

export function PatientNavigator() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Home" component={HomeStackNavigator} />
      <Tabs.Screen name="Doctors" component={DoctorsStackNavigator} />
      <Tabs.Screen name="Records" component={RecordsStackNavigator} />
      <Tabs.Screen name="Profile" component={ProfileStackNavigator} />
    </Tabs.Navigator>
  );
}
