import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { getNearby, Nearby, Rule } from "../api";
import { locate, LocationProblem, locationHelp } from "../location";

type Props = {
  rule: Rule;
  // From the scan response. Missing when the rule was picked on the lookup screen.
  initial?: Nearby | null;
};

/** Closest drop-off spots for e-waste, batteries and clothes, with a Google Maps fallback. */
export default function NearbySpots({ rule, initial }: Props) {
  const [nearby, setNearby] = useState<Nearby | null>(initial ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Why location is missing, so the user knows what to fix (blocked, turned off, too slow...).
  const [problem, setProblem] = useState<LocationProblem | null>(null);

  async function load() {
    if (!rule.key) return;
    setLoading(true);
    setError(null);
    try {
      // Shows the location prompt the first time. If the user says no, the server's
      // response carries a note asking them to enable it.
      const { coords, problem } = await locate(true);
      setProblem(problem);
      setNearby(await getNearby(rule.key, coords));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load drop-off spots.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // No list yet because the scan had no location: ask for it now that it's useful.
    if (rule.dropoff && (!initial || initial.needs_location)) load();
    // Only on first show of this result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!rule.dropoff) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nearest drop-off spots</Text>

      {loading && (
        <View style={styles.row}>
          <ActivityIndicator color="#555" />
          <Text style={styles.muted}>Finding spots near you…</Text>
        </View>
      )}

      {!loading &&
        nearby?.places.map((place) => (
          <Pressable
            key={`${place.name}|${place.address}`}
            style={styles.place}
            onPress={() => place.maps_url && Linking.openURL(place.maps_url)}
            accessibilityRole="link"
          >
            <View style={styles.placeText}>
              <Text style={styles.placeName}>{place.name}</Text>
              {!!place.address && <Text style={styles.muted}>{place.address}</Text>}
            </View>
            <Text style={styles.distance}>{place.distance_miles} mi</Text>
          </Pressable>
        ))}

      {!loading && nearby?.note && <Text style={styles.note}>{nearby.note}</Text>}
      {!loading && nearby?.needs_location && problem && (
        <Text style={styles.help}>{locationHelp(problem)}</Text>
      )}
      {!loading && error && <Text style={styles.note}>{error}</Text>}

      {!loading && (nearby?.needs_location || error) && (
        <Pressable onPress={load}>
          <Text style={styles.link}>Use my location</Text>
        </Pressable>
      )}

      {!loading && nearby && (
        <Pressable onPress={() => Linking.openURL(nearby.search_url)} accessibilityRole="link">
          <Text style={styles.link}>Search “{nearby.query}” on Google Maps ↗</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignSelf: "stretch",
    gap: 10,
  },
  title: { fontSize: 14, fontWeight: "700", color: "#555", textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  place: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  placeText: { flex: 1, gap: 2 },
  placeName: { fontSize: 16, fontWeight: "600", color: "#111" },
  distance: { fontSize: 15, fontWeight: "600", color: "#333" },
  muted: { fontSize: 14, color: "#666" },
  note: { fontSize: 15, color: "#333", fontStyle: "italic", lineHeight: 21 },
  help: { fontSize: 14, color: "#555", lineHeight: 20 },
  link: { fontSize: 15, color: "#2E7DD7", fontWeight: "600" },
});
