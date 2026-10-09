import { Smartphone } from "lucide-react";
import { ServicePageHeader } from "@/components/dashboard/ServicePage";
import { RechargeForm } from "@/components/dashboard/RechargeForm";

export const dynamic = "force-dynamic";

export default function MobileRechargePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ServicePageHeader
        icon={Smartphone}
        title="Mobile Recharge"
        description="Recharge any prepaid number across India — instant confirmation, best cashback offers."
      />
      <RechargeForm
        serviceTitle="Mobile Recharge"
        type="MOBILE"
        numberLabel="Mobile number"
        numberPlaceholder="10-digit mobile"
        operators={["Jio", "Airtel", "Vi (Vodafone Idea)", "BSNL", "MTNL"]}
        refPrefix="MOB"
      />
    </div>
  );
}
