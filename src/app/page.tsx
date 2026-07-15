import { LostLamportsApp } from "@/components/LostLamportsApp";
import { getTotalRecoveredSol } from "./actions";

export default async function Home() {
  const totalRecovered = await getTotalRecoveredSol();

  return (
    <LostLamportsApp initialTotalRecovered={totalRecovered} />
  );
}
