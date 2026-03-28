import Link from "next/link";

interface AppCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

export default function AppCard({ title, description, href, icon }: AppCardProps) {
  return (
    <Link
      href={href}
      className="group block border border-border rounded-xl p-6 hover:border-washu-red/40 hover:shadow-md transition-all bg-white"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h2 className="text-lg font-semibold text-foreground group-hover:text-washu-red transition-colors">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>
    </Link>
  );
}
