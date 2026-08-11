import { createClient } from "next-sanity";
export const client = createClient({
  projectId: "qm2xc1on",
  dataset: "production",
  apiVersion: "2026-05-15",
  useCdn: false,
});