// New file for pricing component
interface PricingModalProps {
  onClose: () => void;
  onPurchase: (credits: number) => void;
}

export default function PricingModal({
  onClose,
  onPurchase,
}: PricingModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg">
        <h2>Pricing (INR)</h2>
        <button
          onClick={() => onPurchase(10)}
          className="block mb-2 bg-green-500 text-white px-4 py-2"
        >
          ₹2149 → 10 credits
        </button>
        <button
          onClick={() => onPurchase(25)}
          className="block mb-2 bg-green-500 text-white px-4 py-2"
        >
          ₹2299 → 25 credits
        </button>
        <button
          onClick={() => onPurchase(50)}
          className="block mb-2 bg-green-500 text-white px-4 py-2"
        >
          ₹4499 → 50 credits
        </button>
        <button
          onClick={() => onPurchase(120)}
          className="block mb-2 bg-green-500 text-white px-4 py-2"
        >
          ₹7999 → 120 credits
        </button>
        <button onClick={onClose} className="text-gray-500">
          Close
        </button>
      </div>
    </div>
  );
}
