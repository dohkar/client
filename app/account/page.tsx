import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

export default function AccountIndexPage() {
  redirect(ROUTES.accountListings);
}
