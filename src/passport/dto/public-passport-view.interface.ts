export interface PublicLedgerEntryView {
  type: string;
  payload: Record<string, unknown>;
  prevHash: string;
  thisHash: string;
  signer: string;
  createdAt: string;
}

export interface PublicPassportView {
  serialNumber: string;
  verified: boolean;
  entries: PublicLedgerEntryView[];
}
