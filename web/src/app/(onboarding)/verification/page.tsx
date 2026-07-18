import { getVerification } from "@/lib/server/account/account";
import { VerificationPanel } from "./verification-panel";

export default async function ProfileVerificationPage() {
  const verification = await getVerification();
  return <VerificationPanel verification={verification} />;
}
