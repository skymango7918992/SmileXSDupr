import { redirect } from "next/navigation";

export default function LegacyKhpaLoginRedirect() {
  redirect("/login?platform=khpa");
}
