const fs = require('fs');

class RationalNumber {
    constructor(numerator, denominator = BigInt(1)) {
        if (denominator === BigInt(0)) {
            throw new Error("Denominator cannot be zero.");
        }
        if (denominator < BigInt(0)) {
            numerator = -numerator;
            denominator = -denominator;
        }
        const gcd = this.gcd(numerator, denominator);
        this.numerator = numerator / gcd;
        this.denominator = denominator / gcd;
    }

    gcd(a, b) {
        a = a >= BigInt(0) ? a : -a;
        b = b >= BigInt(0) ? b : -b;
        while (b !== BigInt(0)) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    add(other) {
        const numerator = this.numerator * other.denominator + other.numerator * this.denominator;
        const denominator = this.denominator * other.denominator;
        return new RationalNumber(numerator, denominator);
    }

    subtract(other) {
        const numerator = this.numerator * other.denominator - other.numerator * this.denominator;
        const denominator = this.denominator * other.denominator;
        return new RationalNumber(numerator, denominator);
    }

    multiply(other) {
        const numerator = this.numerator * other.numerator;
        const denominator = this.denominator * other.denominator;
        return new RationalNumber(numerator, denominator);
    }

    divide(other) {
        if (other.numerator === BigInt(0)) {
            throw new Error("Cannot divide by zero.");
        }
        const numerator = this.numerator * other.denominator;
        const denominator = this.denominator * other.numerator;
        return new RationalNumber(numerator, denominator);
    }

    toString() {
        if (this.denominator === BigInt(1)) {
            return this.numerator.toString();
        } else {
            return `${this.numerator.toString()}/${this.denominator.toString()}`;
        }
    }
}

// Function to parse large numbers in different bases using BigInt
function parseBigInt(str, base) {
    const digits = str.trim().toLowerCase().split('');
    let result = BigInt(0);
    const baseBigInt = BigInt(base);
    const digitMap = {};
    for (let i = 0; i <= 9; i++) {
        digitMap[i.toString()] = BigInt(i);
    }
    for (let i = 0; i < 26; i++) {
        digitMap[String.fromCharCode('a'.charCodeAt(0) + i)] = BigInt(10 + i);
    }

    for (const digit of digits) {
        if (!(digit in digitMap) || digitMap[digit] >= baseBigInt) {
            throw new Error(`Invalid digit '${digit}' for base ${base}`);
        }
        result = result * baseBigInt + digitMap[digit];
    }
    return result;
}

// Function to compute Lagrange interpolation at x = 0 using RationalNumber
function lagrangeInterpolation(x, xValues, yValues) {
    let result = new RationalNumber(BigInt(0));
    const k = xValues.length;

    for (let i = 0; i < k; i++) {
        let term = new RationalNumber(yValues[i]);

        for (let j = 0; j < k; j++) {
            if (i !== j) {
                const numerator = new RationalNumber(x - xValues[j]);
                const denominator = new RationalNumber(xValues[i] - xValues[j]);
                const fraction = numerator.divide(denominator);
                term = term.multiply(fraction);
            }
        }
        result = result.add(term);
    }

    return result;
}

function solvePolynomial(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.keys || !data.keys.n || !data.keys.k) {
        throw new Error("Invalid JSON structure. Expected keys 'n' and 'k' under 'keys'.");
    }

    const n = BigInt(data.keys.n);
    const k = Number(data.keys.k);

    const xValues = [];
    const yValues = [];

    for (const key in data) {
        if (key !== "keys") {
            const x = BigInt(key);
            const base = parseInt(data[key].base);
            const valueStr = data[key].value;
            const y = parseBigInt(valueStr, base);
            xValues.push(x);
            yValues.push(y);
        }
    }

    const sortedPoints = xValues.map((x, idx) => ({ x, y: yValues[idx] }))
        .sort((a, b) => (a.x < b.x ? -1 : 1));

    const xVals = sortedPoints.slice(0, k).map(p => p.x);
    const yVals = sortedPoints.slice(0, k).map(p => p.y);

    const c = lagrangeInterpolation(BigInt(0), xVals, yVals);

    if (c.denominator !== BigInt(1)) {
        throw new Error("The calculated constant term is not an integer.");
    }

    return c.numerator.toString();
}

// Test cases
const testCase1Path = 'testcase1.json';
const testCase2Path = 'testcase2.json';

try {
    const secret1 = solvePolynomial(testCase1Path);
    console.log(secret1);
} catch (error) {
    console.error("Error solving test case 1:", error.message);
}

try {
    const secret2 = solvePolynomial(testCase2Path);
    console.log(secret2);
} catch (error) {
    console.error("Error solving test case 2:", error.message);
}
