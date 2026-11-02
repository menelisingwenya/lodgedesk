import type { Enquiry } from "./data";

export const money = (value: number) =>
  "$" + value.toLocaleString("en-US", { maximumFractionDigits: 0 });

export const openEnquiries = (list: Enquiry[]) => list.filter((e) => e.status !== "closed");

export const handedOff = (list: Enquiry[]) => list.filter((e) => e.status === "handoff");

export const pricesToConfirm = (list: Enquiry[]) =>
  openEnquiries(list).filter((e) => e.total === null);

export const matchesQuery = (enquiry: Enquiry, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    enquiry.guest,
    enquiry.branch,
    enquiry.room,
    enquiry.preview,
    enquiry.ref,
    enquiry.status,
    enquiry.handoffReason ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
};
