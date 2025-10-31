import { useNavigate } from "react-router-dom";
import NetWorthSetupForm from "@/components/NetWorthSetupForm";

export default function InitialNetWorth() {
  const navigate = useNavigate();

  const handleComplete = () => {
    // Después de completar, ir a conexión bancaria
    navigate("/bank-connection");
  };

  return <NetWorthSetupForm onComplete={handleComplete} />;
}
