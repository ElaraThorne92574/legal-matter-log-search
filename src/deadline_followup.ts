export type MatterIntake = {
  matterId: string;
  clientName: string;
  signedDocumentDelivered: boolean;
  deadline: string;
};

export function shouldFollowUp(matter: MatterIntake, today: string): boolean {
  if (!matter.signedDocumentDelivered) return false;
  const days = (Date.parse(matter.deadline) - Date.parse(today)) / 86_400_000;
  return days >= 0 && days <= 3;
}
