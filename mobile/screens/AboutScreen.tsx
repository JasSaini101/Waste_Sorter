import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ItemIllustration from "../components/ItemIllustration";

type Props = {
  onBack: () => void;
};

export default function AboutScreen({ onBack }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 1024;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.page,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.backHeader}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>
      <View style={styles.header}>
        <Image
          source={require("../assets/wasteLess.png")}
          style={styles.brandLogo}
          resizeMode="contain"
          accessibilityLabel="WasteLess"
        />
      </View>

      <View style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.copy, compact && styles.copyCompact]}>
          <Text style={styles.eyebrow}>A SIMPLE TOOL TO DISPOSE BETTER</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>
            Good choices{"\n"}
            <Text style={styles.titleAccent}>(don't) go to waste.</Text>
          </Text>
          <Text style={[styles.description, compact && styles.descriptionCompact]}>
            WasteLess helps you figure out what to do with everyday disposable items. Scan something for an
            identification, or browse the guide for instructions when you know what you're sorting.
          </Text>
          <View style={styles.goalSection}>
            <Text style={styles.goalEyebrow}>OUR GOAL</Text>
            <Text style={styles.goalMessage}>
              Bridging the knowledge gap that causes improper disposal (like pizza boxes in recycling)
              through AI-powered classification and guidance.
            </Text>
          </View>
        </View>

        <View style={[styles.illustration, compact && styles.illustrationCompact]}>
          <View style={styles.sun} />
          <View style={styles.planet}>
            <WorldIllustration />
          </View>
          <View style={[styles.floatingCard, styles.recycleCard]}>
            <ItemIllustration itemKey="PAPER" size={34} backgroundColor="#F5F8F0" />
            <Text style={styles.cardText}>Recycle</Text>
          </View>
          <View style={[styles.floatingCard, styles.compostCard]}>
            <ItemIllustration itemKey="BIODEGRADABLE" size={34} backgroundColor="#F5F8F0" />
            <Text style={styles.cardText}>Compost</Text>
          </View>
          <Text style={styles.illustrationCaption}>A brighter future starts with small things.</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Small actions make a difference</Text>
        <Text style={styles.infoCardText}>
          Recycling, composting, and donating usable items can help reduce waste. Disposal
          guidance varies by location, so check your local program for the rules where you live.
        </Text>
      </View>

      <View style={[styles.steps, compact && styles.stepsCompact]}>
        <View style={styles.step}>
          <CameraIllustration />
          <View>
            <Text style={styles.stepTitle}>Point & scan</Text>
            <Text style={styles.stepDescription}>Show us what you're sorting</Text>
          </View>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.step}>
          <AnswerIllustration />
          <View>
            <Text style={styles.stepTitle}>Get a clear answer</Text>
            <Text style={styles.stepDescription}>Practical tips, minus the guesswork</Text>
          </View>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.step}>
          <SproutIllustration />
          <View>
            <Text style={styles.stepTitle}>Make it count</Text>
            <Text style={styles.stepDescription}>Better habits add up over time</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function WorldIllustration() {
  return (
    <View style={styles.world}>
      <View style={styles.worldNorthAmerica}>
        <View style={styles.northAmericaUpper} />
        <View style={styles.northAmericaLower} />
      </View>
      <View style={styles.worldSouthAmerica} />
      <View style={styles.worldEurope} />
      <View style={styles.worldAfrica} />
      <View style={styles.worldAsia} />
      <View style={styles.worldAustralia} />
    </View>
  );
}

function AnswerIllustration() {
  return (
    <View style={styles.answerIcon}>
      <View style={styles.answerPage}>
        <View style={styles.answerLine} />
        <View style={[styles.answerLine, styles.answerShortLine]} />
        <View style={[styles.answerLine, styles.answerMediumLine]} />
      </View>
      <View style={styles.answerCheck}>
        <View style={styles.answerCheckShort} />
        <View style={styles.answerCheckLong} />
      </View>
    </View>
  );
}

function SproutIllustration() {
  return (
    <View style={styles.sproutIcon}>
      <View style={styles.sproutStem} />
      <View style={styles.sproutLeafLeft} />
      <View style={styles.sproutLeafRight} />
      <View style={styles.sproutSoil} />
    </View>
  );
}

function CameraIllustration() {
  return (
    <View style={styles.cameraIcon}>
      <View style={styles.cameraTop} />
      <View style={styles.cameraBody}>
        <View style={styles.cameraLensOuter}>
          <View style={styles.cameraLensInner} />
        </View>
        <View style={styles.cameraFlash} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F8F0" },
  page: { flexGrow: 1, alignItems: "center", paddingHorizontal: 28 },
  backHeader: {
    width: "100%",
    maxWidth: 1120,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  header: {
    width: "100%",
    maxWidth: 1120,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  backButton: { paddingVertical: 8, paddingRight: 12, marginRight: 8 },
  backText: { color: "#286B42", fontSize: 14, fontWeight: "700" },
  brandLogo: { width: 280, height: 66 },
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
  copy: { flex: 1, minWidth: 0, maxWidth: 520 },
  copyCompact: { width: "100%", alignItems: "center" },
  eyebrow: { color: "#4D8158", fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  title: {
    width: "100%",
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
    width: "100%",
    color: "#5D6E60",
    fontSize: 17,
    lineHeight: 27,
    marginTop: 20,
    maxWidth: 450,
  },
  descriptionCompact: { textAlign: "center" },
  infoCard: {
    width: "100%",
    maxWidth: 1040,
    backgroundColor: "#E8F0E2",
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
    marginBottom: 28,
  },
  infoCardTitle: { color: "#274A31", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  infoCardText: { color: "#5D6E60", fontSize: 14, lineHeight: 22 },
  goalSection: {
    width: "100%",
    maxWidth: 450,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDE7D8",
    backgroundColor: "#FAFDF8",
    marginTop: 24,
  },
  goalEyebrow: { color: "#4D8158", fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  goalMessage: { color: "#274A31", fontSize: 18, fontWeight: "600", lineHeight: 28, marginTop: 10 },
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
  world: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: "hidden",
    backgroundColor: "#6EABC1",
    borderWidth: 3,
    borderColor: "#5C91A4",
  },
  worldNorthAmerica: {
    position: "absolute",
    top: 20,
    left: 16,
    width: 30,
    height: 35,
    transform: [{ rotate: "-25deg" }],
  },
  northAmericaUpper: {
    position: "absolute",
    top: 0,
    left: 1,
    width: 25,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#83A96D",
  },
  northAmericaLower: {
    position: "absolute",
    top: 15,
    left: 12,
    width: 15,
    height: 22,
    borderRadius: 8,
    backgroundColor: "#83A96D",
    transform: [{ rotate: "-18deg" }],
  },
  worldSouthAmerica: {
    position: "absolute",
    top: 55,
    left: 40,
    width: 16,
    height: 37,
    borderRadius: 9,
    backgroundColor: "#83A96D",
    transform: [{ rotate: "-12deg" }],
  },
  worldEurope: {
    position: "absolute",
    top: 26,
    left: 58,
    width: 19,
    height: 14,
    borderRadius: 8,
    backgroundColor: "#83A96D",
    transform: [{ rotate: "12deg" }],
  },
  worldAfrica: {
    position: "absolute",
    top: 39,
    left: 62,
    width: 24,
    height: 39,
    borderRadius: 13,
    backgroundColor: "#83A96D",
    transform: [{ rotate: "-8deg" }],
  },
  worldAsia: {
    position: "absolute",
    top: 21,
    right: 11,
    width: 35,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#83A96D",
    transform: [{ rotate: "12deg" }],
  },
  worldAustralia: {
    position: "absolute",
    right: 15,
    bottom: 22,
    width: 15,
    height: 9,
    borderRadius: 6,
    backgroundColor: "#83A96D",
    transform: [{ rotate: "18deg" }],
  },
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
  cameraIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DDE7D8",
    backgroundColor: "#E8F0E2",
  },
  cameraTop: {
    position: "absolute",
    top: 9,
    left: 12,
    width: 13,
    height: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: "#739B79",
  },
  cameraBody: {
    width: 34,
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    borderRadius: 6,
    backgroundColor: "#8BAF8A",
  },
  cameraLensOuter: {
    width: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#E8F0E2",
    borderWidth: 2,
    borderColor: "#607D68",
  },
  cameraLensInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#6F9A82" },
  cameraFlash: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#F7D98B" },
  answerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DDE7D8",
    backgroundColor: "#E8F0E2",
  },
  answerPage: {
    width: 22,
    height: 27,
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#C9D8C8",
    backgroundColor: "#FAFDF8",
  },
  answerLine: { width: 12, height: 2, borderRadius: 1, backgroundColor: "#A9C6AA" },
  answerShortLine: { width: 8 },
  answerMediumLine: { width: 10 },
  answerCheck: {
    position: "absolute",
    right: 3,
    bottom: 4,
    width: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#4F966A",
    borderWidth: 2,
    borderColor: "#E8F0E2",
  },
  answerCheckShort: {
    position: "absolute",
    left: 3,
    top: 7,
    width: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  answerCheckLong: {
    position: "absolute",
    left: 5,
    top: 6,
    width: 7,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-48deg" }],
  },
  sproutIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DDE7D8",
    backgroundColor: "#E8F0E2",
  },
  sproutStem: {
    position: "absolute",
    top: 13,
    left: 20,
    width: 3,
    height: 17,
    borderRadius: 2,
    backgroundColor: "#648B58",
  },
  sproutLeafLeft: {
    position: "absolute",
    top: 10,
    left: 9,
    width: 15,
    height: 9,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: "#83A96D",
    transform: [{ rotate: "18deg" }],
  },
  sproutLeafRight: {
    position: "absolute",
    top: 8,
    right: 7,
    width: 15,
    height: 9,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: "#67955A",
    transform: [{ rotate: "-20deg" }],
  },
  sproutSoil: {
    position: "absolute",
    bottom: 8,
    width: 23,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#B58D5D",
  },
  stepTitle: { color: "#274A31", fontSize: 14, fontWeight: "700" },
  stepDescription: { color: "#798578", fontSize: 12, marginTop: 3 },
  stepDivider: { height: 30, width: 1, backgroundColor: "#DDE7D8" },
});