import { useRef } from "react";
import "./App.css";
import CoinWithEmbeddedStars, { CoinRef } from "./Coin3D";

function App() {
  const coinRefs = [
    useRef<CoinRef>(null),
    useRef<CoinRef>(null),
    useRef<CoinRef>(null),
    useRef<CoinRef>(null),
  ];

  const handleRestart = () => {
    coinRefs.forEach((ref) => ref.current?.startRotation());
  };

  return (
    <>
      <h1>Монета</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CoinWithEmbeddedStars
          ref={coinRefs[0]}
          width={100}
          height={100}
          outerRingColor="#d5d5d5"
          innerCircleColor="#d5d5d5"
          starColor="#919191"
          edgeColor="#949494"
          autoStopAfterTurns
          numTurns={3}
        />
        <CoinWithEmbeddedStars
          ref={coinRefs[1]}
          width={100}
          height={100}
          autoStopAfterTurns
          numTurns={3}
        />
        <CoinWithEmbeddedStars
          ref={coinRefs[2]}
          width={150}
          height={150}
          bounce
          bounceAmplitude={0.3}
          autoStopAfterTurns
          numTurns={3}
        />
        <CoinWithEmbeddedStars
          ref={coinRefs[3]}
          width={100}
          height={100}
          outerRingColor="#e6c0ff"
          innerCircleColor="#e6c0ff"
          starColor="#c1a0d3"
          edgeColor="#d2b5e5"
          autoStopAfterTurns
          numTurns={3}
        />
      </div>
      <button onClick={handleRestart}>Перезапустить вращение</button>
    </>
  );
}

export default App;
