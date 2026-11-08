import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { warmUp } from "./api";
import LookupScreen from "./screens/LookupScreen";
import ResultScreen, { ResultInfo } from "./screens/ResultScreen";
import ScanScreen from "./screens/ScanScreen";

// A tiny state machine instead of a navigation library: three screens is all we need.
type Screen = { name: "scan" } | { name: "lookup" } | { name: "result"; result: ResultInfo };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "scan" });

  useEffect(warmUp, []);

  const goScan = () => setScreen({ name: "scan" });
  const goLookup = () => setScreen({ name: "lookup" });

  return (
    <SafeAreaProvider>
      <StatusBar style={screen.name === "lookup" ? "dark" : "light"} />
      {screen.name === "scan" && (
        <ScanScreen
          onLookup={goLookup}
          onResult={(r) =>
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
        />
      )}
      {screen.name === "lookup" && (
        <LookupScreen
          onBack={goScan}
          onPick={(rule) =>
            setScreen({ name: "result", result: { rule, found: true, confident: true, confidence: null } })
          }
        />
      )}
      {screen.name === "result" && (
        <ResultScreen result={screen.result} onScanAgain={goScan} onLookup={goLookup} />
      )}
    </SafeAreaProvider>
  );
}
