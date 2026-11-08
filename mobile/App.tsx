import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { warmUp } from "./api";
import LookupScreen from "./screens/LookupScreen";
import ResultScreen, { ResultInfo } from "./screens/ResultScreen";
import ScanScreen from "./screens/ScanScreen";
import WelcomeScreen from "./screens/WelcomeScreen";

// A tiny state machine instead of a navigation library.
type InfoReturnScreen = { name: "lookup" } | { name: "result"; result: ResultInfo };
type Screen =
  | { name: "scan" }
  | { name: "lookup" }
  | { name: "result"; result: ResultInfo }
  | { name: "info"; returnTo: InfoReturnScreen };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "scan" });

  useEffect(warmUp, []);

  const goScan = () => setScreen({ name: "scan" });
  const goLookup = () => setScreen({ name: "lookup" });
  const openInfo = (returnTo: InfoReturnScreen) => setScreen({ name: "info", returnTo });

  return (
    <SafeAreaProvider>
      <StatusBar style={screen.name === "lookup" || screen.name === "info" ? "dark" : "light"} />
      {screen.name === "scan" && (
        <ScanScreen
          onLookup={goLookup}
          onResult={(r) => {
            setScreen({
              name: "result",
              result: {
                rule: r.rule,
                found: r.found,
                confident: r.confident,
                confidence: r.confidence,
                nearby: r.nearby,
              },
            })
            }
          }
        />
      )}
      {screen.name === "lookup" && (
        <LookupScreen
          onBack={goScan}
          onInfo={() => openInfo({ name: "lookup" })}
          onPick={(rule) => {
            setScreen({
              name: "result",
              result: { rule, found: true, confident: true, confidence: null },
            });
          }}
        />
      )}
      {screen.name === "result" && (
        <ResultScreen
          result={screen.result}
          onScanAgain={goScan}
          onLookup={goLookup}
          onInfo={() => openInfo({ name: "result", result: screen.result })}
        />
      )}
      {screen.name === "info" && (
        <WelcomeScreen onBack={() => setScreen(screen.returnTo)} />
      )}
    </SafeAreaProvider>
  );
}
