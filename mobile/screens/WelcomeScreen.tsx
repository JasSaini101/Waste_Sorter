import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onBack: () => void;
};

export default function WelcomeScreen({ onBack }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 900;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.page,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <View style={styles.brandMark}>
          <Text style={styles.brandLeaf}>✳</Text>
        </View>
        <Text style={styles.brandName}>WasteLess</Text>
      </View>

      <View style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.copy, compact && styles.copyCompact]}>
          <Text style={styles.eyebrow}>A SIMPLE GUIDE TO SORTING BETTER</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>
            Good choices{"\n"}
            <Text style={styles.titleAccent}>(don't) go to waste.</Text>
          </Text>
          <Text style={[styles.description, compact && styles.descriptionCompact]}>
            WasteLess helps you figure out what to do with everyday items. Scan something for a
            quick identification, or browse the guide when you already know what you're sorting.
          </Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Small actions make a difference</Text>
            <Text style={styles.infoCardText}>
              Recycling, composting, and donating usable items can help reduce waste. Disposal
              guidance varies by location, so check your local program for the rules where you live.
            </Text>
          </View>
        </View>

        <View style={[styles.illustration, compact && styles.illustrationCompact]}>
          <View style={styles.sun} />
          <View style={styles.orbit} />
          <View style={styles.planet}>
            <Text style={styles.planetEmoji}>🌍</Text>
          </View>
          <View style={[styles.floatingCard, styles.recycleCard]}>
            <Text style={styles.cardIcon}>♻️</Text>
            <Text style={styles.cardText}>Recycle</Text>
          </View>
          <View style={[styles.floatingCard, styles.compostCard]}>
            <Text style={styles.cardIcon}>🌱</Text>
            <Text style={styles.cardText}>Compost</Text>
          </View>
          <Text style={styles.illustrationCaption}>A brighter future starts with small things.</Text>
        </View>
      </View>

      <View style={[styles.steps, compact && styles.stepsCompact]}>
        <View style={styles.step}>
          <Text style={styles.stepIcon}>📸</Text>
          <View>
            <Text style={styles.stepTitle}>Point & scan</Text>
            <Text style={styles.stepDescription}>Show us what you're sorting</Text>
          </View>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.step}>
          <Text style={styles.stepIcon}>🌿</Text>
          <View>
            <Text style={styles.stepTitle}>Get a clear answer</Text>
            <Text style={styles.stepDescription}>Practical tips, minus the guesswork</Text>
          </View>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.step}>
          <Text style={styles.stepIcon}>🌎</Text>
          <View>
            <Text style={styles.stepTitle}>Make it count</Text>
            <Text style={styles.stepDescription}>Better habits add up over time</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F8F0" },
  page: { flexGrow: 1, alignItems: "center", paddingHorizontal: 28 },
  header: {
    width: "100%",
    maxWidth: 1120,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  backButton: { paddingVertical: 8, paddingRight: 12, marginRight: 8 },
  backText: { color: "#286B42", fontSize: 16, fontWeight: "700" },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCEBD5",
  },
  brandLeaf: { color: "#267044", fontSize: 24, fontWeight: "700" },
  brandName: { color: "#183D2A", fontSize: 18, fontWeight: "800", marginLeft: 10 },
  headerNote: { color: "#758477", fontSize: 13, marginLeft: "auto" },
  hero: {
    width: "100%",
    maxWidth: 1040,
    flex: 1,
    minHeight: 470,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 48,
    paddingVertical: 44,
  },
  heroCompact: { flexDirection: "column", justifyContent: "center", gap: 28, paddingVertical: 36 },
  copy: { flex: 1, maxWidth: 520 },
  copyCompact: { width: "100%", alignItems: "center" },
  eyebrow: { color: "#4D8158", fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  title: {
    color: "#193B2A",
    fontSize: 58,
    fontWeight: "800",
    lineHeight: 64,
    letterSpacing: -2,
    marginTop: 16,
  },
  titleCompact: { fontSize: 44, lineHeight: 50, letterSpacing: -1.5, textAlign: "center" },
  titleAccent: { color: "#4E8A50" },
  description: {
    color: "#5D6E60",
    fontSize: 17,
    lineHeight: 27,
    marginTop: 20,
    maxWidth: 450,
  },
  descriptionCompact: { textAlign: "center" },
  infoCard: { backgroundColor: "#E8F0E2", borderRadius: 18, padding: 18, marginTop: 24, maxWidth: 450 },
  infoCardTitle: { color: "#274A31", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  infoCardText: { color: "#5D6E60", fontSize: 14, lineHeight: 22 },
  illustration: {
    width: 390,
    height: 340,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 34,
    backgroundColor: "#E8F0E2",
    overflow: "hidden",
  },
  illustrationCompact: { width: "100%", maxWidth: 390, height: 280 },
  sun: {
    position: "absolute",
    top: 28,
    right: 52,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F7D98B",
    opacity: 0.8,
  },
  orbit: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: "#BDD4B6",
  },
  planet: {
    width: 164,
    height: 164,
    borderRadius: 82,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F5DE",
    borderWidth: 8,
    borderColor: "#D6E5CB",
  },
  planetEmoji: { fontSize: 88 },
  floatingCard: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    shadowColor: "#1E402C",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  recycleCard: { left: 18, top: 80 },
  compostCard: { right: 16, bottom: 76 },
  cardIcon: { fontSize: 20 },
  cardText: { color: "#31563B", fontSize: 13, fontWeight: "700" },
  illustrationCaption: {
    position: "absolute",
    bottom: 24,
    color: "#67806A",
    fontSize: 13,
    fontWeight: "600",
  },
  steps: {
    width: "100%",
    maxWidth: 1040,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#DDE7D8",
    paddingTop: 22,
    paddingBottom: 8,
    gap: 20,
  },
  stepsCompact: { alignItems: "flex-start", flexDirection: "column", gap: 16, paddingTop: 20 },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepIcon: { fontSize: 24 },
  stepTitle: { color: "#274A31", fontSize: 14, fontWeight: "700" },
  stepDescription: { color: "#798578", fontSize: 12, marginTop: 3 },
  stepDivider: { height: 30, width: 1, backgroundColor: "#DDE7D8" },
});