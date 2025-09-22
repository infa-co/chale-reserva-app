import { ReactNode } from "react";
import { usePlanRestrictions } from "@/hooks/usePlanRestrictions";
import { PlanUpgradePrompt } from "./PlanUpgradePrompt";

interface FeatureRestrictionProps {
  children: ReactNode;
  feature: keyof import("@/hooks/usePlanRestrictions").PlanLimits;
  featureName: string;
  description?: string;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureRestriction = ({
  children,
  feature,
  featureName,
  description,
  fallback,
  showUpgradePrompt = true
}: FeatureRestrictionProps) => {
  const { checkFeatureAccess } = usePlanRestrictions();
  
  const hasAccess = checkFeatureAccess(feature);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showUpgradePrompt) {
    return (
      <PlanUpgradePrompt 
        feature={featureName}
        description={description}
        compact
      />
    );
  }
  
  return null;
};