import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ItemIllustration from "../components/ItemIllustration";
import { Nearby, Rule } from "../api";
import NearbySpots from "../components/NearbySpots";

export type ResultInfo = {
  rule: Rule;
  found: boolean; // false = the model detected nothing
  confident: boolean;
  confidence: number | null; // null when picked from manual lookup
  itemName?: string | null; // What the AI saw, e.g. "AA battery"
  nearby?: Nearby | null; // Drop-off spots from the scan; fetched on screen when missing
};

type Props = {
  result: ResultInfo;
  onScanAgain: () => void;
  onLookup: () => void;
  onInfo: () => void;
};

const BIN_TINTS: Record<string, string> = {
  recycle: "#DCEBFA",
  compost: "#DDEEE0",
  donate: "#EAE1F4",
  ewaste: "#FFE9D9",
  trash: "#E5E8EB",
  unknown: "#ffadad",
};

export default function ResultScreen({ result, onScanAgain, onLookup, onInfo }: Props) {
  const { rule, found, confident, confidence } = result;
  const insets = useSafeAreaInsets();

  let heading = rule.item;
  if (found && !confident) heading = `Probably ${rule.item.toLowerCase()}?`;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 32 }]}>
        <View style={styles.resultHeader}>
          <ItemIllustration
            itemKey={rule.key}
            size={84}
          />
          <View
            style={[
              styles.binBadge,
              { backgroundColor: BIN_TINTS[rule.bin] ?? "#DCEBD5", borderColor: rule.color },
            ]}
          >
            <View style={[styles.binDot, { backgroundColor: rule.color }]} />
            <Text style={styles.bin}>{rule.bin_label}</Text>
          </View>
          <Text style={styles.item}>{heading}</Text>
          {found && !!result.itemName && (
            <Text style={styles.confidence}>Looks like: {result.itemName}</Text>
          )}
          {confidence !== null && found && (
            <Text style={styles.confidence}>{Math.round(confidence * 100)}% sure</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.tip}>{rule.tip}</Text>
          {rule.exceptions.length > 0 && (
            <>
              <Text style={styles.watch}>A few things to keep in mind</Text>
              {rule.exceptions.map((e) => (
                <Text key={e} style={styles.exception}>
                  <Text style={styles.bullet}>• </Text>
                  {e}
                </Text>
              ))}
            </>
          )}
        </View>

        {found && <NearbySpots rule={rule} initial={result.nearby} />}

        {found && !confident && (
          <Text style={styles.unsure}>Not quite right? Look it up to choose the correct item.</Text>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.primary} onPress={onScanAgain}>
          <Text style={styles.primaryText}>{found ? "Scan another" : "Try again"}</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={onLookup}>
          <Text style={styles.secondaryText}>Look it up</Text>
        </Pressable>
        <Pressable onPress={onInfo}>
          <Text style={styles.infoLink}>About WasteLess</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F8F0" },
  content: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24, gap: 18 },
  resultHeader: {
    width: "100%",
    maxWidth: 700,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 28,
    backgroundColor: "#fafdf8",
    borderWidth: 1,
    borderColor: "#DDE7D8",
  },
  binBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 12,
  },
  binDot: { width: 12, height: 12, borderRadius: 6 },
  bin: { fontSize: 15, fontWeight: "800", color: "#193B2A", textAlign: "center" },
  item: { fontSize: 24, fontWeight: "800", color: "#193B2A", marginTop: 12, textAlign: "center" },
  confidence: {
    fontSize: 14,
    fontWeight: "700",
    color: "#31563B",
    backgroundColor: "#DCEBD5",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: "hidden",
  },
  card: {
    backgroundColor: "#fafdf8",
    width: "100%",
    maxWidth: 700,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E3EBDD",
    gap: 10,
  },
  tip: { fontSize: 18, color: "#274A31", lineHeight: 27 },
  watch: { fontSize: 13, fontWeight: "800", color: "#4D8158", marginTop: 10, letterSpacing: 0.6 },
  exception: { fontSize: 15, color: "#5D6E60", lineHeight: 22 },
  bullet: { color: "#4E8A50", fontWeight: "800" },
  unsure: { color: "#31563B", fontSize: 15, marginTop: 2, textAlign: "center" },
  actions: { paddingHorizontal: 24, gap: 10, width: "100%", maxWidth: 700, alignSelf: "center" },
  primary: { backgroundColor: "#286B42", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  primaryText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  secondary: {
    backgroundColor: "#E8F0E2",
    borderColor: "#C9DCC4",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: { fontSize: 16, fontWeight: "700", color: "#286B42" },
  infoLink: { color: "#4D8158", fontSize: 14, fontWeight: "700", textAlign: "center", paddingVertical: 6 },
});
