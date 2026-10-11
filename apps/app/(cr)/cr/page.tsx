import { redirect } from "next/navigation";

export default function CrRootRedirect() {
  redirect("/cr/dashboard");
}
