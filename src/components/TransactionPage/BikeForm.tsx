function BikeForm() {
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [color, setColor] = useState("");


    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log("Make: ", make);
        console.log("Model: ", model)
        console.log("Color: ", color)
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>Make:
            <input
                type="text"
                name="make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
            />
            </label>
            <label>Model:
                <input 
                    type="text" 
                    name="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                />
            </label>
            <label>Color:
                <input
                    type="text"
                    name="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                />
            </label>
            <input type="submit" />
        </form>
    )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<BikeForm />);