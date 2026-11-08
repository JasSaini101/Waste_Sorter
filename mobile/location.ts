// The user's location, for finding the nearest drop-off spots.
//
// On web this talks to the browser's geolocation API directly instead of going through
// expo-location, whose web version breaks on many phones: it throws before asking when the
// browser has no Permissions API (older iPhones, in-app browsers), it never asks again once a
// site was marked "denied" (so turning location back on did nothing), and it reports every
// failure as "not allowed".

import * as Location from "expo-location";
import { Platform } from "react-native";

import { Coords } from "./api";

// How long to wait for a position once the user has said yes.
const TIMEOUT_MS = 12000;
// A position from the last 10 minutes is close enough for finding drop-off spots.
const MAX_AGE_MS = 10 * 60 * 1000;
// Backstop in case the browser never answers (e.g. a permission prompt left open).
const GIVE_UP_MS = 60000;

/** Why there's no location. Each one needs a different fix from the user. */
export type LocationProblem =
  | "denied" // The user or browser blocked location for this site
  | "unavailable" // Allowed, but the device couldn't find a position (location services off)
  | "timeout" // Allowed, but finding the position took too long
  | "unsupported" // This browser can't share location at all
  | "insecure" // The page isn't on https://, so browsers refuse
  | "not_asked"; // Not allowed yet, and the caller said not to prompt

export type Located = { coords: Coords; problem: null } | { coords: null; problem: LocationProblem };

/**
 * The user's location, or why it's missing.
 * With `ask`, shows the permission prompt if needed. Without it, only returns a location
 * that's already allowed, so scanning never pops up a prompt.
 */
export async function locate(ask: boolean): Promise<Located> {
  try {
    return Platform.OS === "web" ? await locateOnWeb(ask) : await locateOnDevice(ask);
  } catch {
    return { coords: null, problem: "unavailable" };
  }
}

/** Just the coordinates, or null. */
export async function currentCoords(ask: boolean): Promise<Coords | null> {
  return (await locate(ask)).coords;
}

/** How the user can fix each problem, shown under the server's note. */
export function locationHelp(problem: LocationProblem): string {
  switch (problem) {
    case "denied":
      return (
        "Location is blocked for this site. Tap the icon next to the web address (the lock, or " +
        "“aA” on iPhone), allow Location, then tap Use my location. On iPhone, also check " +
        "Settings → Privacy & Security → Location Services → Safari Websites. " +
        IN_APP_HINT
      );
    case "unavailable":
      return (
        "Your device couldn't find your location. Make sure Location Services is on for your " +
        "phone and your browser, then tap Use my location. " +
        IN_APP_HINT
      );
    case "timeout":
      return "Finding your location took too long. Tap Use my location to try again.";
    case "unsupported":
      return "This browser can't share your location. Open the site in Safari or Chrome instead.";
    case "insecure":
      return "Location only works on the https:// version of this site.";
    case "not_asked":
      return "Tap Use my location to see spots near you.";
  }
}

const IN_APP_HINT = "If you opened this link inside another app, open it in Safari or Chrome instead.";

async function locateOnWeb(ask: boolean): Promise<Located> {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return { coords: null, problem: "insecure" };
  }
  const geo = typeof navigator !== "undefined" ? navigator.geolocation : undefined;
  if (!geo) return { coords: null, problem: "unsupported" };

  if (!ask && !(await alreadyAllowedOnWeb())) {
    return { coords: null, problem: "not_asked" };
  }

  // Asking the browser directly shows the prompt when needed, and also picks up a permission
  // the user just turned back on in settings.
  return new Promise<Located>((resolve) => {
    const giveUp = setTimeout(() => resolve({ coords: null, problem: "timeout" }), GIVE_UP_MS);
    geo.getCurrentPosition(
      (position) => {
        clearTimeout(giveUp);
        resolve({
          coords: { lat: position.coords.latitude, lon: position.coords.longitude },
          problem: null,
        });
      },
      (error) => {
        clearTimeout(giveUp);
        const problem: LocationProblem =
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.TIMEOUT
              ? "timeout"
              : "unavailable";
        resolve({ coords: null, problem });
      },
      { enableHighAccuracy: false, timeout: TIMEOUT_MS, maximumAge: MAX_AGE_MS },
    );
  });
}

/** True only if the browser says location is already allowed. Never shows a prompt. */
async function alreadyAllowedOnWeb(): Promise<boolean> {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });
    return status?.state === "granted";
  } catch {
    return false; // No Permissions API: the result screen will ask instead.
  }
}

async function locateOnDevice(ask: boolean): Promise<Located> {
  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted && ask && permission.canAskAgain) {
    permission = await Location.requestForegroundPermissionsAsync();
  }
  if (!permission.granted) {
    return { coords: null, problem: ask || !permission.canAskAgain ? "denied" : "not_asked" };
  }
  if (!(await Location.hasServicesEnabledAsync())) return { coords: null, problem: "unavailable" };

  const position = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
  ]);
  return position
    ? { coords: { lat: position.coords.latitude, lon: position.coords.longitude }, problem: null }
    : { coords: null, problem: "timeout" };
}
