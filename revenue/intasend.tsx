import { useEffect } from 'react';
import 'intasend-inlinejs-sdk';

const MyScreen = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      new window.IntaSend({
        publicAPIKey: "<Your Public Key>",
        live: false // or true for live environment
      })
      .on("COMPLETE", (response) => { console.log("COMPLETE:", response) })
      .on("FAILED", (response) => { console.log("FAILED", response) })
      .on("IN-PROGRESS", () => { console.log("INPROGRESS ...") });
    }
  }, []);

  return (
    <div>
      <button className="intaSendPayButton" data-amount="10" data-currency="KES">Pay Now</button>
    </div>
  );
};

export default MyScreen;