import { RepairDetails, ItemDetails } from "../../model";

interface CheckoutModalProps {
    repairDetails: RepairDetails[];
    itemDetails?: ItemDetails[];
    totalPrice: number;
    isEmployee: boolean;
    beerBike: boolean;
    handlePaid: () => void;
    closeCheckout: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
    repairDetails,
    itemDetails,
    totalPrice,
    isEmployee,
    beerBike,
    handlePaid,
    closeCheckout,
}) => {
    return (
        <div className="checkout">
            <div className="checkout-content">
                <h2>Repairs</h2>
                <ul>
                    {repairDetails.map((repair) => (
                        <li key={repair.transaction_detail_id}>
                            {repair.Repair.name} - ${repair.Repair.price.toFixed(2)}
                        </li>
                    ))}
                </ul>
                <h2>Parts</h2>
                <ul>
                    {itemDetails === undefined ? (
                        <></>
                    ) : (
                        itemDetails.map((part) => (
                            <li key={part.transaction_detail_id}>
                                {part.Item.name} - $
                                {!isEmployee || beerBike
                                    ? part.Item.standard_price.toFixed(2)
                                    : (part.Item.wholesale_cost * 1.06).toFixed(2)}
                            </li>
                        ))
                    )}
                </ul>
                <h3>${(totalPrice * 1.0825).toFixed(2)}</h3>
                <button
                    onClick={handlePaid}
                    style={{
                        backgroundColor: "green",
                        cursor: "pointer",
                        color: "white",
                        height: "5vh",
                    }}
                >
                    Finish
                </button>
                <button onClick={closeCheckout}>Back</button>
            </div>
        </div>
    );
};

export default CheckoutModal;