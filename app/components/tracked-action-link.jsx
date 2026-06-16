"use client";

import { useAttribution } from "./attribution-page";


export default function TrackedActionLink({
  href,
  eventType = "",
  metadata = {},
  preserveAttribution = true,
  onClick,
  children,
  ...props
}) {
  const { buildHref, emitEvent } = useAttribution();
  const resolvedHref = preserveAttribution ? buildHref(href) : href;

  return (
    <a
      {...props}
      href={resolvedHref}
      onClick={(event) => {
        if (onClick) {
          onClick(event);
        }
        if (event.defaultPrevented || !eventType) {
          return;
        }
        void emitEvent(eventType, {
          page: window.location.pathname,
          metadata: {
            target_href: href,
            ...metadata,
          },
        });
      }}
    >
      {children}
    </a>
  );
}
