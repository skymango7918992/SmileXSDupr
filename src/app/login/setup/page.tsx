import { MfaSetupForm } from "@/components/auth/mfa-setup-form";
import { getTrustedDeviceDays } from "@/lib/actions/trusted-device";

export default async function MfaSetupPage() {
  const trustedDeviceDays = await getTrustedDeviceDays();
  return <MfaSetupForm trustedDeviceDays={trustedDeviceDays} />;
}
