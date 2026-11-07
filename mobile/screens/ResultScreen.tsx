import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Rule } from "../api";

export type ResultInfo = {
  rule: Rule;
  found: boolean; // false = the model detected nothing
  confident: boolean;
  confidence: number | null; // null when picked from manual lookup
};

type Props = {
  result: ResultInfo;
  onScanAgain: () => void;
  onLookup: () => void;
};

const BIN_ICONS: Record<string, string> = {
  recycle: "♻️",
  compost: "🌱",
  donate: "👕",
  trash: "🗑️",
  unknown: "❓",
};

export default function ResultScreen({ result, onScanAgain, onLookup }: Props) {
  const { rule, found, confident, confidence } = result;
  const insets = useSafeAreaInsets();

  let heading = rule.item;
  if (found && !confident) heading = `Probably ${rule.item.toLowerCase()}?`;

  return (
    <View style={[styles.screen, { backgroundColor: rule.color }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 32 }]}>
        <Text style={styles.icon}>{BIN_ICONS[rule.bin] ?? "❓"}</Text>
        <Text style={styles.bin}>{rule.bin_label}</Text>
        <Text style={styles.item}>{heading}</Text>
        {confidence !== null && found && (
          <Text style={styles.confidence}>{Math.round(confidence * 100)}% sure</Text>
        )}

        <View style={styles.card}>
          <Text style={styles.tip}>{rule.tip}</Text>
          {rule.exceptions.length > 0 && (
            <>
              <Text style={styles.watch}>Watch out for</Text>
              {rule.exceptions.map((e) => (
                <Text key={e} style={styles.exception}>
                  • {e}
                </Text>
              ))}
            </>
          )}
        </View>

        {found && !confident && (
          <Text style={styles.unsure}>Not right? Look it up to pick the correct item.</Text>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.primary} onPress={onScanAgain}>
          <Text style={styles.primaryText}>{found ? "Scan another" : "Try again"}</Text>
        </Pressable>
        {(!found || !confident) && (
          <Pressable style={styles.secondary} onPress={onLookup}>
            <Text style={styles.secondaryText}>Look it up</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24 },
  icon: { fontSize: 72 },
  bin: { fontSize: 40, fontWeight: "800", color: "#fff", marginTop: 8, textAlign: "center" },
  item: { fontSize: 22, fontWeight: "600", color: "#fff", marginTop: 4, textAlign: "center" },
  confidence: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 28,
    alignSelf: "stretch",
    gap: 8,
  },
  tip: { fontSize: 18, color: "#111", lineHeight: 25 },
  watch: { fontSize: 14, fontWeight: "700", color: "#555", marginTop: 10, textTransform: "uppercase" },
  exception: { fontSize: 15, color: "#333", lineHeight: 21 },
  unsure: { color: "#fff", fontSize: 15, marginTop: 16, textAlign: "center" },
  actions: { paddingHorizontal: 24, gap: 10 },
  primary: { backgroundColor: "#fff", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  primaryText: { fontSize: 18, fontWeight: "700", color: "#111" },
  secondary: {
    borderColor: "#fff",
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: { fontSize: 17, fontWeight: "600", color: "#fff" },
});
