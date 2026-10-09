import Link from "next/link";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = Pick<ButtonProps, "variant" | "size" | "className" | "children" | "magnetic"> & {
  href: string;
  /** Extra classes for the wrapping anchor (e.g. `w-full`). */
  linkClassName?: string;
};

/**
 * A `next/link` that looks like our `Button`. The anchor is the single tab
 * stop (the inner button is removed from the tab order), so keyboard users
 * get one focusable element and Enter navigates.
 */
export function ButtonLink({ href, linkClassName, className, children, ...btn }: Props) {
  return (
    <Link
      href={href}
      className={cn("inline-flex rounded-2xl focus-energy", linkClassName)}
    >
      <Button tabIndex={-1} className={cn("w-full", className)} {...btn}>
        {children}
      </Button>
    </Link>
  );
}
