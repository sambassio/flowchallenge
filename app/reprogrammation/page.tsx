import type { Metadata } from "next";
import { ReprogrammationForm } from "../components/ReprogrammationForm";

export const metadata: Metadata = {
  title: "Reprogrammation — Challenge Deepfocus & No Scroll",
  description:
    "Page quotidienne de reprogrammation mentale avec sauvegarde locale et reset journalier.",
};

export default function ReprogrammationPage() {
  return <ReprogrammationForm />;
}
