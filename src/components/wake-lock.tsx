"use client";

import { useWakeLock } from "react-screen-wake-lock";
import { Button } from "./ui/button";

export const WakeLockButton = () => {
  const { isSupported, released, request, release } = useWakeLock();

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant={released ? "outline" : undefined}
      onClick={() => (released === false ? release() : request())}
    >
      {released === false ? "Allow Lock Screen" : "Keep Screen On"}
    </Button>
  );
};
