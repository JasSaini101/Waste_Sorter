import { CameraView, useCameraPermissions } from "expo-camera";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { scan, ScanResult } from "../api";
import { currentCoords } from "../location";

const CAMERA_CONSENT_KEY = "camera-consent";

type Props = {
  onResult: (result: ScanResult) => void;
  onLookup: () => void;
};

export default function ScanScreen({ onResult, onLookup }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [consentLoaded, setConsentLoaded] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  // The photo just taken, shown in place of the live camera while it's being identified.
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CAMERA_CONSENT_KEY)
      .then((consent) => {
        if (!active) return;
        if (consent === "granted") setCameraReady(true);
        setConsentLoaded(true);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Couldn't load your saved camera choice.");
        setConsentLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!permission?.granted) return;
    setCameraReady(true);
    AsyncStorage.setItem(CAMERA_CONSENT_KEY, "granted").catch((e: unknown) => {
      setError(e instanceof Error ? e.message : "Couldn't save your camera choice.");
    });
  }, [permission?.granted]);

  async function getCameraAccess() {
    if (permission && !permission.granted && !permission.canAskAgain) {
      throw new Error("Camera access is disabled. You can enable it in your device settings.");
    }

    const currentPermission = permission?.granted ? permission : await requestPermission();
    if (!currentPermission.granted) {
      throw new Error("Camera access is needed to scan an item. You can allow it in your browser or device settings.");
    }

    setCameraReady(true);
    await AsyncStorage.setItem(CAMERA_CONSENT_KEY, "granted");
  }

  async function openCamera() {
    setRequestingPermission(true);
    setError(null);
    try {
      await getCameraAccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't request camera access. Please try again.");
    } finally {
      setRequestingPermission(false);
    }
  }

  if (!cameraReady && !consentLoaded) {
    return (
      <View style={styles.introScreen}>
        <ActivityIndicator color="#286B42" />
      </View>
    );
  }

  if (!cameraReady) {
    return (
      <View
        style={[
          styles.introScreen,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.introCard}>
          {/* <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}>⌾</Text>
          </View> */}
          <Text style={styles.introTitle}>Camera access needed</Text>
          <Text style={styles.introDescription}>
            WasteLess uses your camera to take a picture of an item and identify how to dispose of it.
          </Text>
          {error && <Text style={styles.permissionError}>{error}</Text>}
          <Pressable
            style={[styles.startButton, requestingPermission && styles.buttonDisabled]}
            onPress={openCamera}
            disabled={requestingPermission}
            accessibilityRole="button"
          >
            {requestingPermission ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>Allow camera</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.lookupButton}
            onPress={onLookup}
            disabled={requestingPermission}
            accessibilityRole="button"
          >
            <Text style={styles.lookupButtonText}>Look up an item instead</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
      setSnapshot(photo.uri);
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
      // Back to the live camera if the scan failed. On success this screen closes anyway.
      setSnapshot(null);
    }
  }

  return (
    <View style={styles.fill}>
      <CameraView ref={camera} style={styles.fill} facing="back" />
      {snapshot && (
        <Image
          source={{ uri: snapshot }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityLabel="The photo you just took"
        />
      )}

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.hint}>
          {snapshot ? "Photo taken. Identifying the item…" : "Take a picture of the item to dispose of"}
        </Text>
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
  introScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F5F8F0",
  },
  introCard: {
    width: "100%",
    maxWidth: 480,
    alignItems: "center",
    padding: 30,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#DDE7D8",
    backgroundColor: "#FAFDF8",
  },
  cameraIcon: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 38,
    backgroundColor: "#E8F0E2",
    marginBottom: 22,
  },
  cameraIconText: { color: "#286B42", fontSize: 42, fontWeight: "700" },
  introEyebrow: { color: "#4D8158", fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  introTitle: {
    color: "#193B2A",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    textAlign: "center",
    marginTop: 12,
  },
  introDescription: {
    color: "#5D6E60",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 24,
  },
  permissionError: {
    color: "#9B302A",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  startButton: {
    width: "100%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#286B42",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonDisabled: { opacity: 0.7 },
  startButtonText: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  lookupButton: { width: "100%", alignItems: "center", paddingVertical: 16, marginTop: 4 },
  lookupButtonText: { color: "#286B42", fontSize: 15, fontWeight: "700" },
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
