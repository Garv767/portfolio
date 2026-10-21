import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import ProtectedRoute from "../src/components/Auth/ProtectedRoute";

const AdminDashboard = dynamic(
  () => import("../src/components/Admin/AdminDashboard"),
  {
    ssr: false,
  }
);

export default function AdminPage() {
  return (
    <>
      <Head>
        <title>Admin Dashboard & Resume Studio | Garv Rahut</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    </>
  );
}
