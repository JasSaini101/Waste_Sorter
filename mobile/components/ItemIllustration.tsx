import { StyleSheet, View } from "react-native";

type Props = {
  itemKey: string | null;
  size?: number;
  backgroundColor?: string;
};

export default function ItemIllustration({
  itemKey,
  size = 52,
  backgroundColor = "#E8F0E2",
}: Props) {
  return (
    <View
      style={[styles.itemVisual, { width: size, height: size, backgroundColor }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={{ transform: [{ scale: size / 52 }] }}>
        {itemKey === "PLASTIC" && (
          <View style={styles.bottle}>
            <View style={styles.bottleCap} />
            <View style={styles.bottleNeck} />
            <View style={styles.bottleBody}>
              <View style={styles.bottleShine} />
              <View style={styles.bottleLabel} />
            </View>
          </View>
        )}
        {itemKey === "GLASS" && (
          <View style={styles.jar}>
            <View style={styles.jarLid} />
            <View style={styles.jarBody}>
              <View style={styles.jarShine} />
              <View style={styles.jarLabel} />
            </View>
          </View>
        )}
        {itemKey === "METAL" && (
          <View style={styles.can}>
            <View style={styles.canTop} />
            <View style={styles.canBody}>
              <View style={styles.canStripe} />
              <View style={styles.canLabel} />
              <View style={styles.canStripe} />
            </View>
            <View style={styles.canBottom} />
          </View>
        )}
        {itemKey === "PAPER" && (
          <View style={styles.paperStack}>
            <View style={[styles.paperSheet, styles.paperBack]} />
            <View style={[styles.paperSheet, styles.paperMiddle]} />
            <View style={[styles.paperSheet, styles.paperFront]}>
              <View style={styles.paperLine} />
              <View style={styles.paperLine} />
              <View style={[styles.paperLine, styles.paperShortLine]} />
            </View>
          </View>
        )}
        {itemKey === "CARDBOARD" && (
          <View style={styles.box}>
            <View style={styles.boxTopLeft} />
            <View style={styles.boxTopRight} />
            <View style={styles.boxFront}>
              <View style={styles.boxTape} />
            </View>
          </View>
        )}
        {itemKey === "BIODEGRADABLE" && (
          <View style={styles.apple}>
            <View style={styles.appleLeaf} />
            <View style={styles.appleStem} />
            <View style={styles.appleLeft} />
            <View style={styles.appleRight} />
            <View style={styles.appleHighlight} />
          </View>
        )}
        {itemKey === "CLOTH" && (
          <View style={styles.shirt}>
            <View style={styles.shirtBody} />
            <View style={styles.shirtSleeveLeft} />
            <View style={styles.shirtSleeveRight} />
            <View style={styles.shirtCollar} />
          </View>
        )}
        {itemKey === "TRASH" && (
          <View style={styles.trashCan}>
            <View style={styles.trashLid} />
            <View style={styles.trashBody}>
              <View style={styles.trashLine} />
              <View style={styles.trashLine} />
              <View style={styles.trashLine} />
            </View>
          </View>
        )}
        {!itemKey && <View style={styles.unknownShape} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemVisual: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DDE7D8",
    overflow: "hidden",
  },
  bottle: { alignItems: "center", width: 29, height: 43 },
  bottleCap: {
    width: 12,
    height: 5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: "#357B58",
  },
  bottleNeck: { width: 10, height: 7, backgroundColor: "#77AD91" },
  bottleBody: {
    width: 27,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#79BFA0",
  },
  bottleShine: {
    position: "absolute",
    left: 4,
    top: 5,
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#DDF3E6",
  },
  bottleLabel: { width: 17, height: 8, borderRadius: 2, backgroundColor: "#F5F8F0" },
  jar: { alignItems: "center", width: 34, height: 34, justifyContent: "flex-end" },
  jarLid: { width: 27, height: 6, borderRadius: 2, backgroundColor: "#76936F" },
  jarBody: {
    width: 31,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    backgroundColor: "#A7C9A6",
  },
  jarShine: {
    position: "absolute",
    left: 4,
    top: 4,
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#F1F7E9",
  },
  jarLabel: { width: 18, height: 9, borderRadius: 2, backgroundColor: "#F5F8F0" },
  can: { width: 28, height: 36, alignItems: "center" },
  canTop: { width: 26, height: 5, borderRadius: 5, backgroundColor: "#74878A" },
  canBody: {
    width: 25,
    height: 27,
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#A8BBC0",
  },
  canStripe: { width: 25, height: 2, backgroundColor: "#71878B" },
  canLabel: { width: 13, height: 7, borderRadius: 2, backgroundColor: "#EAF0E8" },
  canBottom: {
    width: 26,
    height: 4,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: "#71878B",
  },
  paperStack: { width: 35, height: 36, justifyContent: "center", alignItems: "center" },
  paperSheet: {
    position: "absolute",
    width: 25,
    height: 31,
    borderWidth: 1,
    borderColor: "#C9D8C8",
    borderRadius: 2,
  },
  paperBack: { backgroundColor: "#B7CBB6", transform: [{ rotate: "9deg" }, { translateX: 4 }] },
  paperMiddle: { backgroundColor: "#E1E9D9", transform: [{ rotate: "-7deg" }, { translateX: -3 }] },
  paperFront: { backgroundColor: "#FAFDF8", paddingTop: 8, paddingHorizontal: 4, gap: 3 },
  paperLine: { height: 2, backgroundColor: "#A9C6AA", borderRadius: 1 },
  paperShortLine: { width: "65%" },
  box: { width: 36, height: 34, alignItems: "center", justifyContent: "flex-end" },
  boxTopLeft: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 17,
    height: 10,
    backgroundColor: "#D6A96A",
    transform: [{ skewY: "-25deg" }],
  },
  boxTopRight: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 17,
    height: 10,
    backgroundColor: "#E4BC7E",
    transform: [{ skewY: "25deg" }],
  },
  boxFront: {
    width: 29,
    height: 21,
    alignItems: "center",
    backgroundColor: "#C9914D",
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  boxTape: { width: 6, height: 21, backgroundColor: "#E8C88C" },
  apple: { width: 37, height: 38, alignItems: "center", justifyContent: "center" },
  appleLeft: {
    position: "absolute",
    left: 3,
    bottom: 3,
    width: 22,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#D96E4D",
  },
  appleRight: {
    position: "absolute",
    right: 3,
    bottom: 3,
    width: 22,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#C8553F",
  },
  appleHighlight: {
    position: "absolute",
    left: 9,
    bottom: 10,
    width: 4,
    height: 11,
    borderRadius: 2,
    backgroundColor: "#F4B08B",
  },
  appleStem: {
    position: "absolute",
    top: 2,
    left: 19,
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: "#785B37",
    transform: [{ rotate: "12deg" }],
  },
  appleLeaf: {
    position: "absolute",
    top: 2,
    left: 21,
    width: 10,
    height: 6,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: "#67955A",
    transform: [{ rotate: "-20deg" }],
  },
  shirt: { width: 39, height: 36, alignItems: "center", justifyContent: "center" },
  shirtBody: {
    position: "absolute",
    bottom: 2,
    width: 22,
    height: 28,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: "#739B79",
  },
  shirtSleeveLeft: {
    position: "absolute",
    top: 8,
    left: 1,
    width: 13,
    height: 15,
    backgroundColor: "#739B79",
    transform: [{ rotate: "25deg" }],
  },
  shirtSleeveRight: {
    position: "absolute",
    top: 8,
    right: 1,
    width: 13,
    height: 15,
    backgroundColor: "#739B79",
    transform: [{ rotate: "-25deg" }],
  },
  shirtCollar: {
    position: "absolute",
    top: 5,
    width: 9,
    height: 7,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "#E8F0E2",
  },
  trashCan: { width: 32, height: 36, alignItems: "center" },
  trashLid: { width: 31, height: 5, borderRadius: 3, backgroundColor: "#64766D" },
  trashBody: {
    width: 25,
    height: 29,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingTop: 6,
    backgroundColor: "#8D9A91",
  },
  trashLine: { width: 2, height: 17, borderRadius: 1, backgroundColor: "#DCE5DB" },
  unknownShape: { width: 23, height: 23, borderRadius: 12, borderWidth: 4, borderColor: "#B68A36" },
});
