import { CRM } from "basics-os/src/components/atomic-crm/root/CRM";

/**
 * CRM as a sub-app for the Hub. Wraps the full CRM component.
 * Mounts at /crm in the Hub router. Uses basename so CRM routes are /crm/*.
 */
export const CRMApp = () => <CRM basename="/crm" />;
