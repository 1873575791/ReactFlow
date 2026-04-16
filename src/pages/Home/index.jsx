import { useState } from "react";

function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className="max-w-3xl mx-auto my-10 p-5 text-center">
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
    </div>
  );
}

export default Home;
