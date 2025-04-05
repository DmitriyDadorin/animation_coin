import "./App.css";
import CoinWithEmbeddedStars from "./Coin3D";

function App() {
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
          width={100}
          height={100}
          outerRingColor="#d5d5d5"
          innerCircleColor="#d5d5d5"
          starColor="#919191"
          edgeColor="#949494"
        />
        <CoinWithEmbeddedStars width={100} height={100} />
        <CoinWithEmbeddedStars
          width={150}
          height={150}
          bounce
          bounceAmplitude={0.3}
        />
        <CoinWithEmbeddedStars
          width={100}
          height={100}
          // bounce
          // bounceAmplitude={0.3}
          outerRingColor="#e6c0ff"
          innerCircleColor="#e6c0ff"
          starColor="#c1a0d3"
          edgeColor="#d2b5e5"
        />
      </div>
    </>
  );
}

export default App;
