// The user's location, for finding the nearest drop-off spots. Works on web too.

import * as Location from "expo-location";

import { Coords } from "./api";

const TIMEOUT_MS = 10000;

/**
 * Current location, or null if it's unavailable or not allowed.
 * With `ask`, shows the permission prompt if the user hasn't answered it yet.
 */
export async function currentCoords(ask: boolean): Promise<Coords | null> {
  try {
    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted && ask && permission.canAskAgain) {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (!permission.granted) return null;

    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);
    return position ? { lat: position.coords.latitude, lon: position.coords.longitude } : null;
  } catch {
    return null;
  }
}
