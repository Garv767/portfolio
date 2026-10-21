import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import Preloader from "../Pre";

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Still checking session — show preloader
  if (session === undefined) {
    return <Preloader load={true} />;
  }

  // Not logged in (in production) — redirect to login
  if (!session && process.env.NODE_ENV === "production") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
