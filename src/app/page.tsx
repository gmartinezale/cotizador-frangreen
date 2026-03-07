import { getSession } from "@/lib/dal";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  
  if (session) {
    redirect("/admin");
  } else {
    redirect("/login");
  }

  return <></>;
}
