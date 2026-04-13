import fs from "fs";
import path from "path";
import ReadmeViewer from "./ReadmeViewer";

export const metadata = {
  title: "How It Works | WashU Medicine Test Applications",
  description: "Architecture and technical overview",
};

export default function HowItWorksPage() {
  const readmePath = path.join(process.cwd(), "README.md");
  const content = fs.readFileSync(readmePath, "utf-8");

  return <ReadmeViewer content={content} />;
}
