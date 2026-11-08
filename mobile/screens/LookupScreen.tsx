import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getRules, Rule } from "../api";
import ItemIllustration from "../components/ItemIllustration";

const BIN_TINTS: Record<Rule["bin"], string> = {
  recycle: "#DCEBFA",
  compost: "#DDEEE0",
  donate: "#EAE1F4",
  ewaste: "#FFE9D9",
  trash: "#E5E8EB",
  unknown: "#ffadad",
};

type Props = {
  onPick: (rule: Rule) => void;
  onBack: () => void;
  onInfo: () => void;
};

export default function LookupScreen({ onPick, onBack, onInfo }: Props) {
  const [query, setQuery] = useState("");
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getRules()
      .then((loadedRules) => {
        if (active) setRules(loadedRules);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Couldn't load items from the server.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const q = query.trim().toLowerCase();
  const shown = rules.filter(
    (r) =>
      !q ||
      r.item.toLowerCase().includes(q) ||
      r.tip.toLowerCase().includes(q) ||
      r.exceptions.some((e) => e.toLowerCase().includes(q)),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>Look it up</Text>
          <Text style={styles.subtitle}>Choose an item to see its disposal advice.</Text>
        </View>
        <Pressable onPress={onInfo} hitSlop={12}>
          <Text style={styles.about}>About</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search, e.g. bottle, pizza box, battery"
        placeholderTextColor="#849083"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <ScrollView style={styles.listScroll} contentContainerStyle={styles.list}>
        {loading ? (
          <ActivityIndicator color="#286B42" size="large" />
        ) : error ? (
          <View style={styles.status}>
            <Text style={styles.empty}>{error}</Text>
            <Pressable
              style={styles.retry}
              onPress={() => setReloadKey((key) => key + 1)}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : shown.length === 0 ? (
          <Text style={styles.empty}>No matches. When in doubt, throw it out.</Text>
        ) : (
          shown.map((item) => (
            <Pressable
              key={item.key ?? item.item}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => onPick(item)}
              accessibilityRole="button"
            >
              <ItemIllustration itemKey={item.key} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.item}</Text>
                <View style={[styles.binBadge, { backgroundColor: BIN_TINTS[item.bin] }]}>
                  <Text style={[styles.rowSub, { color: item.color }]}>{item.bin_label}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F8F0" },
  header: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  back: { color: "#286B42", fontSize: 16, fontWeight: "700", width: 60 },
  heading: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  title: { color: "#193B2A", fontSize: 21, fontWeight: "800" },
  subtitle: { color: "#758477", fontSize: 12, marginTop: 4, textAlign: "center" },
  about: { color: "#286B42", fontSize: 15, fontWeight: "700", width: 60, textAlign: "right" },
  search: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#274A31",
    backgroundColor: "#FAFDF8",
    borderWidth: 1,
    borderColor: "#DDE7D8",
    borderRadius: 16,
  },
  empty: { textAlign: "center", color: "#758477", marginTop: 40, paddingHorizontal: 24 },
  status: { alignItems: "center", gap: 16 },
  retry: { backgroundColor: "#286B42", borderRadius: 12, paddingVertical: 11, paddingHorizontal: 20 },
  retryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  listScroll: { flex: 1, width: "100%" },
  list: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FAFDF8",
    borderWidth: 1,
    borderColor: "#E3EBDD",
    borderRadius: 16,
    gap: 13,
  },
  rowPressed: { backgroundColor: "#E8F0E2", borderColor: "#C9DCC4" },
  rowTitle: { color: "#274A31", fontSize: 16, fontWeight: "700" },
  binBadge: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  rowSub: { fontSize: 12, fontWeight: "800" },
  chevron: { fontSize: 24, color: "#829482", paddingHorizontal: 4 },
});
