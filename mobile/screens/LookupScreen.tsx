import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getRules, Rule } from "../api";

type Props = {
  onPick: (rule: Rule) => void;
  onBack: () => void;
  onInfo: () => void;
};

export default function LookupScreen({ onPick, onBack, onInfo }: Props) {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();

  function load() {
    setError(null);
    getRules()
      .then(setRules)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load the list."));
  }

  useEffect(load, []);

  const q = query.trim().toLowerCase();
  const shown = (rules ?? []).filter(
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
          <Text style={styles.back}>‹ Scan</Text>
        </Pressable>
        <Text style={styles.title}>Look it up</Text>
        <Pressable onPress={onInfo} hitSlop={12}>
          <Text style={styles.about}>About</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search, e.g. bottle, pizza box, battery"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      ) : !rules ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(r) => r.key ?? r.item}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No matches. When in doubt, throw it out.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => onPick(item)}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.item}</Text>
                <Text style={styles.rowSub}>{item.bin_label}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  back: { color: "#2E7DD7", fontSize: 18, width: 60 },
  title: { fontSize: 20, fontWeight: "700" },
  about: { color: "#2E7DD7", fontSize: 16, fontWeight: "600", width: 60, textAlign: "right" },
  search: {
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#F1F2F4",
    borderRadius: 12,
  },
  center: { alignItems: "center", marginTop: 40, gap: 12, paddingHorizontal: 24 },
  error: { color: "#B42318", fontSize: 16, textAlign: "center" },
  retry: { color: "#2E7DD7", fontSize: 16, fontWeight: "600" },
  empty: { textAlign: "center", color: "#666", marginTop: 40, paddingHorizontal: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    gap: 14,
  },
  dot: { width: 18, height: 18, borderRadius: 9 },
  rowTitle: { fontSize: 17, fontWeight: "600" },
  rowSub: { fontSize: 14, color: "#666", marginTop: 2 },
  chevron: { fontSize: 24, color: "#bbb" },
});
