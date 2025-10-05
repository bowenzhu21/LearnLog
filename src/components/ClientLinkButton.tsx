"use client"

import { useRouter } from "next/navigation";

export default function ClientLinkButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className={className ?? "text-primary-600 hover:text-primary-700 font-medium"}
    >
      {children}
    </button>
  );
}
