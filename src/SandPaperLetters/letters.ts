interface Letter {
    upper: string;
    lower: string;
}

const Letter = (i: number): Letter => ({
    upper: String.fromCharCode(65 + i),
    lower: String.fromCharCode(97 + i)
});

const letters = Array.from({ length: 26 }, (_, i) => Letter(i));

export default letters;