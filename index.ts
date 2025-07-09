var fileName = "main.org"

fileName = process.argv[2] || fileName;

const ReservedKeywords = [
    "var",
    "mod",
    "realloc",
    "if",
    "else",
    "while",
    "call",
    "syscall",
    "function",
    "return",
]

type TokenType = {
    type: string;
    value: string;
}

type ValueTypes = { dimentions: number[], type: "int8" | "int16" | "int32" | "int64" | "uint8" | "uint16" | "uint32" | "uint64" | "float" | "double" | "char" | "pointer" }

type AllocationForPointerType = {
    type: ValueTypes;
}

type FreeMemoryType = {
    address: ExpressionType;
}

type ModifyPointerValueType = {
    address: ExpressionType;
    newValue: ExpressionType;
}

type VariableDeclarationType = {
    type: ValueTypes;
    name: string;
    expression: ExpressionType;
}

type ModifyVariableType = {
    variable: VariableDeclarationType;
    newExpression: ExpressionType;
}

type ReallocVariableType = {
    variable: VariableDeclarationType;
    newType: ValueTypes;
}

type IfType = {
    condition: ExpressionType;
    body: ExpressionType;
}

type ElseIfType = {
    condition: ExpressionType;
    body: ExpressionType;
}

type ElseType = {
    body: ExpressionType;
}

type IfElseChainType = {
    if: IfType;
    elseIfs: ElseIfType[] | null;
    else: ElseType | null;
}

type WhileType = {
    condition: ExpressionType;
    body: ExpressionType;
}

type SystemCallType = {
    functionName: string;
    parameters: ExpressionType;
}

type FunctionParameterType = {
    type: ValueTypes;
    name: string;
}

type FunctionDeclarationType = {
    name: string;
    returnType: ValueTypes;
    parameters: FunctionParameterType[];
    body: ExpressionType;
}

type FunctionCallType = {
    function: FunctionDeclarationType;
    parameters: FunctionParameterType[];
}

type MathExpressionType = {
    left: ExpressionType;
    operator: "+" | "-" | "*" | "/" | "%" | "^";
    right: ExpressionType;
}

type ReturnType = ExpressionType 

type SingleExpressionType = (
    {
        type:
        "variableDeclaration" |
        "modifyVariable" |
        "reallocVariable" |
        "ifElseChain" |
        "whileLoop" |
        "systemCall" |
        "functionCall" |
        "functionDeclaration" |
        "mathExpression" |
        "return" |
        "number" |
        "string" |
        "variable" |
        "freeMemory" |
        "allocationForPointer" |
        "modifyPointerValue";
        expression:
        VariableDeclarationType |
        ModifyVariableType |
        ReallocVariableType |
        IfElseChainType |
        WhileType |
        SystemCallType |
        FunctionCallType |
        FunctionDeclarationType |
        MathExpressionType |
        ReturnType |
        number |
        string |
        FreeMemoryType |
        AllocationForPointerType |
        ModifyPointerValueType;
    }
)

type ExpressionType = SingleExpressionType[] | SingleExpressionType;

var wordsPossibleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";

function findStatementInsideDelimiters(str: TokenType[], startDelimiter: string, endDelimiter: string): TokenType[] {
    let numberOfOpeningDelimiters = 1;
    let numberOfClosingDelimiters = 0;
    let result = [str[0] ?? { type: "unknown", value: "" }];
    let length = 1
    while (numberOfOpeningDelimiters != numberOfClosingDelimiters) {
        if (str[length] == undefined) return result;
        // @ts-ignore
        if (str[length].value === startDelimiter) {
            numberOfOpeningDelimiters++;
        }
        // @ts-ignore
        else if (str[length].value === endDelimiter) {
            numberOfClosingDelimiters++;
        }
        // @ts-ignore
        result.push(str[length]);
        length++;
    }
    return result;
}

Bun.file(fileName).text().then((content) => {
    handleFile(content);
}).catch((error) => {
    console.error("Error reading file:", error);
})

function handleFile(fileContent: string) {
    // start by removing comments
    let lines: (string | null | undefined)[] = fileContent.split("\n");

    let inCommentBlock = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (typeof line !== "string") continue;

        if (line.startsWith("/*")) {
            inCommentBlock = true;
        }
        if (inCommentBlock) {
            if (line.endsWith("*/")) {
                inCommentBlock = false;
            }
            lines[i] = null
        }

        if (!inCommentBlock && line.includes("//")) {
            // remove everything after the first "//"
            const index = line.indexOf("//");
            lines[i] = line.substring(0, index);
        }
    }
    const outputLines = lines.filter(line => line != null && line != undefined && line.trim() != "").join("\n");

    var currentToken = "";
    var insideQuotes = false;
    var tokens: TokenType[] = [{ type: "curlyBrace", value: "{" }];

    var i = 0
    while (i < outputLines.length) {
        const char = outputLines[i];

        if (!char) {
            i++;
            continue;
        }

        // handle strings
        if (insideQuotes || char == '"') {
            currentToken += char;
            if (char === '"') {
                if (insideQuotes) {
                    tokens.push({ type: "string", value: currentToken });
                    currentToken = "";
                }
                insideQuotes = !insideQuotes
            }
        }

        // handle whitespaces
        else if (char == " " || char == "\n" || char == "\t") {
            i++;
            continue;
        }

        else if (char == "{" || char == "}") {
            tokens.push({ type: "bracket", value: char });
        }

        else if (char == "(" || char == ")") {
            tokens.push({ type: "parenthesis", value: char });
        }

        else if (char == ",") {
            tokens.push({ type: "comma", value: char });
        }

        else if (char == ";") {
            tokens.push({ type: "semicolon", value: char });
        }

        else if (char == "[" || char == "]") {
            tokens.push({ type: "squareBracket", value: char });
        }

        else if (char == ":") {
            tokens.push({ type: "colon", value: char });
        }

        else if (char == "=") {
            if (outputLines[i + 1] == "=") {
                tokens.push({ type: "equals", value: "==" });
                i++; // skip the next character
            }
            else {
                tokens.push({ type: "equal", value: "=" });
            }
        }

        else if (char == "+" || char == "-" || char == "*" || char == "/" || char == "%" || char == "^") {
            tokens.push({ type: "operator", value: char });
        }

        else if (char == "<" || char == ">") {
            if (outputLines[i + 1] == "=") {
                tokens.push({ type: "comparison", value: char + "=" });
                i++; // skip the next character
            } else {
                tokens.push({ type: "comparison", value: char });
            }
        }

        else if (char == "!") {
            if (outputLines[i + 1] == "=") {
                tokens.push({ type: "notEqual", value: "!=" });
                i++; // skip the next character
            } else {
                tokens.push({ type: "not", value: "!" });
            }
        }

        else if (char == "&" || char == "|") {
            if (outputLines[i + 1] == char) {
                tokens.push({ type: "logicalOperator", value: char + char });
                i++; // skip the next character
            }
        }

        else if (wordsPossibleChars.includes(char)) {
            currentToken += char;

            //@ts-ignore
            if (!wordsPossibleChars.includes(outputLines[i + 1])) {
                tokens.push({ type: "word", value: currentToken });
                currentToken = "";
            }
        }

        i++
    }

    tokens.push({ type: "curlyBrace", value: "}" });

    /*
    let fetchedExpression = fetchExpression(tokens);
    console.log(fetchedExpression);
    */

    // output the file to main.out
    Bun.write("main.out", JSON.stringify(tokens, null, 2))
}

function fetchExpression(tokens: TokenType[]): ExpressionType {
    if (tokens[0]?.value != "{") {
        //TODO: handle the case where a variable could be named after a number
        // if it doesn't start with one of the reserved keywords, we return a single expression with type return and the expression of type return has a type of whatever the data returned is;
    }
}

console.log(fetchReturn([{type: "word", value: "123"}]))
function fetchReturn(tokens: TokenType[]): ReturnType {
    if (tokens[0]?.type == "string") {
        // use eval to remove the quotes and the backslashes for formatting purposes
        return { expression: eval(tokens[0].value), type: "string" };
    } else if(checkIfNumber(tokens[0]?.value ?? "a")) {
        return { expression: Number(tokens[0]?.value), type: "number" };
    } 
    return fetchExpression(tokens);
}

function checkIfNumber(str: string): boolean {
    return !isNaN(Number(str));
}
