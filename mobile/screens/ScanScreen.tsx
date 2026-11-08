import { CameraView, useCameraPermissions } from "expo-camera";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { scan, ScanResult } from "../api";
import { currentCoords } from "../location";

type Props = {
  onResult: (result: ScanResult) => void;
  onLookup: () => void;
};

export default function ScanScreen({ onResult, onLookup }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const permissionRequested = useRef(false);
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!permission || permission.granted || permissionRequested.current) return;
    permissionRequested.current = true;
    requestPermission();
  }, [permission, requestPermission]);

  if (!permission) return <View style={styles.center} />;

  async function capture() {
    if (!camera.current || busy) return;
    setBusy(true);
    setError(null);
    // If the server was asleep the first scan can take a while; say so instead of looking frozen.
    const slowTimer = setTimeout(() => setSlow(true), 6000);
    try {
      // Location only if already allowed: the prompt comes later, and only for items that need a drop-off.
      const coords = currentCoords(false);
      const photo = await camera.current.takePictureAsync({ quality: 0.8, shutterSound: false });
      // The model works at 416x416, so a 640px-wide JPEG uploads fast without losing accuracy.
      const resized = await ImageManipulator.manipulate(photo.uri).resize({ width: 640 }).renderAsync();
      const saved = await resized.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
      onResult(await scan(saved.uri, await coords));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setBusy(false);
    }
  }

  return (
    <View style={styles.fill}>
      <CameraView ref={camera} style={styles.fill} facing="back" />

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.hint}>Take a picture of the item to dispose of</Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        {error && <Text style={styles.error}>{error}</Text>}
        {slow && <Text style={styles.hint}>Waking up the server, this can take up to a minute…</Text>}
        <Pressable
          style={[styles.shutter, busy && styles.shutterBusy, hover && styles.shutterHover]}
          onPress={capture}
          disabled={busy}
          accessibilityLabel="Scan item"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {busy ? <ActivityIndicator color="#286B42" size="large" /> : <View style={styles.shutterInner} />}
        </Pressable>
        <Pressable onPress={onLookup} disabled={busy}>
          <Text style={styles.lookup}>Trouble scanning? Look it up here</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  padded: { padding: 32, gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  body: { fontSize: 16, textAlign: "center", color: "#444" },
  primary: { backgroundColor: "#2E7DD7", paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  primaryText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  link: { color: "#2E7DD7", fontSize: 16, marginTop: 8 },
  top: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center" },
  hint: {
    borderRadius: 42,
    borderWidth: 3,
    borderColor: "#193B2A",
    color: "#193B2A",
    fontSize: 15,
    fontWeight: "600",
    backgroundColor: "rgba(245,248,240,0.94)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  bottom: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", gap: 16 },
  error: {
    color: "#fff",
    backgroundColor: "rgba(200,40,40,0.85)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginHorizontal: 24,
    textAlign: "center",
    overflow: "hidden",
  },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: "#F5F8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterHover: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: "#357b58",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBusy: { backgroundColor: "rgba(245,248,240,0.8)" },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#DCEBD5" },
  lookup: {
    borderRadius: 42,
    borderWidth: 3,
    borderColor: "#193B2A",
    color: "#193B2A",
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
    backgroundColor: "rgba(245,248,240,0.94)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    overflow: "hidden",
  },
});
